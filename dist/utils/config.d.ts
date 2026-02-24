import { McpServerConfig } from '../types/mcp.js';
import { LogLevel } from './logger.js';
export type TransportType = 'stdio' | 'http';
export interface EnvironmentConfig {
    rocketcyber: {
        apiKey?: string;
        region?: string;
    };
    server: {
        name: string;
        version: string;
    };
    transport: {
        type: TransportType;
        port: number;
        host: string;
    };
    logging: {
        level: LogLevel;
        format: 'json' | 'simple';
    };
}
export declare function loadEnvironmentConfig(): EnvironmentConfig;
export declare function mergeWithMcpConfig(envConfig: EnvironmentConfig): McpServerConfig;
//# sourceMappingURL=config.d.ts.map