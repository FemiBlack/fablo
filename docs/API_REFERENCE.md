# Fablo API Reference

This document provides a comprehensive reference for the Fablo REST API that enables dynamic organization onboarding and management in Hyperledger Fabric networks.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

Currently, the API does not implement authentication. In production environments, you should add authentication middleware (JWT, OAuth2, etc.) to secure your endpoints.

## Response Format

All API responses follow this general format:

**Success Response:**
```json
{
  "data": { ... }
}
```

**Error Response:**
```json
{
  "error": "ErrorType",
  "message": "Error description",
  "statusCode": 400,
  "details": { ... }
}
```

## Endpoints

### Organization Management

#### Create Organization

Create a new organization with CA and peer containers.

**Endpoint:** `POST /api/v1/organizations`

**Request Body:**
```json
{
  "name": "Org3",
  "domain": "org3.example.com",
  "mspName": "Org3MSP",
  "peerCount": 2,
  "caPort": 7054
}
```

**Parameters:**
- `name` (required): Organization name
- `domain` (required): Organization domain
- `mspName` (optional): MSP identifier (defaults to `{name}MSP`)
- `peerCount` (optional): Number of peers to start (defaults to 1)
- `caPort` (optional): Port for CA server (auto-assigned if not provided)

**Response:** `201 Created`
```json
{
  "id": "Org3",
  "name": "Org3",
  "domain": "org3.example.com",
  "mspName": "Org3MSP",
  "caUrl": "http://localhost:7054",
  "peers": [
    {
      "id": "container-id-123",
      "name": "peer0.org3",
      "url": "grpc://localhost:7051",
      "eventUrl": "grpc://localhost:7051",
      "status": "running"
    }
  ],
  "connectionProfile": { ... },
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Org3",
    "domain": "org3.example.com",
    "peerCount": 2
  }'
```

---

#### List Organizations

Get all registered organizations.

**Endpoint:** `GET /api/v1/organizations`

**Response:** `200 OK`
```json
[
  {
    "id": "Org1",
    "name": "Org1",
    "domain": "org1.example.com",
    "mspName": "Org1MSP",
    "caUrl": "http://localhost:7054",
    "peers": [ ... ],
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  {
    "id": "Org2",
    "name": "Org2",
    "domain": "org2.example.com",
    "mspName": "Org2MSP",
    "caUrl": "http://localhost:8054",
    "peers": [ ... ],
    "createdAt": "2024-01-15T10:15:00.000Z"
  }
]
```

**Example:**
```bash
curl http://localhost:3000/api/v1/organizations
```

---

#### Get Organization

Get details of a specific organization.

**Endpoint:** `GET /api/v1/organizations/:orgId`

**Path Parameters:**
- `orgId`: Organization identifier

**Response:** `200 OK`
```json
{
  "id": "Org3",
  "name": "Org3",
  "domain": "org3.example.com",
  "mspName": "Org3MSP",
  "caUrl": "http://localhost:7054",
  "peers": [ ... ],
  "connectionProfile": { ... },
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3000/api/v1/organizations/Org3
```

---

#### Add Peers to Organization

Add additional peers to an existing organization.

**Endpoint:** `POST /api/v1/organizations/:orgId/peers`

**Path Parameters:**
- `orgId`: Organization identifier

**Request Body:**
```json
{
  "count": 2,
  "db": "CouchDb"
}
```

**Parameters:**
- `count` (required): Number of peers to add
- `db` (optional): Database type - "LevelDb" or "CouchDb" (defaults to "LevelDb")

**Response:** `200 OK`
```json
{
  "message": "Added 2 peer(s) to organization Org3",
  "peers": [
    {
      "id": "container-id-456",
      "name": "peer2.org3",
      "url": "grpc://localhost:9051",
      "eventUrl": "grpc://localhost:9051",
      "status": "running"
    },
    {
      "id": "container-id-789",
      "name": "peer3.org3",
      "url": "grpc://localhost:10051",
      "eventUrl": "grpc://localhost:10051",
      "status": "running"
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/organizations/Org3/peers \
  -H "Content-Type: application/json" \
  -d '{
    "count": 2,
    "db": "CouchDb"
  }'
```

---

### User Management

#### Register User

Register a new user or staff member in an organization.

**Endpoint:** `POST /api/v1/organizations/:orgId/users`

**Path Parameters:**
- `orgId`: Organization identifier

**Request Body:**
```json
{
  "username": "alice",
  "role": "user",
  "attributes": {
    "department": "sales",
    "region": "west"
  }
}
```

**Parameters:**
- `username` (required): User's username
- `role` (required): User role - "admin", "user", or "peer"
- `attributes` (optional): Custom attributes for the user

**Response:** `201 Created`
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

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/organizations/Org3/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "role": "user",
    "attributes": {
      "department": "sales"
    }
  }'
```

---

#### List Users

Get all users in an organization.

**Endpoint:** `GET /api/v1/organizations/:orgId/users`

**Path Parameters:**
- `orgId`: Organization identifier

**Response:** `200 OK`
```json
[
  {
    "username": "alice",
    "role": "user",
    "orgId": "Org3",
    "enrollmentId": "alice",
    "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "attributes": {
      "department": "sales"
    },
    "createdAt": "2024-01-15T11:00:00.000Z"
  },
  {
    "username": "bob",
    "role": "admin",
    "orgId": "Org3",
    "enrollmentId": "bob",
    "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "createdAt": "2024-01-15T11:15:00.000Z"
  }
]
```

**Example:**
```bash
curl http://localhost:3000/api/v1/organizations/Org3/users
```

---

#### Get User

Get details of a specific user.

**Endpoint:** `GET /api/v1/organizations/:orgId/users/:userId`

**Path Parameters:**
- `orgId`: Organization identifier
- `userId`: Username

**Response:** `200 OK`
```json
{
  "username": "alice",
  "role": "user",
  "orgId": "Org3",
  "enrollmentId": "alice",
  "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "attributes": {
    "department": "sales"
  },
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3000/api/v1/organizations/Org3/users/alice
```

---

#### Revoke User

Revoke a user's access and certificate.

**Endpoint:** `DELETE /api/v1/organizations/:orgId/users/:userId`

**Path Parameters:**
- `orgId`: Organization identifier
- `userId`: Username

**Response:** `200 OK`
```json
{
  "message": "User alice revoked from organization Org3"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/v1/organizations/Org3/users/alice
```

---

### Network Status

#### Get Network Status

Get current status of the Fabric network.

**Endpoint:** `GET /api/v1/network/status`

**Response:** `200 OK`
```json
{
  "status": "running",
  "organizations": 3,
  "peers": 6,
  "channels": 2,
  "orderers": 1
}
```

**Status Values:**
- `running`: Network is operational
- `partial`: Some components are not running
- `stopped`: Network is not running

**Example:**
```bash
curl http://localhost:3000/api/v1/network/status
```

---

#### List Channels

Get all channels in the network.

**Endpoint:** `GET /api/v1/network/channels`

**Response:** `200 OK`
```json
[
  {
    "id": "mychannel",
    "name": "mychannel",
    "organizations": ["Org1", "Org2", "Org3"],
    "height": 150
  }
]
```

**Note:** This endpoint is currently under development.

**Example:**
```bash
curl http://localhost:3000/api/v1/network/channels
```

---

#### Add Organization to Channel

Add an organization to an existing channel.

**Endpoint:** `POST /api/v1/network/channels/:channelId/organizations`

**Path Parameters:**
- `channelId`: Channel identifier

**Request Body:**
```json
{
  "orgId": "Org3",
  "peers": ["peer0.org3", "peer1.org3"]
}
```

**Parameters:**
- `orgId` (required): Organization identifier
- `peers` (required): Array of peer names to join the channel

**Response:** `200 OK`
```json
{
  "message": "Organization Org3 added to channel mychannel"
}
```

**Note:** This endpoint is currently under development.

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/network/channels/mychannel/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "Org3",
    "peers": ["peer0.org3", "peer1.org3"]
  }'
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource does not exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

## Common Error Responses

### Bad Request (400)
```json
{
  "error": "BadRequest",
  "message": "Name and domain are required",
  "statusCode": 400
}
```

### Not Found (404)
```json
{
  "error": "NotFound",
  "message": "Organization Org3 not found",
  "statusCode": 404
}
```

### Conflict (409)
```json
{
  "error": "Conflict",
  "message": "Organization Org3 already exists",
  "statusCode": 409
}
```

### Internal Server Error (500)
```json
{
  "error": "InternalServerError",
  "message": "Failed to start peer: Connection refused",
  "statusCode": 500,
  "details": { ... }
}
```

## Rate Limiting

Currently, there is no rate limiting implemented. It is recommended to add rate limiting middleware in production environments.

## CORS

The API allows cross-origin requests from all origins. In production, configure CORS to allow only trusted domains.

## Health Check

**Endpoint:** `GET /health`

Check if the API server is running.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3000/health
```
