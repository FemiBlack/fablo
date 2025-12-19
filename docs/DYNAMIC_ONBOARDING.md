# Dynamic Organization Onboarding Guide

This guide explains how to use Fablo's API to dynamically add organizations and users to a running Hyperledger Fabric network without requiring a network restart.

## Overview

Traditional Hyperledger Fabric network management requires regenerating configuration files and restarting the entire network whenever you need to add a new organization or user. Fablo's dynamic onboarding API eliminates this limitation by allowing you to:

- Add new organizations on-the-fly
- Register and enroll users dynamically
- Start new peer containers as needed
- Generate connection profiles automatically
- Maintain network availability during changes

## Prerequisites

1. **Running Fablo Network**: You must have a Fablo network already running
2. **Docker Access**: The API server needs access to the Docker daemon
3. **Network Connectivity**: Organizations must be able to communicate with orderers
4. **Port Availability**: Ensure required ports are available for new containers

## Getting Started

### 1. Start the Fablo Network

First, create or use an existing Fablo configuration and start the network:

```bash
# Create a new Fablo configuration
fablo init node rest

# Start the network
fablo up
```

### 2. Start the API Server

Start the Fablo API server on the default port (3000):

```bash
# From the API directory
node src/api/cli.js

# Or specify a custom port
node src/api/cli.js 8080
```

The API server will start and display:
```
🚀 Fablo API Server is running on port 3000
   Health check: http://localhost:3000/health
   API endpoint: http://localhost:3000/api/v1
```

### 3. Verify API Server

Check that the API server is running:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

## Dynamic Organization Onboarding

### Step 1: Add a New Organization

To add a new organization to the network, send a POST request:

```bash
curl -X POST http://localhost:3000/api/v1/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Org3",
    "domain": "org3.example.com",
    "peerCount": 2
  }'
```

This will:
1. Start a Certificate Authority (CA) container for the organization
2. Generate crypto materials for the organization
3. Start the specified number of peer containers
4. Generate a connection profile for client applications
5. Return organization details including peer information

Response:
```json
{
  "id": "Org3",
  "name": "Org3",
  "domain": "org3.example.com",
  "mspName": "Org3MSP",
  "caUrl": "http://localhost:7054",
  "peers": [
    {
      "id": "abc123",
      "name": "peer0.org3",
      "url": "grpc://localhost:7051",
      "status": "running"
    },
    {
      "id": "def456",
      "name": "peer1.org3",
      "url": "grpc://localhost:8051",
      "status": "running"
    }
  ],
  "connectionProfile": { ... },
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Step 2: Verify Organization

List all organizations to verify the new organization was added:

```bash
curl http://localhost:3000/api/v1/organizations
```

Get specific organization details:

```bash
curl http://localhost:3000/api/v1/organizations/Org3
```

### Step 3: Add More Peers (Optional)

If you need additional peers for the organization:

```bash
curl -X POST http://localhost:3000/api/v1/organizations/Org3/peers \
  -H "Content-Type: application/json" \
  -d '{
    "count": 1,
    "db": "CouchDb"
  }'
```

This adds one more peer with CouchDB as the state database.

## User Registration and Enrollment

### Step 1: Register a New User

Register a new user (staff member) in the organization:

```bash
curl -X POST http://localhost:3000/api/v1/organizations/Org3/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "role": "user",
    "attributes": {
      "department": "sales",
      "region": "west"
    }
  }'
```

This will:
1. Register the user with the organization's CA
2. Enroll the user to get X.509 certificates
3. Store user information
4. Return user credentials

Response:
```json
{
  "username": "alice",
  "role": "user",
  "orgId": "Org3",
  "enrollmentId": "alice",
  "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "attributes": {
    "department": "sales",
    "region": "west"
  },
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

### Step 2: List Users

View all users in an organization:

```bash
curl http://localhost:3000/api/v1/organizations/Org3/users
```

### Step 3: Get User Details

Get specific user information:

```bash
curl http://localhost:3000/api/v1/organizations/Org3/users/alice
```

### Step 4: Revoke User Access (Optional)

If you need to revoke a user's access:

```bash
curl -X DELETE http://localhost:3000/api/v1/organizations/Org3/users/alice
```

This will:
1. Revoke the user's certificate with the CA
2. Remove the user from the system
3. Prevent future authentication attempts

## Connection Profiles

When you create a new organization, the API automatically generates a connection profile that client applications can use to interact with the Fabric network.

### Using the Connection Profile

The connection profile is returned when you create or query an organization:

```bash
curl http://localhost:3000/api/v1/organizations/Org3 | jq '.connectionProfile'
```

Save this to a file and use it with the Fabric SDK:

```bash
curl http://localhost:3000/api/v1/organizations/Org3 | \
  jq '.connectionProfile' > org3-connection-profile.json
```

### Example: Node.js SDK

```javascript
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');

async function main() {
  // Load connection profile
  const connectionProfile = JSON.parse(
    fs.readFileSync('org3-connection-profile.json', 'utf8')
  );

  // Create wallet and add identity
  const wallet = await Wallets.newFileSystemWallet('./wallet');
  
  // Connect to gateway
  const gateway = new Gateway();
  await gateway.connect(connectionProfile, {
    wallet,
    identity: 'alice',
    discovery: { enabled: true, asLocalhost: true }
  });

  // Use the gateway...
}
```

## Network Monitoring

### Check Network Status

Get an overview of the network:

```bash
curl http://localhost:3000/api/v1/network/status
```

Response:
```json
{
  "status": "running",
  "organizations": 3,
  "peers": 6,
  "channels": 2,
  "orderers": 1
}
```

### List Channels

View all channels (coming soon):

```bash
curl http://localhost:3000/api/v1/network/channels
```

## Best Practices

### 1. Port Management

When adding multiple organizations, ensure ports don't conflict:
- Specify custom CA ports: `"caPort": 9054`
- The system automatically assigns peer ports based on organization index

### 2. Resource Planning

- Each peer container requires ~512MB RAM minimum
- Plan disk space for ledger data
- Monitor Docker resource usage

### 3. Security Considerations

**In Production:**
1. Add authentication to API endpoints (JWT, OAuth2)
2. Use TLS for all network communications
3. Store certificates and private keys securely
4. Implement role-based access control (RBAC)
5. Enable audit logging
6. Restrict network access with firewalls

### 4. State Management

The current implementation uses in-memory storage. For production:
- Use a database (PostgreSQL, MongoDB) for persistence
- Implement backup and recovery procedures
- Use distributed storage for high availability

### 5. Channel Management

After adding an organization dynamically:
1. Update channel configuration to include the new org
2. Join peers to relevant channels
3. Install and instantiate chaincodes on new peers
4. Update endorsement policies if needed

## Troubleshooting

### Organization Creation Fails

**Symptom:** API returns 500 error when creating organization

**Possible Causes:**
1. Docker daemon not accessible
2. Port already in use
3. Insufficient resources

**Solutions:**
```bash
# Check Docker status
docker ps

# Check port availability
netstat -an | grep 7054

# Check Docker resources
docker system df
```

### User Registration Fails

**Symptom:** User registration returns error

**Possible Causes:**
1. CA not running
2. Invalid credentials
3. User already exists

**Solutions:**
```bash
# Check CA container status
docker ps | grep ca

# View CA logs
docker logs ca.org3

# List existing users
curl http://localhost:3000/api/v1/organizations/Org3/users
```

### Peer Won't Start

**Symptom:** Peer status shows "error"

**Possible Causes:**
1. MSP configuration issues
2. Network connectivity problems
3. Resource constraints

**Solutions:**
```bash
# Check peer logs
docker logs peer0.org3

# Check network connectivity
docker network inspect fablo_default

# Check system resources
docker stats
```

## Advanced Usage

### Adding Organization to Channel

After dynamically adding an organization, you need to update the channel configuration:

```bash
# This endpoint is under development
curl -X POST http://localhost:3000/api/v1/network/channels/mychannel/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "Org3",
    "peers": ["peer0.org3", "peer1.org3"]
  }'
```

Currently, you need to:
1. Fetch current channel config
2. Add new organization's MSP
3. Sign with admin identities
4. Submit config update
5. Join peers to channel

### Bulk Operations

To add multiple organizations efficiently:

```bash
#!/bin/bash
for org in Org3 Org4 Org5; do
  curl -X POST http://localhost:3000/api/v1/organizations \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$org\",
      \"domain\": \"${org,,}.example.com\",
      \"peerCount\": 2
    }"
  sleep 5  # Wait for containers to start
done
```

## Limitations

Current limitations of dynamic onboarding:

1. **Channel Configuration**: Manual steps required to add organization to channels
2. **Orderer Integration**: New organizations can't become orderer organizations dynamically
3. **Persistence**: Organization data stored in memory (needs database for production)
4. **TLS**: TLS certificate management needs enhancement
5. **Consensus**: Can't change consensus parameters dynamically

## Future Enhancements

Planned improvements:

- [ ] Automatic channel configuration updates
- [ ] Database persistence layer
- [ ] TLS certificate management
- [ ] System chaincode updates
- [ ] Orderer node management
- [ ] Backup and restore capabilities
- [ ] Multi-host deployment support
- [ ] Performance monitoring and metrics

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review API reference at `docs/API_REFERENCE.md`

## Related Documentation

- [API Reference](./API_REFERENCE.md) - Complete API endpoint documentation
- [Fablo Documentation](../README.md) - Main Fablo documentation
- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
