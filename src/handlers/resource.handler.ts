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

export class RocketCyberResourceHandler {
  private service: RocketCyberService;
  private logger: Logger;

  constructor(service: RocketCyberService, logger: Logger) {
    this.service = service;
    this.logger = logger;
  }

  async listResources(): Promise<McpResource[]> {
    return [
      { uri: 'rocketcyber://account', name: 'Account Info', description: 'RocketCyber account information', mimeType: 'application/json' },
      { uri: 'rocketcyber://incidents', name: 'Security Incidents', description: 'List of security incidents', mimeType: 'application/json' },
      { uri: 'rocketcyber://agents', name: 'Monitored Agents', description: 'List of monitored agents/endpoints', mimeType: 'application/json' },
    ];
  }

  async readResource(uri: string): Promise<McpResourceContent> {
    this.logger.debug(`Reading resource: ${uri}`);
    const resourceType = this.parseUri(uri);

    let data: any;
    let description: string;

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

  private parseUri(uri: string): string {
    const match = uri.match(/^rocketcyber:\/\/(.+)$/);
    if (!match) throw new Error(`Invalid RocketCyber URI format: ${uri}`);
    return match[1];
  }
}
