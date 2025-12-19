import { Router, Request, Response } from 'express';
import { DockerService } from '../services/dockerService';
import { NetworkStatus } from '../types/api';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const dockerService = new DockerService();

/**
 * GET /api/v1/network/status
 * Get network status
 */
router.get(
  '/status',
  asyncHandler(async (_req: Request, res: Response) => {
    const containers = await dockerService.getNetworkContainers('fablo_default');

    const peers = containers.filter((c) => c.name.includes('peer'));
    const orderers = containers.filter((c) => c.name.includes('orderer'));
    const cas = containers.filter((c) => c.name.includes('ca'));

    // Count unique organizations (simplified)
    const orgs = new Set(
      [...peers, ...cas].map((c) => {
        const parts = c.name.split('.');
        return parts[parts.length - 1];
      }),
    );

    const status: NetworkStatus = {
      status: peers.length > 0 ? 'running' : 'stopped',
      organizations: orgs.size,
      peers: peers.length,
      channels: 0, // TODO: Query actual channel information
      orderers: orderers.length,
    };

    res.json(status);
  }),
);

/**
 * GET /api/v1/network/channels
 * List all channels
 */
router.get(
  '/channels',
  asyncHandler(async (_req: Request, res: Response) => {
    // TODO: Implement actual channel query
    res.json([]);
  }),
);

/**
 * POST /api/v1/network/channels/:channelId/organizations
 * Add organization to channel
 */
router.post(
  '/channels/:channelId/organizations',
  asyncHandler(async (_req: Request, res: Response) => {
    // TODO: Implement channel organization addition
    res.json({
      message: 'Not implemented yet',
    });
  }),
);

export default router;
