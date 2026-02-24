## [1.1.1](https://github.com/wyre-technology/rocketcyber-mcp/compare/v1.1.0...v1.1.1) (2026-02-24)


### Bug Fixes

* **ci:** add Setup Node step to Docker job for version extraction ([18666e2](https://github.com/wyre-technology/rocketcyber-mcp/commit/18666e2afb2ac3a692e0f95e9f3eaaea5d6ec0ea))

# [1.1.0](https://github.com/wyre-technology/rocketcyber-mcp/compare/v1.0.0...v1.1.0) (2026-02-24)


### Features

* add gateway auth mode and Dockerfile for hosted deployment ([0f57851](https://github.com/wyre-technology/rocketcyber-mcp/commit/0f578518224fea7caf290de56ced39657e93eb43))

# 1.0.0 (2026-02-24)


### Bug Fixes

* add .gitignore and remove node_modules/dist from tracking ([e3d52be](https://github.com/wyre-technology/rocketcyber-mcp/commit/e3d52be9788cd6d10a8bd5977d5477d50772af4f))
* add semantic-release branch configuration ([d7912f4](https://github.com/wyre-technology/rocketcyber-mcp/commit/d7912f48796dce8ca7f5db5e4d6cf770075c5ebe))


### Features

* initial rocketcyber-mcp server with 10 read-only tools ([59b4968](https://github.com/wyre-technology/rocketcyber-mcp/commit/59b49682c2d2085f2e78ed6f9153ade572960171))
* pass through region config to SDK ([15d96e7](https://github.com/wyre-technology/rocketcyber-mcp/commit/15d96e719103d8e700632314637d9b8b62ce3fbc))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Gateway authentication mode (`AUTH_MODE=gateway`) for hosted deployment behind the MCP Gateway
- Per-request credential extraction from `X-RocketCyber-API-Key` and `X-RocketCyber-Region` HTTP headers
- `parseCredentialsFromHeaders()` utility for header-based credential parsing
- `updateCredentials()` method on `RocketCyberService` for runtime credential swapping
- Dockerfile with multi-stage build (node:22-alpine) for containerized deployment
- Docker job in CI workflow to build and push to GHCR (`ghcr.io/wyre-technology/rocketcyber-mcp`)
- Health check endpoint now reports `authMode` in gateway mode

## [1.0.0] - 2026-02-23

### Added

- Initial release of RocketCyber MCP server
- 10 read-only tools covering Account, Agents, Incidents, Events, Firewalls, Apps, Defender, and Office 365
- MCP resources for account, incidents, and agents
- Dual transport support: stdio (default) and HTTP Streamable
- Lazy SDK initialization on first tool call
- Winston logger with all output to stderr
- Connection test tool
