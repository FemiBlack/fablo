import { Request, Response } from 'express';
import { DockerService } from '../services/dockerService';
import { PeerService } from '../services/peerService';
import { ConfigService } from '../services/configService';
import {
  OrganizationRequest,
  OrganizationResponse,
  AddPeerRequest,
  OrgConfig,
  CAConfig,
} from '../types/api';
import { AppError } from '../middleware/errorHandler';

// In-memory storage for organizations (in production, use a database)
const organizations: Map<string, OrganizationResponse> = new Map();

export class OrgController {
  private dockerService: DockerService;
  private peerService: PeerService;
  private configService: ConfigService;

  constructor() {
    this.dockerService = new DockerService();
    this.peerService = new PeerService();
    this.configService = new ConfigService();
  }

  /**
   * Create a new organization
   */
  async createOrganization(req: Request, res: Response): Promise<void> {
    const orgRequest = req.body as OrganizationRequest;

    // Validate request
    if (!orgRequest.name || !orgRequest.domain) {
      throw new AppError('Name and domain are required', 400);
    }

    // Check if organization already exists
    if (organizations.has(orgRequest.name)) {
      throw new AppError(`Organization ${orgRequest.name} already exists`, 409);
    }

    const mspName = orgRequest.mspName || `${orgRequest.name}MSP`;
    const peerCount = orgRequest.peerCount || 1;
    const caPort = orgRequest.caPort || 7054 + organizations.size * 1000;
    const basePort = 7051 + organizations.size * 10000;

    // Start CA container
    const caConfig: CAConfig = {
      name: `ca.${orgRequest.name.toLowerCase()}`,
      orgName: orgRequest.name.toLowerCase(),
      port: caPort,
      adminUser: 'admin',
      adminPassword: 'adminpw',
    };

    const caContainerId = await this.dockerService.startCAContainer(caConfig);
    const caUrl = `http://localhost:${caPort}`;

    // Log CA container ID for debugging
    console.log(`Started CA container: ${caContainerId}`);

    // Start peer containers
    const peers = await this.peerService.startPeers(
      orgRequest.name,
      peerCount,
      basePort,
    );

    // Generate connection profile
    const orgConfig: OrgConfig = {
      name: orgRequest.name,
      domain: orgRequest.domain,
      mspName,
      caPort,
      peerCount,
    };

    const connectionProfile = this.configService.generateConnectionProfile(
      orgConfig,
      peers,
      caUrl,
    );

    // Create organization response
    const organization: OrganizationResponse = {
      id: orgRequest.name,
      name: orgRequest.name,
      domain: orgRequest.domain,
      mspName,
      caUrl,
      peers,
      connectionProfile,
      createdAt: new Date().toISOString(),
    };

    // Store organization
    organizations.set(orgRequest.name, organization);

    res.status(201).json(organization);
  }

  /**
   * Get all organizations
   */
  async listOrganizations(_req: Request, res: Response): Promise<void> {
    const orgList = Array.from(organizations.values());
    res.json(orgList);
  }

  /**
   * Get a specific organization
   */
  async getOrganization(req: Request, res: Response): Promise<void> {
    const { orgId } = req.params;

    const organization = organizations.get(orgId);
    if (!organization) {
      throw new AppError(`Organization ${orgId} not found`, 404);
    }

    res.json(organization);
  }

  /**
   * Add peers to an existing organization
   */
  async addPeers(req: Request, res: Response): Promise<void> {
    const { orgId } = req.params;
    const addPeerRequest = req.body as AddPeerRequest;

    const organization = organizations.get(orgId);
    if (!organization) {
      throw new AppError(`Organization ${orgId} not found`, 404);
    }

    const count = addPeerRequest.count || 1;
    const db = addPeerRequest.db || 'LevelDb';
    const basePort = 7051 + organizations.size * 10000 + organization.peers.length * 1000;

    // Start new peers
    const newPeers = await this.peerService.startPeers(
      orgId,
      count,
      basePort,
      db,
    );

    // Update organization
    organization.peers.push(...newPeers);

    // Update connection profile
    if (organization.connectionProfile) {
      newPeers.forEach((peer) => {
        organization.connectionProfile = this.configService.addPeerToConnectionProfile(
          organization.connectionProfile!,
          orgId,
          peer,
        );
      });
    }

    organizations.set(orgId, organization);

    res.json({
      message: `Added ${count} peer(s) to organization ${orgId}`,
      peers: newPeers,
    });
  }
}
