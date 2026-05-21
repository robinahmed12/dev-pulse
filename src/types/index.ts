import { Request } from 'express';

// ─── User Types ────────────────────────────────────────────────────────────────

export type UserRole = 'contributor' | 'maintainer';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export type SafeUser = Omit<User, 'password'>;

export interface JwtPayload {
  id: number;
  name: string;
  role: UserRole;
}

// ─── Issue Types ───────────────────────────────────────────────────────────────

export type IssueType = 'bug' | 'feature_request';
export type IssueStatus = 'open' | 'in_progress' | 'resolved';

export interface Issue {
  id: number;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface IssueWithReporter extends Omit<Issue, 'reporter_id'> {
  reporter: {
    id: number;
    name: string;
    role: UserRole;
  };
}

// ─── Request Body Types ────────────────────────────────────────────────────────

export interface SignupRequestBody {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface CreateIssueRequestBody {
  title: string;
  description: string;
  type: IssueType;
}

export interface UpdateIssueRequestBody {
  title?: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
}

// ─── Query Params ──────────────────────────────────────────────────────────────

export interface IssueQueryParams {
  sort?: 'newest' | 'oldest';
  type?: IssueType;
  status?: IssueStatus;
}

// ─── Extended Request ──────────────────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
