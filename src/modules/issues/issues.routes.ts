import { Router } from 'express';
import {
  createIssueHandler,
  getAllIssuesHandler,
  getSingleIssueHandler,
  updateIssueHandler,
  deleteIssueHandler,
} from './issues.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// GET  /api/issues          → Public
router.get('/', getAllIssuesHandler);

// GET  /api/issues/:id      → Public
router.get('/:id', getSingleIssueHandler);

// POST /api/issues          → Authenticated (contributor | maintainer)
router.post('/', authenticate, createIssueHandler);

// PATCH /api/issues/:id     → Authenticated (maintainer OR owner contributor w/ open status)
router.patch('/:id', authenticate, updateIssueHandler);

// DELETE /api/issues/:id    → Maintainer only
router.delete('/:id', authenticate, requireRole('maintainer'), deleteIssueHandler);

export default router;
