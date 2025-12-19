import FabricCAServices from 'fabric-ca-client';
import {
  UserCredentials,
  UserCertificates,
  CAInfo,
} from '../types/api';
import { AppError } from '../middleware/errorHandler';

export class FabricCAService {
  /**
   * Register a new user with the CA
   */
  async registerUser(
    caUrl: string,
    orgMspId: string,
    username: string,
    role: string,
    _adminIdentity: { certificate: string; privateKey: string },
  ): Promise<UserCredentials> {
    try {
      const ca = new FabricCAServices(caUrl);

      // Create admin user context
      const adminUser = {
        enrollmentID: 'admin',
        enrollmentSecret: 'adminpw',
      };

      // Register the new user
      const secret = await ca.register(
        {
          enrollmentID: username,
          enrollmentSecret: '',
          role,
          affiliation: orgMspId.toLowerCase(),
          maxEnrollments: -1,
          attrs: [],
        },
        adminUser,
      );

      return {
        enrollmentId: username,
        enrollmentSecret: secret,
      };
    } catch (error) {
      throw new AppError(
        `Failed to register user: ${(error as Error).message}`,
        500,
        error,
      );
    }
  }

  /**
   * Enroll a user and get certificates
   */
  async enrollUser(
    caUrl: string,
    enrollmentId: string,
    enrollmentSecret: string,
  ): Promise<UserCertificates> {
    try {
      const ca = new FabricCAServices(caUrl);

      const enrollment = await ca.enroll({
        enrollmentID: enrollmentId,
        enrollmentSecret,
      });

      return {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
        rootCertificate: enrollment.rootCertificate || '',
      };
    } catch (error) {
      throw new AppError(
        `Failed to enroll user: ${(error as Error).message}`,
        500,
        error,
      );
    }
  }

  /**
   * Revoke a user certificate
   */
  async revokeUser(
    caUrl: string,
    enrollmentId: string,
    _adminIdentity: { certificate: string; privateKey: string },
  ): Promise<void> {
    try {
      const ca = new FabricCAServices(caUrl);

      // Create admin user context
      const adminUser = {
        enrollmentID: 'admin',
        enrollmentSecret: 'adminpw',
      };

      await ca.revoke(
        {
          enrollmentID: enrollmentId,
        },
        adminUser,
      );
    } catch (error) {
      throw new AppError(
        `Failed to revoke user: ${(error as Error).message}`,
        500,
        error,
      );
    }
  }

  /**
   * Get CA information
   */
  async getCAInfo(caUrl: string): Promise<CAInfo> {
    try {
      const ca = new FabricCAServices(caUrl);
      const info = await ca.getCAInfo();

      return {
        caName: info.CAName,
        version: info.Version || 'unknown',
        tlsCertificate: info.CAChain || undefined,
      };
    } catch (error) {
      throw new AppError(
        `Failed to get CA info: ${(error as Error).message}`,
        500,
        error,
      );
    }
  }
}
