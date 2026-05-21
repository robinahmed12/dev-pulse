import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { query } from '../../utils/db';
import { signToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import {
  User,
  SafeUser,
  SignupRequestBody,
  LoginRequestBody,
  UserRole,
} from '../../types';

const SALT_ROUNDS = 10;

const VALID_ROLES: UserRole[] = ['contributor', 'maintainer'];

/**
 * Register a new user account.
 */
export const registerUser = async (
  body: SignupRequestBody
): Promise<SafeUser> => {
  const { name, email, password, role = 'contributor' } = body;

  // Validate required fields
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required.', StatusCodes.BAD_REQUEST);
  }

  // Validate role
  if (!VALID_ROLES.includes(role)) {
    throw new AppError(
      `Role must be one of: ${VALID_ROLES.join(', ')}.`,
      StatusCodes.BAD_REQUEST
    );
  }

  // Check if email already taken
  const existing = await query<User>(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  if (existing.rows.length > 0) {
    throw new AppError(
      'A user with this email already exists.',
      StatusCodes.BAD_REQUEST
    );
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await query<SafeUser>(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role]
  );

  return result.rows[0];
};

/**
 * Authenticate a user and return a signed JWT.
 */
export const loginUser = async (
  body: LoginRequestBody
): Promise<{ token: string; user: SafeUser }> => {
  const { email, password } = body;

  if (!email || !password) {
    throw new AppError('Email and password are required.', StatusCodes.BAD_REQUEST);
  }

  // Fetch user including password for comparison
  const result = await query<User>(
    'SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new AppError('Invalid email or password.', StatusCodes.UNAUTHORIZED);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', StatusCodes.UNAUTHORIZED);
  }

  const token = signToken({ id: user.id, name: user.name, role: user.role });

  // Return user without password
  const { password: _pw, ...safeUser } = user;
  return { token, user: safeUser };
};
