"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RocketCyberResourceHandler = void 0;
class RocketCyberResourceHandler {
    constructor(service, logger) {
        this.service = service;
        this.logger = logger;
    }
    async listResources() {
        return [
            { uri: 'rocketcyber://account', name: 'Account Info', description: 'RocketCyber account information', mimeType: 'application/json' },
            { uri: 'rocketcyber://incidents', name: 'Security Incidents', description: 'List of security incidents', mimeType: 'application/json' },
            { uri: 'rocketcyber://agents', name: 'Monitored Agents', description: 'List of monitored agents/endpoints', mimeType: 'application/json' },
        ];
    }
    async readResource(uri) {
        this.logger.debug(`Reading resource: ${uri}`);
        const resourceType = this.parseUri(uri);
        let data;
        let description;
        switch (resourceType) {
            case 'account':
                data = await this.service.getAccount();
                description = `Account: ${data?.accountName || 'Unknown'}`;
                break;
            case 'incidents':
                data = await this.service.listIncidents({ pageSize: 100 });
                description = `${data?.data?.length || 0} security incidents`;
                break;
            case 'agents':
                data = await this.service.listAgents({ pageSize: 100 });
                description = `${data?.data?.length || 0} monitored agents`;
                break;
            default:
                throw new Error(`Unknown resource type: ${resourceType}`);
        }
        return {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
                description, uri, data,
                metadata: {
                    timestamp: new Date().toISOString(),
                    resourceType
                }
            }, null, 2)
        };
    }
    parseUri(uri) {
        const match = uri.match(/^rocketcyber:\/\/(.+)$/);
        if (!match)
            throw new Error(`Invalid RocketCyber URI format: ${uri}`);
        return match[1];
    }
}
exports.RocketCyberResourceHandler = RocketCyberResourceHandler;
//# sourceMappingURL=resource.handler.js.map