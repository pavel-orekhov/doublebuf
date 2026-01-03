# HTTP MCP-Compatible PlantUML Encoder

## Goals

Create an HTTP API for encoding PlantUML diagrams into shareable URLs, enabling Claude, cto agents, and other AI systems to generate and display diagrams in conversations.

## Project Overview

A simple, stateless HTTP service that:
- Encodes PlantUML code to URLs for plantuml.com
- Provides MCP-compatible tool discovery and invocation
- Supports lock-free double buffer architecture planning
- Enables iterative diagram-based discussions

## Constraints

- **HTTP only**: RESTful API (not JSON-RPC 2.0)
- **Stateless**: No persistent storage in Phase 1
- **Size limit**: Max 50KB per PlantUML code
- **Performance**: <500ms response time (Netlify free tier)
- **Budget**: 125,000 invocations/month (Netlify free tier)
- **Format**: SVG output only in Phase 1

## Deployment

- **Platform**: Netlify Functions (free tier)
- **Runtime**: Node.js
- **Region**: Global CDN
- **URL**: https://webodar.netlify.app/api/tools

## Team & Stakeholders

- **Primary User**: cto Planning Agent (architecture planning for doublebuf project)
- **Secondary Users**: Claude, other MCP-compatible AI agents
- **Beneficiaries**: Architects, developers discussing system designs

## Key Dates

- **Started**: 2025-01-03
- **Phase 1 Target**: Tool discovery + PlantUML encoding
- **Phase 2**: History tracking (deferred)
- **Phase 3**: Expansion - more tools (deferred)
- **Phase 4**: Full MCP server (deferred)

## Links to Detailed Docs

- [Architecture](./ARCHITECTURE.md) - System architecture and data flow
- [Roadmap](./ROADMAP.md) - Future phases and features
- [Project Docs](./proj/mcp-plantuml-encoder/) - Detailed project documentation
