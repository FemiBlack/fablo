import { DockerService } from './dockerService';
import { PeerInfo, PeerConfig } from '../types/api';
import { AppError } from '../middleware/errorHandler';

export class PeerService {
  private dockerService: DockerService;

  constructor() {
    this.dockerService = new DockerService();
  }

  /**
   * Start a new peer container
   */
  async startPeer(
    orgName: string,
    peerIndex: number,
    basePort: number,
    db: 'LevelDb' | 'CouchDb' = 'LevelDb',
  ): Promise<PeerInfo> {
    try {
      const peerPort = basePort + (peerIndex * 1000);
      const chaincodePort = peerPort + 1;
      const operationsPort = peerPort + 2;

      const peerConfig: PeerConfig = {
        name: `${peerIndex}`,
        orgName,
        port: peerPort,
        chaincodePort,
        operationsPort,
        db,
      };

      if (db === 'CouchDb') {
        peerConfig.couchDbPort = peerPort + 3;
        // TODO: Start CouchDB container for this peer
      }

      const containerId = await this.dockerService.startPeerContainer(peerConfig);
      const peerName = `peer${peerIndex}.${orgName.toLowerCase()}`;

      return {
        id: containerId,
        name: peerName,
        url: `grpc://localhost:${peerPort}`,
        eventUrl: `grpc://localhost:${peerPort}`,
        status: 'running',
      };
    } catch (error) {
      throw new AppError(
        `Failed to start peer: ${(error as Error).message}`,
        500,
        error,
      );
    }
  }

  /**
   * Start multiple peers for an organization
   */
  async startPeers(
    orgName: string,
    count: number,
    basePort: number,
    db: 'LevelDb' | 'CouchDb' = 'LevelDb',
  ): Promise<PeerInfo[]> {
    const peers: PeerInfo[] = [];

    for (let i = 0; i < count; i += 1) {
      const peer = await this.startPeer(orgName, i, basePort, db);
      peers.push(peer);
    }

    return peers;
  }

  /**
   * Stop a peer
   */
  async stopPeer(peerId: string): Promise<void> {
    try {
      await this.dockerService.stopContainer(peerId);
    } catch (error) {
      throw new AppError(
        `Failed to stop peer: ${(error as Error).message}`,
        500,
        error,
      );
    }
  }

  /**
   * Get peer status
   */
  async getPeerStatus(peerId: string): Promise<'running' | 'stopped' | 'error'> {
    try {
      const status = await this.dockerService.getContainerStatus(peerId);

      if (status.error) {
        return 'error';
      }

      return status.running ? 'running' : 'stopped';
    } catch {
      return 'error';
    }
  }
}
