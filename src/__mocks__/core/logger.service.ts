const mockLogger = {
  log: jest.fn(),
  success: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  header: jest.fn(),
  divider: jest.fn(),
  taskLines: jest.fn(),
};

export class LoggerService {
  private static instance: LoggerService | null = mockLogger;

  private constructor() {}

  public static getInstance(): LoggerService {
    return mockLogger as unknown as LoggerService;
  }

  public log(): void {
    mockLogger.log.apply(null, arguments);
  }

  public success(): void {
    mockLogger.success.apply(null, arguments);
  }

  public info(): void {
    mockLogger.info.apply(null, arguments);
  }

  public warn(): void {
    mockLogger.warn.apply(null, arguments);
  }

  public error(): void {
    mockLogger.error.apply(null, arguments);
  }

  public header(): void {
    mockLogger.header.apply(null, arguments);
  }

  public divider(): void {
    mockLogger.divider.apply(null, arguments);
  }

  public taskLines(): void {
    mockLogger.taskLines.apply(null, arguments);
  }
}