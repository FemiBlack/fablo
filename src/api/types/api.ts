// API types for dynamic organization onboarding

export interface OrganizationRequest {
  name: string;
  domain: string;
  mspName?: string;
  peerCount?: number;
  caPort?: number;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  domain: string;
  mspName: string;
  caUrl: string;
  peers: PeerInfo[];
  connectionProfile?: ConnectionProfile;
  createdAt: string;
}

export interface PeerInfo {
  id: string;
  name: string;
  url: string;
  eventUrl?: string;
  tlsCert?: string;
  status: 'running' | 'stopped' | 'error';
}

export interface AddPeerRequest {
  count: number;
  db?: 'LevelDb' | 'CouchDb';
}

export interface UserRequest {
  username: string;
  role: 'admin' | 'user' | 'peer';
  attributes?: Record<string, string>;
}

export interface UserResponse {
  username: string;
  role: string;
  orgId: string;
  enrollmentId: string;
  certificate?: string;
  attributes?: Record<string, string>;
  createdAt: string;
}

export interface UserCredentials {
  enrollmentId: string;
  enrollmentSecret: string;
  certificate?: string;
  privateKey?: string;
}

export interface UserCertificates {
  certificate: string;
  privateKey: string;
  rootCertificate: string;
}

export interface CAInfo {
  caName: string;
  version: string;
  tlsCertificate?: string;
}

export interface OrgConfig {
  name: string;
  domain: string;
  mspName: string;
  caPort: number;
  peerCount: number;
  ordererPort?: number;
}

export interface PeerConfig {
  name: string;
  orgName: string;
  port: number;
  chaincodePort: number;
  operationsPort: number;
  db: 'LevelDb' | 'CouchDb';
  couchDbPort?: number;
}

export interface CAConfig {
  name: string;
  orgName: string;
  port: number;
  adminUser: string;
  adminPassword: string;
}

export interface ContainerInfo {
  id: string;
  name: string;
  status: string;
  image: string;
  ports: Record<string, number>;
}

export interface ContainerStatus {
  running: boolean;
  exitCode?: number;
  error?: string;
}

export interface ConnectionProfile {
  name: string;
  version: string;
  client: {
    organization: string;
  };
  organizations: Record<string, OrganizationProfile>;
  peers: Record<string, PeerProfile>;
  certificateAuthorities: Record<string, CAProfile>;
}

export interface OrganizationProfile {
  mspid: string;
  peers: string[];
  certificateAuthorities: string[];
}

export interface PeerProfile {
  url: string;
  eventUrl?: string;
  grpcOptions?: Record<string, unknown>;
  tlsCACerts?: {
    pem: string;
  };
}

export interface CAProfile {
  url: string;
  caName: string;
  tlsCACerts?: {
    pem: string;
  };
  httpOptions?: Record<string, unknown>;
}

export interface NetworkStatus {
  status: 'running' | 'partial' | 'stopped';
  organizations: number;
  peers: number;
  channels: number;
  orderers: number;
}

export interface ChannelInfo {
  id: string;
  name: string;
  organizations: string[];
  height?: number;
}

export interface AddOrgToChannelRequest {
  orgId: string;
  peers: string[];
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}
