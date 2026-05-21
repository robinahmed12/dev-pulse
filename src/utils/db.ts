import pool from '../config/db';
import { QueryResult, QueryResultRow } from 'pg';

/**
 * Execute a single SQL query with optional parameters.
 */
export const query = async <T extends QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  return pool.query<T>(sql, params);
};

/**
 * Execute multiple SQL queries within a single transaction.
 */
export const withTransaction = async <T>(
  callback: (queryFn: typeof query) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const txQuery = <R extends QueryResultRow>(sql: string, params?: unknown[]) =>
      client.query<R>(sql, params);
    const result = await callback(txQuery as typeof query);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
