"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RocketCyberMcpServer = void 0;
const node_http_1 = require("node:http");
const node_crypto_1 = require("node:crypto");
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const rocketcyber_service_js_1 = require("../services/rocketcyber.service.js");
const resource_handler_js_1 = require("../handlers/resource.handler.js");
const tool_handler_js_1 = require("../handlers/tool.handler.js");
class RocketCyberMcpServer {
    constructor(config, logger, envConfig) {
        this.logger = logger;
        this.envConfig = envConfig;
        this.server = new index_js_1.Server({ name: config.name, version: config.version }, {
            capabilities: {
                resources: { subscribe: false, listChanged: true },
                tools: { listChanged: true }
            },
            instructions: this.getServerInstructions()
        });
        this.rcService = new rocketcyber_service_js_1.RocketCyberService(config, logger);
        this.resourceHandler = new resource_handler_js_1.RocketCyberResourceHandler(this.rcService, logger);
        this.toolHandler = new tool_handler_js_1.RocketCyberToolHandler(this.rcService, logger);
        this.setupHandlers();
    }
    setupHandlers() {
        this.logger.info('Setting up MCP request handlers...');
        this.server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
            try {
                const resources = await this.resourceHandler.listResources();
                return { resources };
            }
            catch (error) {
                this.logger.error('Failed to list resources:', error);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to list resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
        this.server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
            try {
                const content = await this.resourceHandler.readResource(request.params.uri);
                return { contents: [content] };
            }
            catch (error) {
                this.logger.error(`Failed to read resource ${request.params.uri}:`, error);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to read resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            try {
                const tools = await this.toolHandler.listTools();
                return { tools };
            }
            catch (error) {
                this.logger.error('Failed to list tools:', error);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to list tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            try {
                const result = await this.toolHandler.callTool(request.params.name, request.params.arguments || {});
                return { content: result.content, isError: result.isError };
            }
            catch (error) {
                this.logger.error(`Failed to call tool ${request.params.name}:`, error);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to call tool: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
        this.logger.info('MCP request handlers set up successfully');
    }
    async start() {
        const transportType = this.envConfig?.transport?.type || 'stdio';
        this.logger.info(`Starting RocketCyber MCP Server with ${transportType} transport...`);
        this.server.onerror = (error) => this.logger.error('MCP Server error:', error);
        this.server.oninitialized = () => this.logger.info('MCP Server initialized and ready');
        if (transportType === 'http') {
            await this.startHttpTransport();
        }
        else {
            await this.startStdioTransport();
        }
    }
    async startStdioTransport() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info('RocketCyber MCP Server connected to stdio transport');
    }
    async startHttpTransport() {
        const port = this.envConfig?.transport?.port || 8080;
        const host = this.envConfig?.transport?.host || '0.0.0.0';
        this.httpTransport = new streamableHttp_js_1.StreamableHTTPServerTransport({
            sessionIdGenerator: () => (0, node_crypto_1.randomUUID)(),
            enableJsonResponse: true,
        });
        this.httpServer = (0, node_http_1.createServer)((req, res) => {
            const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
            if (url.pathname === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', transport: 'http', timestamp: new Date().toISOString() }));
                return;
            }
            if (url.pathname === '/mcp') {
                this.httpTransport.handleRequest(req, res);
                return;
            }
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found', endpoints: ['/mcp', '/health'] }));
        });
        await this.server.connect(this.httpTransport);
        await new Promise((resolve) => {
            this.httpServer.listen(port, host, () => {
                this.logger.info(`RocketCyber MCP Server listening on http://${host}:${port}/mcp`);
                this.logger.info(`Health check available at http://${host}:${port}/health`);
                resolve();
            });
        });
    }
    async stop() {
        this.logger.info('Stopping RocketCyber MCP Server...');
        if (this.httpServer) {
            await new Promise((resolve, reject) => {
                this.httpServer.close((err) => err ? reject(err) : resolve());
            });
        }
        await this.server.close();
        this.logger.info('RocketCyber MCP Server stopped');
    }
    getServerInstructions() {
        return `# RocketCyber MCP Server

This server provides read-only access to RocketCyber Managed SOC data through the Model Context Protocol.

## Available Resources:
- **rocketcyber://account** - Account information
- **rocketcyber://incidents** - Security incidents
- **rocketcyber://agents** - Monitored agents/endpoints

## Available Tools (10 total):
- Account: get account info
- Agents: list monitored agents
- Incidents: list security incidents
- Events: list events, get event summary
- Firewalls: list firewall devices
- Apps: list managed apps
- Defender: get Windows Defender status
- Office: get Office 365 status
- Utility: test connection

## Authentication:
- ROCKETCYBER_API_KEY (required) - Your RocketCyber API key
- ROCKETCYBER_REGION (optional) - API region: us (default) or eu`;
    }
}
exports.RocketCyberMcpServer = RocketCyberMcpServer;
//# sourceMappingURL=server.js.map