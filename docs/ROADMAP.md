# Project Roadmap

## Phase 1: Core Implementation ✓ (Current)

**Status:** In Progress
**Target:** Basic MCP-compatible API with PlantUML encoding

### Completed
- [x] Project planning and specification
- [x] Architecture design
- [x] Tool discovery endpoint (`GET /api/tools`)
- [x] Tool invocation endpoint (`POST /api/tools/encodePlantUML`)
- [x] PlantUML encoding algorithm
- [x] Error handling (EMPTY_CODE, CODE_TOO_LARGE, ENCODING_FAILED)
- [x] CORS configuration
- [x] Netlify deployment configuration

### In Progress
- [ ] Documentation completion
- [ ] Testing and validation
- [ ] Production deployment

### Deliverables
- 2 Netlify Functions (discovery + call)
- Tool schema in discovery response
- Deterministic URL generation
- Error handling with proper status codes
- Complete documentation set

---

## Phase 2: History Tracking (Deferred)

**Status:** Planned
**Priority:** Medium
**Estimated Effort:** 4-6 hours

### Goals
- Store diagram history per session
- Retrieve latest N diagrams
- TTL-based expiration

### New Endpoints
```
GET /api/diagrams/latest
  → Returns last N diagrams (max 10)

GET /api/diagrams/{sessionId}
  → Returns all diagrams for a session

POST /api/diagrams
  → Store diagram with metadata
```

### Implementation
- **Storage:** Netlify KV (key-value)
- **Schema:**
  ```json
  {
    "sessionId": "uuid",
    "diagrams": [
      {
        "id": "uuid",
        "plantumlCode": "...",
        "url": "...",
        "timestamp": "2025-01-03T12:00:00Z",
        "metadata": {}
      }
    ]
  }
  ```
- **TTL:** 24 hours auto-expiration

### Acceptance Criteria
- [ ] Store diagram after encoding
- [ ] Retrieve latest 10 diagrams
- [ ] Retrieve all diagrams by sessionId
- [ ] Auto-expire after 24h
- [ ] Max 100 diagrams per session

### Challenges
- Netlify KV limits (256KB per value)
- Session management complexity
- Cost consideration (KV pricing)

---

## Phase 3: Expansion (Deferred)

**Status:** Planned
**Priority:** Low
**Estimated Effort:** 8-10 hours

### Goals
- Add more diagram tools
- Add output formats
- Add validation tools

### New Tools

#### 1. Mermaid Encoder
```
POST /api/tools/encodeMermaid
  → Encodes Mermaid diagrams
  → URL: https://mermaid.live/edit/...
```

#### 2. PlantUML Validator
```
POST /api/tools/validatePlantUML
  → Validates PlantUML syntax
  → Returns errors/warnings
  → No URL generation
```

#### 3. Diagram Templates
```
GET /api/templates
  → List available templates

POST /api/tools/renderTemplate
  → Fill template with values
  → Returns PlantUML code
```

### New Output Formats
- PNG: `/api/tools/encodePlantUML?format=png`
- ASCII: `/api/tools/encodePlantUML?format=txt`
- Source: `/api/tools/encodePlantUML?format=src`

### Tool Discovery Update
```json
{
  "tools": [
    {
      "id": "encodePlantUML",
      "name": "encodePlantUML",
      "description": "Encodes PlantUML diagrams",
      "inputSchema": {
        "type": "object",
        "properties": {
          "plantumlCode": { "type": "string" },
          "format": {
            "type": "string",
            "enum": ["svg", "png", "txt", "src"],
            "default": "svg"
          }
        }
      }
    },
    {
      "id": "encodeMermaid",
      "name": "encodeMermaid",
      "description": "Encodes Mermaid diagrams"
    },
    {
      "id": "validatePlantUML",
      "name": "validatePlantUML",
      "description": "Validates PlantUML syntax"
    }
  ]
}
```

### Acceptance Criteria
- [ ] Mermaid encoding works
- [ ] PlantUML validation returns errors
- [ ] Template rendering works
- [ ] Multiple output formats work
- [ ] Tool discovery lists all tools

---

## Phase 4: Full MCP Server (Deferred)

**Status:** Planned
**Priority:** Low
**Estimated Effort:** 12-15 hours

### Goals
- Full Model Context Protocol compliance
- JSON-RPC 2.0 transport
- SSE (Server-Sent Events) for streaming
- Tool versioning
- Resource management

### Protocol Changes

#### Current (HTTP-only)
```
GET /api/tools
POST /api/tools/{toolName}
→ Simple HTTP REST
```

#### Full MCP (JSON-RPC 2.0)
```
POST /mcp/v2/tools/list
  { "jsonrpc": "2.0", "id": 1, "method": "tools/list" }

POST /mcp/v2/tools/call
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": { "name": "encodePlantUML", "arguments": {...} }
  }
```

### New Features

#### 1. Tool Versioning
```json
{
  "id": "encodePlantUML",
  "version": "2.1.0",
  "deprecated": false,
  "replacedBy": null
}
```

#### 2. Streaming Support
```
POST /mcp/v2/tools/call
  → Server-Sent Events (SSE)
  → Progressive encoding results
```

#### 3. Resources
```
GET /mcp/v2/resources
  → List available resources

GET /mcp/v2/resources/diagrams/{id}
  → Retrieve stored diagram
```

#### 4. Prompts
```
GET /mcp/v2/prompts
  → List available prompts

POST /mcp/v2/prompts/diagram-template
  → Generate diagram from template
```

### Migration Path
1. Keep HTTP endpoints for backward compatibility
2. Add JSON-RPC endpoints alongside
3. Phase out HTTP over time
4. Document deprecation timeline

### Acceptance Criteria
- [ ] JSON-RPC 2.0 compliant
- [ ] All tools available via MCP
- [ ] SSE streaming works
- [ ] Tool versioning implemented
- [ ] Resource management works
- [ ] Prompt system works
- [ ] Backward compatibility maintained

---

## Future Ideas (Backlog)

### Tool Ideas
- **Diagram comparison**: Show diff between two diagrams
- **Diagram merge**: Merge multiple diagrams
- **Export to PDF**: Bundle diagrams into PDF
- **Diagram animation**: Animate state transitions
- **Collaborative editing**: Real-time diagram editing

### Integration Ideas
- **GitHub integration**: Auto-diagram from code
- **VS Code extension**: In-editor diagram preview
- **Slack bot**: Generate diagrams in chat
- **Webhook notifications**: Notify on diagram changes

### Performance Ideas
- **Caching**: Cache encoded results
- **CDN caching**: Aggressive caching for static URLs
- **Pre-compression**: Serve compressed responses
- **Batch encoding**: Encode multiple diagrams in one request

### Analytics Ideas
- **Usage tracking**: Track popular diagram types
- **Error analysis**: Identify common errors
- **Performance metrics**: Track response times
- **User feedback**: Collect diagram quality feedback

---

## Timeline

### Q1 2025
- ✅ Phase 1: Core (Jan)
- Phase 2: History (Feb-Mar, if needed)

### Q2 2025
- Phase 3: Expansion (May-Jun, based on usage)

### Q3 2025
- Phase 4: Full MCP (Aug-Sep, if demand exists)

### Q4 2025
- Future ideas evaluation
- Community feedback integration
- Performance optimization

---

## Dependencies

### Phase 1 → Phase 2
- Need history tracking before adding more tools
- Netlify KV pricing evaluation

### Phase 2 → Phase 3
- History tracking enables template system
- Storage stability needed for multiple tools

### Phase 3 → Phase 4
- Tool maturity needed before MCP standard
- JSON-RPC complexity requires stable tools

---

## Resource Requirements

### Development Time
- Phase 1: ~10 hours (in progress)
- Phase 2: ~6 hours
- Phase 3: ~10 hours
- Phase 4: ~15 hours

### Infrastructure Costs
- Phase 1: Free tier
- Phase 2: Pro tier ($19/mo) for KV
- Phase 3: Pro tier ($19/mo)
- Phase 4: Enterprise tier (if high volume)

### Maintenance
- Minimal for Phase 1 (stateless)
- Medium for Phase 2 (KV management)
- Medium for Phase 3 (multiple tools)
- High for Phase 4 (protocol compliance)
