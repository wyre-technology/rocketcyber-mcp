import { createServer, IncomingMessage, ServerResponse, Server as HttpServer } from 'node:http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { RocketCyberService } from '../services/rocketcyber.service.js';
import { Logger } from '../utils/logger.js';
import { McpServerConfig } from '../types/mcp.js';
import { EnvironmentConfig, parseCredentialsFromHeaders, GatewayCredentials } from '../utils/config.js';
import { RocketCyberResourceHandler } from '../handlers/resource.handler.js';
import { RocketCyberToolHandler } from '../handlers/tool.handler.js';

export class RocketCyberMcpServer {
  private server: Server;
  private rcService: RocketCyberService;
  private resourceHandler: RocketCyberResourceHandler;
  private toolHandler: RocketCyberToolHandler;
  private logger: Logger;
  private envConfig: EnvironmentConfig | undefined;
  private httpServer?: HttpServer;
  private httpTransport?: StreamableHTTPServerTransport;

  constructor(config: McpServerConfig, logger: Logger, envConfig?: EnvironmentConfig) {
    this.logger = logger;
    this.envConfig = envConfig;

    this.server = new Server(
      { name: config.name, version: config.version },
      {
        capabilities: {
          resources: { subscribe: false, listChanged: true },
          tools: { listChanged: true }
        },
        instructions: this.getServerInstructions()
      }
    );

    this.rcService = new RocketCyberService(config, logger);
    this.resourceHandler = new RocketCyberResourceHandler(this.rcService, logger);
    this.toolHandler = new RocketCyberToolHandler(this.rcService, logger);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.logger.info('Setting up MCP request handlers...');

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const resources = await this.resourceHandler.listResources();
        return { resources };
      } catch (error) {
        this.logger.error('Failed to list resources:', error);
        throw new McpError(ErrorCode.InternalError, `Failed to list resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        const content = await this.resourceHandler.readResource(request.params.uri);
        return { contents: [content] };
      } catch (error) {
        this.logger.error(`Failed to read resource ${request.params.uri}:`, error);
        throw new McpError(ErrorCode.InternalError, `Failed to read resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const tools = await this.toolHandler.listTools();
        return { tools };
      } catch (error) {
        this.logger.error('Failed to list tools:', error);
        throw new McpError(ErrorCode.InternalError, `Failed to list tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const result = await this.toolHandler.callTool(request.params.name, request.params.arguments || {});
        return { content: result.content, isError: result.isError };
      } catch (error) {
        this.logger.error(`Failed to call tool ${request.params.name}:`, error);
        throw new McpError(ErrorCode.InternalError, `Failed to call tool: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    this.logger.info('MCP request handlers set up successfully');
  }

  async start(): Promise<void> {
    const transportType = this.envConfig?.transport?.type || 'stdio';
    this.logger.info(`Starting RocketCyber MCP Server with ${transportType} transport...`);

    this.server.onerror = (error) => this.logger.error('MCP Server error:', error);
    this.server.oninitialized = () => this.logger.info('MCP Server initialized and ready');

    if (transportType === 'http') {
      await this.startHttpTransport();
    } else {
      await this.startStdioTransport();
    }
  }

  private async startStdioTransport(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('RocketCyber MCP Server connected to stdio transport');
  }

  /**
   * Start with HTTP Streamable transport.
   * In gateway mode, credentials are extracted from request headers on each request.
   */
  private async startHttpTransport(): Promise<void> {
    const port = this.envConfig?.transport?.port || 8080;
    const host = this.envConfig?.transport?.host || '0.0.0.0';
    const isGatewayMode = this.envConfig?.auth?.mode === 'gateway';

    // Stateless mode: no session IDs. The gateway manages per-user sessions;
    // the backend just processes each request independently.  This allows
    // multiple clients (via the gateway) to hit the same server instance
    // without "Server already initialized" errors.
    this.httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    this.httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

      // Health endpoint - no auth required
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          transport: 'http',
          authMode: isGatewayMode ? 'gateway' : 'env',
          timestamp: new Date().toISOString()
        }));
        return;
      }

      // MCP endpoint
      if (url.pathname === '/mcp') {
        // In gateway mode, extract credentials from headers
        if (isGatewayMode) {
          const credentials = this.extractGatewayCredentials(req);
          if (!credentials.apiKey) {
            this.logger.warn('Gateway mode: Missing required API key in headers');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'Missing credentials',
              message: 'Gateway mode requires X-RocketCyber-API-Key header',
              required: ['X-RocketCyber-API-Key']
            }));
            return;
          }
          // Update service credentials for this request
          this.updateCredentials(credentials);
        }

        this.httpTransport!.handleRequest(req, res);
        return;
      }

      // 404 for everything else
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found', endpoints: ['/mcp', '/health'] }));
    });

    await this.server.connect(this.httpTransport as unknown as Transport);

    await new Promise<void>((resolve) => {
      this.httpServer!.listen(port, host, () => {
        this.logger.info(`RocketCyber MCP Server listening on http://${host}:${port}/mcp`);
        this.logger.info(`Health check available at http://${host}:${port}/health`);
        this.logger.info(`Authentication mode: ${isGatewayMode ? 'gateway (header-based)' : 'env (environment variables)'}`);
        resolve();
      });
    });
  }

  /**
   * Extract credentials from gateway-injected HTTP headers.
   */
  private extractGatewayCredentials(req: IncomingMessage): GatewayCredentials {
    const headers = req.headers as Record<string, string | string[] | undefined>;
    return parseCredentialsFromHeaders(headers);
  }

  /**
   * Update the RocketCyber service with new credentials.
   * Used in gateway mode where credentials come from request headers.
   */
  private updateCredentials(credentials: GatewayCredentials): void {
    if (credentials.apiKey) {
      this.rcService.updateCredentials(credentials.apiKey, credentials.region);
    }
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping RocketCyber MCP Server...');
    if (this.httpServer) {
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.close((err) => err ? reject(err) : resolve());
      });
    }
    await this.server.close();
    this.logger.info('RocketCyber MCP Server stopped');
  }

  private getServerInstructions(): string {
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
