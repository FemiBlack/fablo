import { Request, Response } from 'express';
import { FabricCAService } from '../services/fabricCAService';
import { UserRequest, UserResponse } from '../types/api';
import { AppError } from '../middleware/errorHandler';

// In-memory storage for users (in production, use a database)
const users: Map<string, Map<string, UserResponse>> = new Map();

export class UserController {
  private caService: FabricCAService;

  constructor() {
    this.caService = new FabricCAService();
  }

  /**
   * Register a new user in an organization
   */
  async registerUser(req: Request, res: Response): Promise<void> {
    const { orgId } = req.params;
    const userRequest = req.body as UserRequest;

    // Validate request
    if (!userRequest.username || !userRequest.role) {
      throw new AppError('Username and role are required', 400);
    }

    // Check if organization exists (simplified - in production, query from database)
    if (!users.has(orgId)) {
      users.set(orgId, new Map());
    }

    const orgUsers = users.get(orgId)!;

    // Check if user already exists
    if (orgUsers.has(userRequest.username)) {
      throw new AppError(
        `User ${userRequest.username} already exists in organization ${orgId}`,
        409,
      );
    }

    // In production, get CA URL from organization data
    const caUrl = `http://localhost:7054`;
    const orgMspId = `${orgId}MSP`;

    // Admin identity (in production, retrieve from secure storage)
    const adminIdentity = {
      certificate: '',
      privateKey: '',
    };

    // Register user with CA
    const credentials = await this.caService.registerUser(
      caUrl,
      orgMspId,
      userRequest.username,
      userRequest.role,
      adminIdentity,
    );

    // Enroll user to get certificates
    const certificates = await this.caService.enrollUser(
      caUrl,
      credentials.enrollmentId,
      credentials.enrollmentSecret,
    );

    // Create user response
    const user: UserResponse = {
      username: userRequest.username,
      role: userRequest.role,
      orgId,
      enrollmentId: credentials.enrollmentId,
      certificate: certificates.certificate,
      attributes: userRequest.attributes,
      createdAt: new Date().toISOString(),
    };

    // Store user
    orgUsers.set(userRequest.username, user);

    res.status(201).json(user);
  }

  /**
   * List all users in an organization
   */
  async listUsers(req: Request, res: Response): Promise<void> {
    const { orgId } = req.params;

    const orgUsers = users.get(orgId);
    if (!orgUsers) {
      res.json([]);
      return;
    }

    const userList = Array.from(orgUsers.values());
    res.json(userList);
  }

  /**
   * Get a specific user
   */
  async getUser(req: Request, res: Response): Promise<void> {
    const { orgId, userId } = req.params;

    const orgUsers = users.get(orgId);
    if (!orgUsers) {
      throw new AppError(`Organization ${orgId} not found`, 404);
    }

    const user = orgUsers.get(userId);
    if (!user) {
      throw new AppError(`User ${userId} not found in organization ${orgId}`, 404);
    }

    res.json(user);
  }

  /**
   * Revoke user access
   */
  async revokeUser(req: Request, res: Response): Promise<void> {
    const { orgId, userId } = req.params;

    const orgUsers = users.get(orgId);
    if (!orgUsers) {
      throw new AppError(`Organization ${orgId} not found`, 404);
    }

    const user = orgUsers.get(userId);
    if (!user) {
      throw new AppError(`User ${userId} not found in organization ${orgId}`, 404);
    }

    // In production, get CA URL from organization data
    const caUrl = `http://localhost:7054`;

    // Admin identity (in production, retrieve from secure storage)
    const adminIdentity = {
      certificate: '',
      privateKey: '',
    };

    // Revoke user certificate
    await this.caService.revokeUser(caUrl, user.enrollmentId, adminIdentity);

    // Remove user from storage
    orgUsers.delete(userId);

    res.json({
      message: `User ${userId} revoked from organization ${orgId}`,
    });
  }
}
