# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-23

### Added

- Initial release of RocketCyber MCP server
- 10 read-only tools covering Account, Agents, Incidents, Events, Firewalls, Apps, Defender, and Office 365
- MCP resources for account, incidents, and agents
- Dual transport support: stdio (default) and HTTP Streamable
- Lazy SDK initialization on first tool call
- Winston logger with all output to stderr
- Connection test tool
