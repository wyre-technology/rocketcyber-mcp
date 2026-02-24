import { Logger } from '../utils/logger.js';
import { McpServerConfig } from '../types/mcp.js';
import { EnvironmentConfig } from '../utils/config.js';
export declare class RocketCyberMcpServer {
    private server;
    private rcService;
    private resourceHandler;
    private toolHandler;
    private logger;
    private envConfig;
    private httpServer?;
    private httpTransport?;
    constructor(config: McpServerConfig, logger: Logger, envConfig?: EnvironmentConfig);
    private setupHandlers;
    start(): Promise<void>;
    private startStdioTransport;
    private startHttpTransport;
    stop(): Promise<void>;
    private getServerInstructions;
}
//# sourceMappingURL=server.d.ts.map