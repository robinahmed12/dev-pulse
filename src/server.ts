import app from './app';
import pool from './config/db';

const PORT = process.env.PORT ?? 5000;

const startServer = async (): Promise<void> => {
  try {
    // Test database connection on startup
    await pool.query('SELECT 1');
    console.log(' Database connection verified');

    app.listen(PORT, () => {
      console.log(` DevPulse server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error(' Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
