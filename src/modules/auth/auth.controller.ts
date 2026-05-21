import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { registerUser, loginUser } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../middleware/errorHandler';
import { SignupRequestBody, LoginRequestBody } from '../../types';

export const signup = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as SignupRequestBody;
    const user = await registerUser(body);

    sendSuccess({
      res,
      statusCode: StatusCodes.CREATED,
      message: 'User registered successfully',
      data: user,
    });
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as LoginRequestBody;
    const result = await loginUser(body);

    sendSuccess({
      res,
      statusCode: StatusCodes.OK,
      message: 'Login successful',
      data: result,
    });
  }
);
