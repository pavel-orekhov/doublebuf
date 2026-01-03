# HTTP MCP-Compatible PlantUML Encoder

A simple HTTP API for encoding PlantUML diagrams into shareable URLs. Designed for AI agents (Claude, cto agents) to generate and display diagrams in conversations.

## Quick Start

### Discover Available Tools

```bash
curl https://webodar.netlify.app/api/tools
```

### Encode a Diagram

```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{
    "plantumlCode": "@startuml\nA --> B\n@enduml"
  }'
```

### Response

```json
{
  "success": true,
  "result": {
    "url": "https://www.plantuml.com/plantuml/svg/...",
    "encoded": "...",
    "format": "svg"
  }
}
```

### View Diagram

Click the URL in your browser to see the rendered diagram on plantuml.com.

## Features

- **MCP-Compatible**: Tool discovery and invocation following MCP semantics
- **HTTP REST**: Simple web-native API (not JSON-RPC)
- **Stateless**: No persistent storage (Phase 1)
- **Deterministic**: Same code → Same URL
- **Fast**: <500ms response time (cold start)
- **CORS Enabled**: Works from any origin
- **Free Tier**: Deployed on Netlify free tier

## Use Cases

### cto Planning Agent
Planning lock-free double buffer architecture:
- FSM diagrams for state transitions
- Sequence diagrams for writer-reader interactions
- Component diagrams for system structure

### Claude Integration
Generate diagrams during technical discussions:
- System architecture
- Data flow
- State machines

### Quick Diagram Sharing
Share diagrams without manual copy-paste:
- Encode in conversation
- Share URL
- User views instantly

## API Endpoints

### GET /api/tools
Discover available tools and their schemas.

### POST /api/tools/encodePlantUML
Encode PlantUML code into a shareable URL.

**Request:**
```json
{
  "plantumlCode": "@startuml\nA --> B\n@enduml"
}
```

**Response (Success):**
```json
{
  "success": true,
  "result": {
    "url": "https://www.plantuml.com/plantuml/svg/...",
    "encoded": "...",
    "format": "svg"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "EMPTY_CODE",
    "message": "plantumlCode is required and cannot be empty"
  }
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `EMPTY_CODE` | 400 | PlantUML code is empty, null, or whitespace-only |
| `CODE_TOO_LARGE` | 413 | Code exceeds 50KB size limit |
| `ENCODING_FAILED` | 500 | Internal error during encoding |
| `TOOL_NOT_FOUND` | 404 | Requested tool does not exist |
| `METHOD_NOT_ALLOWED` | 405 | Wrong HTTP method used |

## Constraints

- **Max size**: 50KB per PlantUML code
- **Format**: SVG only (Phase 1)
- **Storage**: None (stateless)
- **Authentication**: None (public API)

## Deployment

**Platform:** Netlify Functions (free tier)
**URL:** https://webodar.netlify.app/api/tools

### Local Development

```bash
# Install dependencies
npm install

# Test locally (requires Netlify CLI)
npm install -g netlify-cli
netlify dev
```

## Documentation

For complete documentation, see:

- **[Project Overview](./docs/PROJECT.md)** - Goals, constraints, timeline
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture and data flow
- **[Roadmap](./docs/ROADMAP.md)** - Future phases and features
- **[Technical Spec](./docs/proj/mcp-plantuml-encoder/SPEC.md)** - API specification
- **[Context for Agents](./docs/proj/mcp-plantuml-encoder/CONTEXT.md)** - How to use this service

## Project Structure

```
.
├── docs/
│   ├── PROJECT.md              # Project overview
│   ├── ARCHITECTURE.md          # System architecture
│   ├── ROADMAP.md               # Future features
│   └── proj/mcp-plantuml-encoder/
│       ├── PRD.md               # Product requirements
│       ├── SPEC.md              # Technical specification
│       ├── DECISIONS.log        # Decision log
│       ├── CONTEXT.md           # Agent context
│       ├── GLOSSARY.md          # Terminology
│       ├── STATUS.md            # Current status
│       ├── tasks/               # Task documentation
│       └── tests/               # Test documentation
├── netlify/
│   └── functions/
│       ├── tools-discovery.js    # GET /api/tools
│       ├── tools-call.js         # POST /api/tools/*
│       └── encode-plantuml.js    # Legacy endpoint
├── netlify.toml               # Netlify configuration
├── package.json               # Node.js dependencies
└── README.md                 # This file
```

## Examples

### Lock-Free Buffer FSM

```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{
    "plantumlCode": "@startuml\n[*] --> Created\nCreated --> Writing: producer writes\nWriting --> Swapping: reached swap point\nSwapping --> Reading: CAS success\nReading --> Created: reader done\n@enduml"
  }'
```

### Writer-Reader Sequence

```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{
    "plantumlCode": "@startuml\nparticipant Writer\nparticipant FrontBuffer\nparticipant CASSwap\nparticipant BackBuffer\nparticipant Reader\n\nWriter ->> FrontBuffer: write(data)\nFrontBuffer ->> CASSwap: ready\nCASSwap ->> BackBuffer: swap\nReader ->> BackBuffer: read()\n@enduml"
  }'
```

More examples in [docs/proj/mcp-plantuml-encoder/tests/examples.md](./docs/proj/mcp-plantuml-encoder/tests/examples.md).

## License

MIT

## Authors

[User]

## Status

**Phase:** Phase 1 - Core Implementation
**Completion:** 80%
**Next Steps:** Deployment to production
