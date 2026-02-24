"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnvironmentConfig = loadEnvironmentConfig;
exports.mergeWithMcpConfig = mergeWithMcpConfig;
function loadEnvironmentConfig() {
    const transportType = process.env.MCP_TRANSPORT || 'stdio';
    if (transportType !== 'stdio' && transportType !== 'http') {
        throw new Error(`Invalid MCP_TRANSPORT value: "${transportType}". Must be "stdio" or "http".`);
    }
    return {
        rocketcyber: {
            apiKey: process.env.ROCKETCYBER_API_KEY,
            region: process.env.ROCKETCYBER_REGION || 'us',
        },
        server: {
            name: process.env.MCP_SERVER_NAME || 'rocketcyber-mcp',
            version: process.env.MCP_SERVER_VERSION || '1.0.0'
        },
        transport: {
            type: transportType,
            port: parseInt(process.env.MCP_HTTP_PORT || '8080', 10),
            host: process.env.MCP_HTTP_HOST || '0.0.0.0'
        },
        logging: {
            level: process.env.LOG_LEVEL || 'info',
            format: process.env.LOG_FORMAT || 'simple'
        }
    };
}
function mergeWithMcpConfig(envConfig) {
    return {
        name: envConfig.server.name,
        version: envConfig.server.version,
        rocketcyber: {
            apiKey: envConfig.rocketcyber.apiKey,
            region: envConfig.rocketcyber.region,
        }
    };
}
//# sourceMappingURL=config.js.map