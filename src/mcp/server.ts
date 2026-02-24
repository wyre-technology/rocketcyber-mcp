import { createServer, IncomingMessage, ServerResponse, Server as HttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
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
import { EnvironmentConfig } from '../utils/config.js';
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

  private async startHttpTransport(): Promise<void> {
    const port = this.envConfig?.transport?.port || 8080;
    const host = this.envConfig?.transport?.host || '0.0.0.0';

    this.httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
    });

    this.httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', transport: 'http', timestamp: new Date().toISOString() }));
        return;
      }

      if (url.pathname === '/mcp') {
        this.httpTransport!.handleRequest(req, res);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found', endpoints: ['/mcp', '/health'] }));
    });

    await this.server.connect(this.httpTransport as unknown as Transport);

    await new Promise<void>((resolve) => {
      this.httpServer!.listen(port, host, () => {
        this.logger.info(`RocketCyber MCP Server listening on http://${host}:${port}/mcp`);
        this.logger.info(`Health check available at http://${host}:${port}/health`);
        resolve();
      });
    });
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
