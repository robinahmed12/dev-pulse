import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} from './issues.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../middleware/errorHandler';
import {
  AuthenticatedRequest,
  CreateIssueRequestBody,
  UpdateIssueRequestBody,
  IssueQueryParams,
} from '../../types';

export const createIssueHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const body = req.body as CreateIssueRequestBody;
    const issue = await createIssue(body, req.user!);

    sendSuccess({
      res,
      statusCode: StatusCodes.CREATED,
      message: 'Issue created successfully',
      data: issue,
    });
  }
);

export const getAllIssuesHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const params = req.query as unknown as IssueQueryParams;
    const issues = await getAllIssues(params);

    sendSuccess({
      res,
      statusCode: StatusCodes.OK,
      message: 'Issues retrieved successfully',
      data: issues,
    });
  }
);

export const getSingleIssueHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const issue = await getIssueById(id);

    sendSuccess({
      res,
      statusCode: StatusCodes.OK,
      message: 'Issue retrieved successfully',
      data: issue,
    });
  }
);

export const updateIssueHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const body = req.body as UpdateIssueRequestBody;
    const issue = await updateIssue(id, body, req.user!);

    sendSuccess({
      res,
      statusCode: StatusCodes.OK,
      message: 'Issue updated successfully',
      data: issue,
    });
  }
);

export const deleteIssueHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await deleteIssue(id);

    sendSuccess({
      res,
      statusCode: StatusCodes.OK,
      message: 'Issue deleted successfully',
    });
  }
);
