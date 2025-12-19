#!/usr/bin/env node

/**
 * CLI script to start the Fablo API server
 */

const path = require('path');

// Import the server
const { FabloApiServer } = require('../api/server');

// Parse command line arguments
const args = process.argv.slice(2);
const port = args[0] ? parseInt(args[0], 10) : 3000;

if (isNaN(port) || port < 1024 || port > 65535) {
  console.error('Error: Invalid port number. Port must be between 1024 and 65535.');
  process.exit(1);
}

// Start the server
console.log('Starting Fablo API Server...');
const server = new FabloApiServer(port);
server.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down Fablo API Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down Fablo API Server...');
  process.exit(0);
});
