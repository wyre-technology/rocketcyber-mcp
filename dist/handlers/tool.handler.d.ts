import { RocketCyberService } from '../services/rocketcyber.service.js';
import { Logger } from '../utils/logger.js';
import { McpTool } from './tool.definitions.js';
export { McpTool };
export interface McpToolResult {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
export declare class RocketCyberToolHandler {
    private service;
    private logger;
    constructor(service: RocketCyberService, logger: Logger);
    listTools(): Promise<McpTool[]>;
    private getDispatchTable;
    callTool(name: string, args: Record<string, any>): Promise<McpToolResult>;
}
//# sourceMappingURL=tool.handler.d.ts.map