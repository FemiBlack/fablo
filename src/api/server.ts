import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import organizationsRouter from './routes/organizations';
import usersRouter from './routes/users';
import networkRouter from './routes/network';
import { errorHandler } from './middleware/errorHandler';

const DEFAULT_PORT = 3000;

export class FabloApiServer {
  private app: Express;
  private port: number;

  constructor(port?: number) {
    this.app = express();
    this.port = port || DEFAULT_PORT;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());

    // Body parsing middleware
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    // Request logging
    this.app.use((_req: Request, res: Response, next) => {
      console.log(`${new Date().toISOString()} - ${_req.method} ${_req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    });

    // API version 1 routes
    this.app.use('/api/v1/organizations', organizationsRouter);
    this.app.use('/api/v1/organizations', usersRouter);
    this.app.use('/api/v1/network', networkRouter);

    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        name: 'Fablo API Server',
        version: '1.0.0',
        description: 'API for dynamic organization onboarding in Hyperledger Fabric',
        endpoints: {
          organizations: '/api/v1/organizations',
          users: '/api/v1/organizations/:orgId/users',
          network: '/api/v1/network',
        },
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'NotFound',
        message: `Route ${req.method} ${req.path} not found`,
        statusCode: 404,
      });
    });

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  start(): void {
    this.app.listen(this.port, () => {
      console.log(`\n🚀 Fablo API Server is running on port ${this.port}`);
      console.log(`   Health check: http://localhost:${this.port}/health`);
      console.log(`   API endpoint: http://localhost:${this.port}/api/v1\n`);
    });
  }

  /**
   * Get the Express app instance
   */
  getApp(): Express {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const port = process.env.FABLO_API_PORT
    ? parseInt(process.env.FABLO_API_PORT, 10)
    : DEFAULT_PORT;

  const server = new FabloApiServer(port);
  server.start();
}

export default FabloApiServer;
