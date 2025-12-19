import { ConfigService } from './configService';
import { OrgConfig, PeerInfo } from '../types/api';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
  });

  describe('generateConnectionProfile', () => {
    it('should generate a valid connection profile', () => {
      const orgConfig: OrgConfig = {
        name: 'Org1',
        domain: 'org1.example.com',
        mspName: 'Org1MSP',
        caPort: 7054,
        peerCount: 2,
      };

      const peers: PeerInfo[] = [
        {
          id: 'peer0',
          name: 'peer0.org1',
          url: 'grpc://localhost:7051',
          eventUrl: 'grpc://localhost:7051',
          status: 'running',
        },
        {
          id: 'peer1',
          name: 'peer1.org1',
          url: 'grpc://localhost:8051',
          eventUrl: 'grpc://localhost:8051',
          status: 'running',
        },
      ];

      const caUrl = 'http://localhost:7054';

      const profile = configService.generateConnectionProfile(orgConfig, peers, caUrl);

      expect(profile.name).toBe('Org1 Network');
      expect(profile.version).toBe('1.0.0');
      expect(profile.client.organization).toBe('org1');
      expect(profile.organizations.org1.mspid).toBe('Org1MSP');
      expect(profile.organizations.org1.peers).toEqual(['peer0.org1', 'peer1.org1']);
      expect(profile.peers['peer0.org1'].url).toBe('grpc://localhost:7051');
      expect(profile.certificateAuthorities['ca.org1'].url).toBe(caUrl);
    });

    it('should generate default MSP name when not provided', () => {
      const orgConfig: OrgConfig = {
        name: 'Org2',
        domain: 'org2.example.com',
        mspName: '',
        caPort: 7054,
        peerCount: 1,
      };

      const peers: PeerInfo[] = [
        {
          id: 'peer0',
          name: 'peer0.org2',
          url: 'grpc://localhost:7051',
          status: 'running',
        },
      ];

      const profile = configService.generateConnectionProfile(orgConfig, peers, 'http://localhost:7054');

      // When mspName is empty, it should use the default from orgConfig.mspName or generate one
      expect(profile.organizations.org2.mspid).toBe('Org2MSP');
    });
  });

  describe('addPeerToConnectionProfile', () => {
    it('should add a peer to existing connection profile', () => {
      const orgConfig: OrgConfig = {
        name: 'Org1',
        domain: 'org1.example.com',
        mspName: 'Org1MSP',
        caPort: 7054,
        peerCount: 1,
      };

      const initialPeers: PeerInfo[] = [
        {
          id: 'peer0',
          name: 'peer0.org1',
          url: 'grpc://localhost:7051',
          status: 'running',
        },
      ];

      let profile = configService.generateConnectionProfile(
        orgConfig,
        initialPeers,
        'http://localhost:7054',
      );

      const newPeer: PeerInfo = {
        id: 'peer1',
        name: 'peer1.org1',
        url: 'grpc://localhost:8051',
        eventUrl: 'grpc://localhost:8051',
        status: 'running',
      };

      profile = configService.addPeerToConnectionProfile(profile, 'Org1', newPeer);

      expect(profile.organizations.org1.peers).toContain('peer1.org1');
      expect(profile.peers['peer1.org1']).toBeDefined();
      expect(profile.peers['peer1.org1'].url).toBe('grpc://localhost:8051');
    });

    it('should not add duplicate peers', () => {
      const orgConfig: OrgConfig = {
        name: 'Org1',
        domain: 'org1.example.com',
        mspName: 'Org1MSP',
        caPort: 7054,
        peerCount: 1,
      };

      const peers: PeerInfo[] = [
        {
          id: 'peer0',
          name: 'peer0.org1',
          url: 'grpc://localhost:7051',
          status: 'running',
        },
      ];

      let profile = configService.generateConnectionProfile(orgConfig, peers, 'http://localhost:7054');

      // Try to add the same peer again
      profile = configService.addPeerToConnectionProfile(profile, 'Org1', peers[0]);

      expect(profile.organizations.org1.peers.filter((p) => p === 'peer0.org1')).toHaveLength(1);
    });
  });

  describe('removePeerFromConnectionProfile', () => {
    it('should remove a peer from connection profile', () => {
      const orgConfig: OrgConfig = {
        name: 'Org1',
        domain: 'org1.example.com',
        mspName: 'Org1MSP',
        caPort: 7054,
        peerCount: 2,
      };

      const peers: PeerInfo[] = [
        {
          id: 'peer0',
          name: 'peer0.org1',
          url: 'grpc://localhost:7051',
          status: 'running',
        },
        {
          id: 'peer1',
          name: 'peer1.org1',
          url: 'grpc://localhost:8051',
          status: 'running',
        },
      ];

      let profile = configService.generateConnectionProfile(orgConfig, peers, 'http://localhost:7054');

      profile = configService.removePeerFromConnectionProfile(profile, 'Org1', 'peer1.org1');

      expect(profile.organizations.org1.peers).not.toContain('peer1.org1');
      expect(profile.peers['peer1.org1']).toBeUndefined();
      expect(profile.peers['peer0.org1']).toBeDefined();
    });
  });
});
