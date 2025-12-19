import {
  ConnectionProfile,
  OrgConfig,
  PeerInfo,
  OrganizationProfile,
  PeerProfile,
  CAProfile,
} from '../types/api';

export class ConfigService {
  /**
   * Generate a connection profile for an organization
   */
  generateConnectionProfile(
    orgConfig: OrgConfig,
    peers: PeerInfo[],
    caUrl: string,
  ): ConnectionProfile {
    const orgMspId = orgConfig.mspName || `${orgConfig.name}MSP`;
    const orgKey = orgConfig.name.toLowerCase();
    const caKey = `ca.${orgKey}`;

    // Build organizations section
    const organizations: Record<string, OrganizationProfile> = {
      [orgKey]: {
        mspid: orgMspId,
        peers: peers.map((peer) => peer.name),
        certificateAuthorities: [caKey],
      },
    };

    // Build peers section
    const peersConfig: Record<string, PeerProfile> = {};
    peers.forEach((peer) => {
      peersConfig[peer.name] = {
        url: peer.url,
        eventUrl: peer.eventUrl,
        grpcOptions: {
          'ssl-target-name-override': peer.name,
          'grpc.keepalive_time_ms': 600000,
        },
      };
    });

    // Build certificate authorities section
    const certificateAuthorities: Record<string, CAProfile> = {
      [caKey]: {
        url: caUrl,
        caName: caKey,
        httpOptions: {
          verify: false,
        },
      },
    };

    return {
      name: `${orgConfig.name} Network`,
      version: '1.0.0',
      client: {
        organization: orgKey,
      },
      organizations,
      peers: peersConfig,
      certificateAuthorities,
    };
  }

  /**
   * Update an existing connection profile with new peer
   */
  addPeerToConnectionProfile(
    profile: ConnectionProfile,
    orgName: string,
    peer: PeerInfo,
  ): ConnectionProfile {
    const orgKey = orgName.toLowerCase();

    // Add peer to organization's peer list
    if (profile.organizations[orgKey]) {
      if (!profile.organizations[orgKey].peers.includes(peer.name)) {
        profile.organizations[orgKey].peers.push(peer.name);
      }
    }

    // Add peer configuration
    profile.peers[peer.name] = {
      url: peer.url,
      eventUrl: peer.eventUrl,
      grpcOptions: {
        'ssl-target-name-override': peer.name,
        'grpc.keepalive_time_ms': 600000,
      },
    };

    return profile;
  }

  /**
   * Remove a peer from connection profile
   */
  removePeerFromConnectionProfile(
    profile: ConnectionProfile,
    orgName: string,
    peerName: string,
  ): ConnectionProfile {
    const orgKey = orgName.toLowerCase();

    // Remove peer from organization's peer list
    if (profile.organizations[orgKey]) {
      profile.organizations[orgKey].peers = profile.organizations[orgKey].peers.filter(
        (name) => name !== peerName,
      );
    }

    // Remove peer configuration
    delete profile.peers[peerName];

    return profile;
  }
}
