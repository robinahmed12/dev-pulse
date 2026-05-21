import { Response } from 'express';

interface SuccessResponseOptions {
  res: Response;
  statusCode: number;
  message: string;
  data?: unknown;
}

interface ErrorResponseOptions {
  res: Response;
  statusCode: number;
  message: string;
  errors?: unknown;
}

export const sendSuccess = ({
  res,
  statusCode,
  message,
  data,
}: SuccessResponseOptions): void => {
  const body: Record<string, unknown> = { success: true, message };
  if (data !== undefined) body.data = data;
  res.status(statusCode).json(body);
};

export const sendError = ({
  res,
  statusCode,
  message,
  errors,
}: ErrorResponseOptions): void => {
  const body: Record<string, unknown> = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  res.status(statusCode).json(body);
};
