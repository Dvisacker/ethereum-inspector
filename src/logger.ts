import winston from "winston";
import path from "path";

export class Logger {
  private logger: winston.Logger;
  private static instance: Logger;

  private constructor() {
    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    );

    // Define console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf((info: any) => {
        return `${info.timestamp} [${info.level}]: ${info.message} ${
          Object.keys(info.meta).length
            ? JSON.stringify(info.meta, null, 2)
            : ""
        }`;
      })
    );

    // Create logger instance
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: logFormat,
      defaultMeta: { service: "arkham-cli" },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: consoleFormat,
        }),
        // File transport for errors
        new winston.transports.File({
          filename: path.join("logs", "error.log"),
          level: "error",
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: path.join("logs", "combined.log"),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      ],
    });

    // Handle uncaught exceptions and rejections
    this.logger.exceptions.handle(
      new winston.transports.File({
        filename: path.join("logs", "exceptions.log"),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    this.logger.rejections.handle(
      new winston.transports.File({
        filename: path.join("logs", "rejections.log"),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  // Singleton pattern
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Log methods
  public error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  public verbose(message: string, meta?: any): void {
    this.logger.verbose(message, meta);
  }

  // Method to add custom transport
  public addTransport(transport: winston.transport): void {
    this.logger.add(transport);
  }

  // Method to remove transport
  public removeTransport(transport: winston.transport): void {
    this.logger.remove(transport);
  }

  // Method to get the underlying winston logger
  public getLogger(): winston.Logger {
    return this.logger;
  }
}

// Export a default instance
export const logger = Logger.getInstance();
