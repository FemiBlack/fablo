import { Router } from 'express';
import { body } from 'express-validator';
import { OrgController } from '../controllers/orgController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const orgController = new OrgController();

/**
 * POST /api/v1/organizations
 * Create a new organization
 */
router.post(
  '/',
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('domain').isString().notEmpty().withMessage('Domain is required'),
    body('mspName').optional().isString(),
    body('peerCount').optional().isInt({ min: 1 }),
    body('caPort').optional().isInt({ min: 1024, max: 65535 }),
  ],
  asyncHandler((req, res) => orgController.createOrganization(req, res)),
);

/**
 * GET /api/v1/organizations
 * List all organizations
 */
router.get(
  '/',
  asyncHandler((req, res) => orgController.listOrganizations(req, res)),
);

/**
 * GET /api/v1/organizations/:orgId
 * Get specific organization details
 */
router.get(
  '/:orgId',
  asyncHandler((req, res) => orgController.getOrganization(req, res)),
);

/**
 * POST /api/v1/organizations/:orgId/peers
 * Add peers to existing organization
 */
router.post(
  '/:orgId/peers',
  [
    body('count').isInt({ min: 1 }).withMessage('Count must be at least 1'),
    body('db').optional().isIn(['LevelDb', 'CouchDb']),
  ],
  asyncHandler((req, res) => orgController.addPeers(req, res)),
);

export default router;
