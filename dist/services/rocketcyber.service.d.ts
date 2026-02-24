import { McpServerConfig } from '../types/mcp.js';
import { Logger } from '../utils/logger.js';
export declare class RocketCyberService {
    private client;
    private logger;
    private config;
    private initializationPromise;
    constructor(config: McpServerConfig, logger: Logger);
    private ensureClient;
    private ensureInitialized;
    private initialize;
    getAccount(params?: any): Promise<any>;
    listAgents(params?: any): Promise<any>;
    listIncidents(params?: any): Promise<any>;
    listEvents(params?: any): Promise<any>;
    getEventSummary(params?: any): Promise<any>;
    listFirewalls(params?: any): Promise<any>;
    listApps(params?: any): Promise<any>;
    getDefender(params?: any): Promise<any>;
    getOffice(params?: any): Promise<any>;
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=rocketcyber.service.d.ts.map