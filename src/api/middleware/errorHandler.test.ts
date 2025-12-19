import { Request, Response } from 'express';
import { AppError, errorHandler, asyncHandler } from './errorHandler';

describe('errorHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should handle AppError correctly', () => {
    const error = new AppError('Test error', 400, { field: 'name' });

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'AppError',
      message: 'Test error',
      statusCode: 400,
      details: { field: 'name' },
    });
  });

  it('should handle generic Error correctly', () => {
    const error = new Error('Generic error');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'InternalServerError',
      message: 'Generic error',
      statusCode: 500,
    });
  });

  it('should log errors to console', () => {
    const error = new Error('Test error');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
  });
});

describe('AppError', () => {
  it('should create error with message and status code', () => {
    const error = new AppError('Not found', 404);

    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('AppError');
    expect(error.details).toBeUndefined();
  });

  it('should create error with details', () => {
    const error = new AppError('Validation failed', 400, { field: 'email' });

    expect(error.details).toEqual({ field: 'email' });
  });

  it('should capture stack trace', () => {
    const error = new AppError('Test', 500);

    expect(error.stack).toBeDefined();
  });
});

describe('asyncHandler', () => {
  it('should handle successful async operations', async () => {
    const mockHandler = jest.fn().mockResolvedValue(undefined);
    const wrappedHandler = asyncHandler(mockHandler);

    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const mockNext = jest.fn();

    await wrappedHandler(mockReq, mockRes, mockNext);

    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should catch and forward errors to next', async () => {
    const error = new Error('Async error');
    const mockHandler = jest.fn().mockRejectedValue(error);
    const wrappedHandler = asyncHandler(mockHandler);

    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const mockNext = jest.fn();

    await wrappedHandler(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
