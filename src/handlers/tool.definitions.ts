export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export const TOOL_DEFINITIONS: McpTool[] = [
  {
    name: 'rocketcyber_test_connection',
    description: 'Test the connection to RocketCyber API',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'rocketcyber_get_account',
    description: 'Get RocketCyber account information',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'number', description: 'Account ID (optional, defaults to current account)' }
      },
      required: []
    }
  },
  {
    name: 'rocketcyber_list_agents',
    description: 'List monitored agents/endpoints in RocketCyber',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        pageSize: { type: 'number', description: 'Results per page' },
        sort: { type: 'string', description: 'Sort field' },
        accountId: { type: 'number', description: 'Filter by account ID' },
        connectivity: { type: 'string', description: 'Filter by connectivity status (online/offline)' },
        hostname: { type: 'string', description: 'Filter by hostname' },
        platform: { type: 'string', description: 'Filter by platform' },
        dates: { type: 'string', description: 'Date range filter' }
      },
      required: []
    }
  },
  {
    name: 'rocketcyber_list_incidents',
    description: 'List security incidents in RocketCyber',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        pageSize: { type: 'number', description: 'Results per page' },
        sort: { type: 'string', description: 'Sort field' },
        accountId: { type: 'number', description: 'Filter by account ID' },
        status: { type: 'string', description: 'Filter by status' },
        dates: { type: 'string', description: 'Date range filter' },
        severity: { type: 'string', description: 'Filter by severity' },
        title: { type: 'string', description: 'Filter by title' }
      },
      required: []
    }
  },
  {
    name: 'rocketcyber_list_events',
    description: 'List security events in RocketCyber',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        pageSize: { type: 'number', description: 'Results per page' },
        sort: { type: 'string', description: 'Sort field' },
        accountId: { type: 'number', description: 'Filter by account ID' },
        eventType: { type: 'string', description: 'Filter by event type' },
        severity: { type: 'string', description: 'Filter by severity' },
        dates: { type: 'string', description: 'Date range filter' },
        hostname: { type: 'string', description: 'Filter by hostname' }
      },
      required: []
    }
  },
  {
    name: 'rocketcyber_get_event_summary',
    description: 'Get event summary/statistics from RocketCyber',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'number', description: 'Account ID' },
        dates: { type: 'string', description: 'Date range filter' }
      },
      required: []
    }
  },
  {
    name: 'rocketcyber_list_firewalls',
    description: 'List firewall devices in RocketCyber',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        pageSize: { type: 'number', description: 'Results per page' },
        sort: { type: 'string', description: 'Sort field' },
        accountId: { type: 'number', description: 'Filter by account ID' },
        connectivity: { type: 'string', description: 'Filter by connectivity status' },
        hostname: { type: 'string', description: 'Filter by hostname' },
        vendor: { type: 'string', description: 'Filter by vendor' }
      },
      required: []
    }
  },
  {
    name: 'rocketcyber_list_apps',
    description: 'List managed apps in RocketCyber',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        pageSize: { type: 'number', description: 'Results per page' },
        sort: { type: 'string', description: 'Sort field' },
        accountId: { type: 'number', description: 'Filter by account ID' },
        status: { type: 'string', description: 'Filter by status' },
        name: { type: 'string', description: 'Filter by name' }
      },
      required: []
    }
  },
  {
    name: 'rocketcyber_get_defender',
    description: 'Get Windows Defender status from RocketCyber',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'number', description: 'Account ID' }
      },
      required: []
    }
  },
  {
    name: 'rocketcyber_get_office',
    description: 'Get Office 365 status from RocketCyber',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'number', description: 'Account ID' }
      },
      required: []
    }
  }
];
