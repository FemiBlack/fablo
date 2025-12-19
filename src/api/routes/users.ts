import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from '../controllers/userController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const userController = new UserController();

/**
 * POST /api/v1/organizations/:orgId/users
 * Register new user/staff
 */
router.post(
  '/:orgId/users',
  [
    body('username').isString().notEmpty().withMessage('Username is required'),
    body('role')
      .isIn(['admin', 'user', 'peer'])
      .withMessage('Role must be admin, user, or peer'),
    body('attributes').optional().isObject(),
  ],
  asyncHandler((req, res) => userController.registerUser(req, res)),
);

/**
 * GET /api/v1/organizations/:orgId/users
 * List users in organization
 */
router.get(
  '/:orgId/users',
  asyncHandler((req, res) => userController.listUsers(req, res)),
);

/**
 * GET /api/v1/organizations/:orgId/users/:userId
 * Get specific user details
 */
router.get(
  '/:orgId/users/:userId',
  asyncHandler((req, res) => userController.getUser(req, res)),
);

/**
 * DELETE /api/v1/organizations/:orgId/users/:userId
 * Revoke user access
 */
router.delete(
  '/:orgId/users/:userId',
  asyncHandler((req, res) => userController.revokeUser(req, res)),
);

export default router;
