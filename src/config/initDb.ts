import pool from './db';
import dotenv from 'dotenv';

dotenv.config();

export const initDb = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    console.log('Initializing database...');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255)        NOT NULL,
        email       VARCHAR(255)        NOT NULL UNIQUE,
        password    TEXT                NOT NULL,
        role        VARCHAR(20)         NOT NULL DEFAULT 'contributor'
                    CHECK (role IN ('contributor', 'maintainer')),
        created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
      );
    `);
    console.log(' users table ready');

    // Create issues table
    await client.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id           SERIAL PRIMARY KEY,
        title        VARCHAR(150)        NOT NULL,
        description  TEXT                NOT NULL,
        type         VARCHAR(30)         NOT NULL
                     CHECK (type IN ('bug', 'feature_request')),
        status       VARCHAR(20)         NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id  INTEGER             NOT NULL,
        created_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW()
      );
    `);
    console.log(' issues table ready');

    console.log(' Database initialization complete!');
  } catch (err) {
    console.error(' Database initialization failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

initDb();
