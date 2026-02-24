#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_js_1 = require("./mcp/server.js");
const logger_js_1 = require("./utils/logger.js");
const config_js_1 = require("./utils/config.js");
async function main() {
    let logger;
    try {
        const envConfig = (0, config_js_1.loadEnvironmentConfig)();
        const mcpConfig = (0, config_js_1.mergeWithMcpConfig)(envConfig);
        logger = new logger_js_1.Logger(envConfig.logging.level, envConfig.logging.format);
        logger.info('Starting RocketCyber MCP Server...');
        logger.debug('Configuration loaded', {
            serverName: mcpConfig.name,
            serverVersion: mcpConfig.version,
            hasCredentials: !!mcpConfig.rocketcyber.apiKey
        });
        if (!mcpConfig.rocketcyber.apiKey) {
            logger.warn('Missing RocketCyber credentials. Tools will return errors until ROCKETCYBER_API_KEY is configured.');
        }
        const server = new server_js_1.RocketCyberMcpServer(mcpConfig, logger, envConfig);
        process.on('SIGINT', async () => {
            logger.info('Received SIGINT, shutting down gracefully...');
            await server.stop();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM, shutting down gracefully...');
            await server.stop();
            process.exit(0);
        });
        await server.start();
    }
    catch (error) {
        if (logger) {
            logger.error('Failed to start RocketCyber MCP Server:', error);
        }
        else {
            console.error('Failed to start RocketCyber MCP Server:', error);
        }
        process.exit(1);
    }
}
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map