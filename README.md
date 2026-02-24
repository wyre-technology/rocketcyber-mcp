# rocketcyber-mcp

MCP (Model Context Protocol) server for the [RocketCyber](https://www.rocketcyber.com/) Managed SOC platform. Provides read-only access to RocketCyber security data through 10 tools and 3 resources.

## Features

- 10 read-only tools covering all RocketCyber API resources
- 3 MCP resources for quick data access
- Dual transport: stdio (default) and HTTP Streamable
- Lazy SDK initialization on first tool call
- Winston logger with all output routed to stderr
- Connection test tool for validating credentials

## Installation

```bash
npm install
npm run build
```

## Configuration

| Environment Variable | Required | Default | Description |
|---|---|---|---|
| `ROCKETCYBER_API_KEY` | Yes | - | RocketCyber API key |
| `ROCKETCYBER_REGION` | No | `us` | API region: `us` or `eu` |
| `MCP_TRANSPORT` | No | `stdio` | Transport type: `stdio` or `http` |
| `MCP_HTTP_PORT` | No | `8080` | HTTP port (when using http transport) |
| `MCP_HTTP_HOST` | No | `0.0.0.0` | HTTP host (when using http transport) |
| `LOG_LEVEL` | No | `info` | Log level: `error`, `warn`, `info`, `debug` |
| `LOG_FORMAT` | No | `simple` | Log format: `json` or `simple` |

## Usage

### Claude Desktop (stdio)

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "rocketcyber": {
      "command": "node",
      "args": ["/path/to/rocketcyber-mcp/dist/entry.js"],
      "env": {
        "ROCKETCYBER_API_KEY": "your-api-key"
      }
    }
  }
}
```

### HTTP Transport

```bash
ROCKETCYBER_API_KEY=your-api-key MCP_TRANSPORT=http npm start
```

## Tools

| Tool | Description |
|---|---|
| `rocketcyber_test_connection` | Test the connection to RocketCyber API |
| `rocketcyber_get_account` | Get account information |
| `rocketcyber_list_agents` | List monitored agents/endpoints |
| `rocketcyber_list_incidents` | List security incidents |
| `rocketcyber_list_events` | List security events |
| `rocketcyber_get_event_summary` | Get event summary/statistics |
| `rocketcyber_list_firewalls` | List firewall devices |
| `rocketcyber_list_apps` | List managed apps |
| `rocketcyber_get_defender` | Get Windows Defender status |
| `rocketcyber_get_office` | Get Office 365 status |

## Resources

| URI | Description |
|---|---|
| `rocketcyber://account` | Account information |
| `rocketcyber://incidents` | Security incidents |
| `rocketcyber://agents` | Monitored agents/endpoints |

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Start production server
npm start
```

## License

[Apache-2.0](LICENSE)
