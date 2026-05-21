import { StatusCodes } from 'http-status-codes';
import { query } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';
import {
  Issue,
  IssueWithReporter,
  CreateIssueRequestBody,
  UpdateIssueRequestBody,
  IssueQueryParams,
  JwtPayload,
  IssueType,
  IssueStatus,
  User,
  UserRole,
} from '../../types';

const VALID_TYPES: IssueType[] = ['bug', 'feature_request'];
const VALID_STATUSES: IssueStatus[] = ['open', 'in_progress', 'resolved'];

// ─── Helper: attach reporter info to issues (no JOINs) ────────────────────────

const attachReporters = async (
  issues: Issue[]
): Promise<IssueWithReporter[]> => {
  if (issues.length === 0) return [];

  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  const result = await query<Pick<User, 'id' | 'name' | 'role'>>(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [reporterIds]
  );

  const reporterMap = new Map<number, { id: number; name: string; role: UserRole }>();
  for (const u of result.rows) {
    reporterMap.set(u.id, u);
  }

  return issues.map(({ reporter_id, ...rest }) => ({
    ...rest,
    reporter: reporterMap.get(reporter_id) ?? {
      id: reporter_id,
      name: 'Unknown',
      role: 'contributor',
    },
  }));
};

// ─── Create Issue ──────────────────────────────────────────────────────────────

export const createIssue = async (
  body: CreateIssueRequestBody,
  currentUser: JwtPayload
): Promise<Issue> => {
  const { title, description, type } = body;

  if (!title || !description || !type) {
    throw new AppError('Title, description, and type are required.', StatusCodes.BAD_REQUEST);
  }

  if (title.length > 150) {
    throw new AppError('Title must not exceed 150 characters.', StatusCodes.BAD_REQUEST);
  }

  if (description.length < 20) {
    throw new AppError('Description must be at least 20 characters.', StatusCodes.BAD_REQUEST);
  }

  if (!VALID_TYPES.includes(type)) {
    throw new AppError(
      `Type must be one of: ${VALID_TYPES.join(', ')}.`,
      StatusCodes.BAD_REQUEST
    );
  }

  const result = await query<Issue>(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, type, currentUser.id]
  );

  return result.rows[0];
};

// ─── Get All Issues ────────────────────────────────────────────────────────────

export const getAllIssues = async (
  params: IssueQueryParams
): Promise<IssueWithReporter[]> => {
  const { sort = 'newest', type, status } = params;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (type) {
    if (!VALID_TYPES.includes(type)) {
      throw new AppError(`Invalid type filter: ${type}`, StatusCodes.BAD_REQUEST);
    }
    conditions.push(`type = $${idx++}`);
    values.push(type);
  }

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      throw new AppError(`Invalid status filter: ${status}`, StatusCodes.BAD_REQUEST);
    }
    conditions.push(`status = $${idx++}`);
    values.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderClause = sort === 'oldest' ? 'ORDER BY created_at ASC' : 'ORDER BY created_at DESC';

  const result = await query<Issue>(
    `SELECT * FROM issues ${whereClause} ${orderClause}`,
    values
  );

  return attachReporters(result.rows);
};

// ─── Get Single Issue ──────────────────────────────────────────────────────────

export const getIssueById = async (id: number): Promise<IssueWithReporter> => {
  const result = await query<Issue>('SELECT * FROM issues WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw new AppError(`Issue with id ${id} not found.`, StatusCodes.NOT_FOUND);
  }

  const [issue] = await attachReporters(result.rows);
  return issue;
};

// ─── Update Issue ──────────────────────────────────────────────────────────────

export const updateIssue = async (
  id: number,
  body: UpdateIssueRequestBody,
  currentUser: JwtPayload
): Promise<Issue> => {
  // Fetch existing issue
  const existing = await query<Issue>('SELECT * FROM issues WHERE id = $1', [id]);

  if (existing.rows.length === 0) {
    throw new AppError(`Issue with id ${id} not found.`, StatusCodes.NOT_FOUND);
  }

  const issue = existing.rows[0];
  const isMaintainer = currentUser.role === 'maintainer';
  const isOwner = issue.reporter_id === currentUser.id;

  // Permission check
  if (!isMaintainer && !isOwner) {
    throw new AppError(
      'You can only update your own issues.',
      StatusCodes.FORBIDDEN
    );
  }

  // Contributors can only edit open issues
  if (!isMaintainer && issue.status !== 'open') {
    throw new AppError(
      'Contributors can only edit issues with status "open".',
      StatusCodes.CONFLICT
    );
  }

  const { title, description, type, status } = body;

  // Only maintainers can change status
  if (status !== undefined && !isMaintainer) {
    throw new AppError(
      'Only maintainers can change issue status.',
      StatusCodes.FORBIDDEN
    );
  }

  // Validate fields if provided
  if (title !== undefined && title.length > 150) {
    throw new AppError('Title must not exceed 150 characters.', StatusCodes.BAD_REQUEST);
  }

  if (description !== undefined && description.length < 20) {
    throw new AppError('Description must be at least 20 characters.', StatusCodes.BAD_REQUEST);
  }

  if (type !== undefined && !VALID_TYPES.includes(type)) {
    throw new AppError(`Type must be one of: ${VALID_TYPES.join(', ')}.`, StatusCodes.BAD_REQUEST);
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    throw new AppError(`Status must be one of: ${VALID_STATUSES.join(', ')}.`, StatusCodes.BAD_REQUEST);
  }

  // Build dynamic SET clause
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
  if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
  if (type !== undefined) { fields.push(`type = $${idx++}`); values.push(type); }
  if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status); }

  if (fields.length === 0) {
    throw new AppError('No fields provided to update.', StatusCodes.BAD_REQUEST);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<Issue>(
    `UPDATE issues SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  return result.rows[0];
};

// ─── Delete Issue ──────────────────────────────────────────────────────────────

export const deleteIssue = async (id: number): Promise<void> => {
  const result = await query<Issue>(
    'DELETE FROM issues WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError(`Issue with id ${id} not found.`, StatusCodes.NOT_FOUND);
  }
};
