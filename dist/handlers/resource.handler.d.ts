import { RocketCyberService } from '../services/rocketcyber.service.js';
import { Logger } from '../utils/logger.js';
export interface McpResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}
export interface McpResourceContent {
    uri: string;
    mimeType: string;
    text?: string;
}
export declare class RocketCyberResourceHandler {
    private service;
    private logger;
    constructor(service: RocketCyberService, logger: Logger);
    listResources(): Promise<McpResource[]>;
    readResource(uri: string): Promise<McpResourceContent>;
    private parseUri;
}
//# sourceMappingURL=resource.handler.d.ts.map