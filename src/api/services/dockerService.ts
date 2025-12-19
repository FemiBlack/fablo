import Dockerode from 'dockerode';
import {
  ContainerInfo,
  ContainerStatus,
  PeerConfig,
  CAConfig,
} from '../types/api';

export class DockerService {
  private docker: Dockerode;

  constructor() {
    this.docker = new Dockerode();
  }

  /**
   * Start a new peer container
   */
  async startPeerContainer(peerConfig: PeerConfig): Promise<string> {
    const containerName = `peer${peerConfig.name}.${peerConfig.orgName}`;
    const image = 'hyperledger/fabric-peer:2.5';

    const container = await this.docker.createContainer({
      name: containerName,
      Image: image,
      Env: [
        'CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock',
        `CORE_PEER_ID=${containerName}`,
        `CORE_PEER_ADDRESS=${containerName}:${peerConfig.port}`,
        `CORE_PEER_LISTENADDRESS=0.0.0.0:${peerConfig.port}`,
        `CORE_PEER_CHAINCODEADDRESS=${containerName}:${peerConfig.chaincodePort}`,
        `CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:${peerConfig.chaincodePort}`,
        `CORE_PEER_LOCALMSPID=${peerConfig.orgName}MSP`,
        'CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=fablo_default',
        `CORE_OPERATIONS_LISTENADDRESS=0.0.0.0:${peerConfig.operationsPort}`,
      ],
      ExposedPorts: {
        [`${peerConfig.port}/tcp`]: {},
        [`${peerConfig.chaincodePort}/tcp`]: {},
        [`${peerConfig.operationsPort}/tcp`]: {},
      },
      HostConfig: {
        Binds: ['/var/run/docker.sock:/host/var/run/docker.sock'],
        PortBindings: {
          [`${peerConfig.port}/tcp`]: [{ HostPort: String(peerConfig.port) }],
          [`${peerConfig.chaincodePort}/tcp`]: [{ HostPort: String(peerConfig.chaincodePort) }],
          [`${peerConfig.operationsPort}/tcp`]: [{ HostPort: String(peerConfig.operationsPort) }],
        },
      },
    });

    await container.start();
    return container.id;
  }

  /**
   * Start a new CA container
   */
  async startCAContainer(caConfig: CAConfig): Promise<string> {
    const containerName = `ca.${caConfig.orgName}`;
    const image = 'hyperledger/fabric-ca:1.5';

    const container = await this.docker.createContainer({
      name: containerName,
      Image: image,
      Env: [
        `FABRIC_CA_SERVER_CA_NAME=${caConfig.name}`,
        `FABRIC_CA_SERVER_PORT=${caConfig.port}`,
        'FABRIC_CA_SERVER_OPERATIONS_LISTENADDRESS=0.0.0.0:9443',
      ],
      Cmd: ['sh', '-c', `fabric-ca-server start -b ${caConfig.adminUser}:${caConfig.adminPassword}`],
      ExposedPorts: {
        [`${caConfig.port}/tcp`]: {},
        '9443/tcp': {},
      },
      HostConfig: {
        PortBindings: {
          [`${caConfig.port}/tcp`]: [{ HostPort: String(caConfig.port) }],
          '9443/tcp': [{ HostPort: '9443' }],
        },
      },
    });

    await container.start();
    return container.id;
  }

  /**
   * Stop a container
   */
  async stopContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.stop();
  }

  /**
   * Get container status
   */
  async getContainerStatus(containerId: string): Promise<ContainerStatus> {
    try {
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();

      return {
        running: info.State.Running,
        exitCode: info.State.ExitCode,
        error: info.State.Error || undefined,
      };
    } catch (error) {
      return {
        running: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get network containers
   */
  async getNetworkContainers(networkName: string): Promise<ContainerInfo[]> {
    const containers = await this.docker.listContainers({ all: true });

    return containers
      .filter((container: Dockerode.ContainerInfo) => Object.keys(container.NetworkSettings.Networks).includes(networkName))
      .map((container: Dockerode.ContainerInfo) => ({
        id: container.Id,
        name: container.Names[0].replace(/^\//, ''),
        status: container.State,
        image: container.Image,
        ports: this.extractPorts(container.Ports),
      }));
  }

  /**
   * Remove a container
   */
  async removeContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.remove({ force: true });
  }

  /**
   * Extract port mappings from container ports
   */
  private extractPorts(ports: Dockerode.Port[]): Record<string, number> {
    const result: Record<string, number> = {};
    ports.forEach((port) => {
      if (port.PublicPort && port.PrivatePort) {
        result[String(port.PrivatePort)] = port.PublicPort;
      }
    });
    return result;
  }

  /**
   * Check if Docker is available
   */
  async isDockerAvailable(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }
}
