#!/usr/bin/env node

/**
 * Simple test script to verify the API structure
 * This doesn't run the actual server but validates the imports and structure
 */

console.log('Testing Fablo API structure...\n');

try {
  // Test server import
  console.log('✓ Checking server module...');
  const { FabloApiServer } = require('./server');
  if (!FabloApiServer) {
    throw new Error('FabloApiServer not exported');
  }

  // Test types import
  console.log('✓ Checking types module...');
  const types = require('./types/api');
  if (!types) {
    throw new Error('Types not exported');
  }

  // Test services import
  console.log('✓ Checking services...');
  const { DockerService } = require('./services/dockerService');
  const { FabricCAService } = require('./services/fabricCAService');
  const { PeerService } = require('./services/peerService');
  const { ConfigService } = require('./services/configService');

  if (!DockerService || !FabricCAService || !PeerService || !ConfigService) {
    throw new Error('Services not properly exported');
  }

  // Test controllers import
  console.log('✓ Checking controllers...');
  const { OrgController } = require('./controllers/orgController');
  const { UserController } = require('./controllers/userController');

  if (!OrgController || !UserController) {
    throw new Error('Controllers not properly exported');
  }

  // Test middleware import
  console.log('✓ Checking middleware...');
  const { errorHandler, AppError } = require('./middleware/errorHandler');

  if (!errorHandler || !AppError) {
    throw new Error('Middleware not properly exported');
  }

  console.log('\n✅ All API modules are properly structured!\n');
  console.log('API Components:');
  console.log('  - Express Server: FabloApiServer');
  console.log('  - Services: Docker, FabricCA, Peer, Config');
  console.log('  - Controllers: Organization, User');
  console.log('  - Routes: Organizations, Users, Network');
  console.log('  - Middleware: Error Handler');
  console.log('  - Types: Complete TypeScript definitions');
  console.log('\nTo start the API server:');
  console.log('  node src/api/cli.js [port]');
  console.log('  Default port: 3000\n');

} catch (error) {
  console.error('\n❌ Error testing API structure:', error.message);
  process.exit(1);
}
