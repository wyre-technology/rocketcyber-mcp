# @wyre-technology/node-rocketcyber

Comprehensive, fully-typed Node.js/TypeScript library for the RocketCyber (Kaseya) Managed SOC API.

## Features

- Full TypeScript support with comprehensive type definitions
- Bearer token authentication
- Built-in rate limiting (60 req/min conservative default) with configurable thresholds
- Automatic retry logic for rate limits and server errors
- 8 read-only resource endpoints
- Automatic pagination with `listAll()` methods
- Zero runtime dependencies -- uses native fetch

## Installation

```bash
npm install @wyre-technology/node-rocketcyber
```

This package is published to GitHub Packages. Add the following to your `.npmrc` file:

```
# .npmrc
@wyre-technology:registry=https://npm.pkg.github.com
```

## Quick Start

```typescript
import { RocketCyberClient } from '@wyre-technology/node-rocketcyber';

const client = new RocketCyberClient({
  apiKey: 'your-api-key',
  region: 'us', // optional, defaults to 'us'
});

// Get account information
const account = await client.account.get();
console.log(account);

// List incidents
const incidents = await client.incidents.list();
console.log(incidents.data);

// Fetch all incidents across all pages
const allIncidents = await client.incidents.listAll();
console.log(`Total incidents: ${allIncidents.length}`);
```

## Configuration

### Basic Configuration

```typescript
const client = new RocketCyberClient({
  apiKey: 'your-api-key',
  region: 'us', // defaults to 'us'
});
```

### Custom Base URL

```typescript
const client = new RocketCyberClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://custom-api-endpoint.example.com/v3',
});
```

### Rate Limiting

The client includes built-in rate limiting with sensible defaults. You can customize the behavior:

```typescript
const client = new RocketCyberClient({
  apiKey: 'your-api-key',
  rateLimit: {
    enabled: true,           // enable/disable rate limiting (default: true)
    maxRequests: 60,         // max requests per window (default: 60)
    windowMs: 60_000,        // time window in ms (default: 60000)
    throttleThreshold: 0.8,  // start throttling at 80% capacity (default: 0.8)
    retryAfterMs: 5_000,     // retry delay on 429 responses (default: 5000)
    maxRetries: 3,           // max retry attempts (default: 3)
  },
});
```

## API Reference

All resources are read-only. Methods that return lists support pagination via `list()` (single page) and `listAll()` (all pages).

### Account

```typescript
// Get account info for the authenticated account
const account = await client.account.get();

// Get account info for a specific account
const account = await client.account.get({ accountId: 12345 });
```

### Agents

```typescript
// List agents (paginated)
const agents = await client.agents.list();
const agents = await client.agents.list({ accountId: 12345, page: 2, pageSize: 50 });

// Fetch all agents across all pages
const allAgents = await client.agents.listAll();
const allAgents = await client.agents.listAll({ accountId: 12345 });
```

### Incidents

```typescript
// List incidents (paginated)
const incidents = await client.incidents.list();
const incidents = await client.incidents.list({ accountId: 12345, page: 1 });

// Fetch all incidents across all pages
const allIncidents = await client.incidents.listAll();
```

### Events

```typescript
// List events (paginated)
const events = await client.events.list();
const events = await client.events.list({ accountId: 12345, page: 1 });

// Fetch all events across all pages
const allEvents = await client.events.listAll();

// Get event summary
const summary = await client.events.getSummary();
const summary = await client.events.getSummary({ accountId: 12345 });
```

### Firewalls

```typescript
// List firewalls (paginated)
const firewalls = await client.firewalls.list();
const firewalls = await client.firewalls.list({ accountId: 12345, page: 1 });

// Fetch all firewalls across all pages
const allFirewalls = await client.firewalls.listAll();
```

### Apps

```typescript
// List apps (paginated)
const apps = await client.apps.list();
const apps = await client.apps.list({ accountId: 12345, page: 1 });

// Fetch all apps across all pages
const allApps = await client.apps.listAll();
```

### Defender

```typescript
// Get Windows Defender status
const defender = await client.defender.get();
const defender = await client.defender.get({ accountId: 12345 });
```

### Office 365

```typescript
// Get Office 365 status
const office = await client.office.get();
const office = await client.office.get({ accountId: 12345 });
```

## Error Handling

The client throws typed errors for different failure scenarios:

```typescript
import {
  RocketCyberError,
  RocketCyberAuthenticationError,
  RocketCyberForbiddenError,
  RocketCyberNotFoundError,
  RocketCyberRateLimitError,
  RocketCyberServerError,
} from '@wyre-technology/node-rocketcyber';

try {
  const account = await client.account.get();
} catch (error) {
  if (error instanceof RocketCyberAuthenticationError) {
    // 401 - Invalid or missing API key
    console.error('Authentication failed:', error.message);
  } else if (error instanceof RocketCyberForbiddenError) {
    // 403 - Insufficient permissions
    console.error('Forbidden:', error.message);
  } else if (error instanceof RocketCyberNotFoundError) {
    // 404 - Resource not found
    console.error('Not found:', error.message);
  } else if (error instanceof RocketCyberRateLimitError) {
    // 429 - Rate limit exceeded (after retries exhausted)
    console.error('Rate limited:', error.message);
    console.error('Retry after:', error.retryAfter, 'ms');
  } else if (error instanceof RocketCyberServerError) {
    // 5xx - Server error
    console.error('Server error:', error.message);
  } else if (error instanceof RocketCyberError) {
    // Other API errors
    console.error('API error:', error.statusCode, error.message);
  }
}
```

## TypeScript Support

All types are exported for use in your application:

```typescript
import type {
  // Account
  Account,

  // Agents
  Agent,
  AgentListParams,

  // Incidents
  Incident,
  IncidentListParams,

  // Events
  Event,
  EventListParams,
  EventSummary,
  EventSummaryParams,

  // Firewalls
  Firewall,
  FirewallListParams,

  // Apps
  App,
  AppListParams,

  // Defender
  DefenderStatus,
  DefenderEndpoint,
  DefenderParams,

  // Office 365
  OfficeStatus,
  OfficeLicense,
  OfficeParams,

  // Common
  BaseListParams,
  PaginatedResponse,
} from '@wyre-technology/node-rocketcyber';
```

## Rate Limit Status

You can check the current rate limit status at any time:

```typescript
const status = client.getRateLimitStatus();
console.log(`Remaining requests: ${status.remaining}`);
console.log(`Current rate: ${status.rate} req/min`);
```

## License

[Apache-2.0](LICENSE)

## Author

[Wyre Technology](https://github.com/wyre-technology)
