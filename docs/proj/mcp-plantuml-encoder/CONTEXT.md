# Context for Agents

## What is this?

This is an HTTP MCP-compatible API for encoding PlantUML diagrams into shareable URLs. It's deployed on Netlify Functions as a stateless microservice.

## Why does this exist?

To enable AI agents (Claude, cto Planning Agent, others) to:
1. Generate PlantUML diagram code during conversations
2. Encode the code into a shareable URL
3. Show the diagram to users instantly
4. Iterate on designs with visual feedback

Without this service, users would have to manually copy-paste code to plantuml.com, breaking the conversational flow.

## Specific Use Case: doublebuf Project

The primary use case is planning the lock-free double buffer architecture:
- **FSM diagrams**: State transitions (Created → Writing → Swapping → Reading)
- **Sequence diagrams**: Writer/Reader interactions
- **Component diagrams**: Buffer structure and CAS swapping
- **Collaboration**: Discuss architecture visually in pull requests

Example diagram:
```
@startuml
[*] --> Created
Created --> Writing: producer writes
Writing --> Swapping: reached swap point
Swapping --> Reading: CAS success
Reading --> Created: reader done
@enduml
```

## How to Use This as a Tool

### Step 1: Discover Available Tools

```bash
GET /api/tools
```

Response:
```json
{
  "tools": [
    {
      "id": "encodePlantUML",
      "name": "encodePlantUML",
      "description": "Encodes PlantUML diagram code into a shareable URL",
      "inputSchema": {
        "type": "object",
        "properties": {
          "plantumlCode": {
            "type": "string",
            "description": "Valid PlantUML diagram code"
          }
        },
        "required": ["plantumlCode"]
      }
    }
  ]
}
```

### Step 2: Generate PlantUML Code

As an agent, generate PlantUML code based on the conversation:

```
@startuml
participant Writer
participant FrontBuffer
participant CASSwap
participant BackBuffer
participant Reader

Writer ->> FrontBuffer: write(data)
FrontBuffer ->> CASSwap: ready
CASSwap ->> BackBuffer: swap
Reader ->> BackBuffer: read()
@enduml
```

### Step 3: Encode the Diagram

```bash
POST /api/tools/encodePlantUML
Content-Type: application/json

{
  "plantumlCode": "@startuml\nparticipant Writer\n..."
}
```

Response:
```json
{
  "success": true,
  "result": {
    "url": "https://www.plantuml.com/plantuml/svg/SoWkIImgAStDuNBAJrBGjLDmpCbCJbMmKiX8pSd9vt98pKi1IW80",
    "encoded": "SoWkIImgAStDuNBAJrBGjLDmpCbCJbMmKiX8pSd9vt98pKi1IW80",
    "format": "svg"
  }
}
```

### Step 4: Show URL to User

```
"Here's the sequence diagram for the lock-free buffer:
https://www.plantuml.com/plantuml/svg/SoWkIImgAStDuNBAJrBGjLDmpCbCJbMmKiX8pSd9vt98pKi1IW80

The diagram shows how writers interact with the front buffer,
then the CAS swap mechanism exchanges front/back buffers,
and finally readers consume data from the back buffer."
```

### Step 5: Iterate

User clicks URL → views diagram → provides feedback → agent modifies code → repeat from Step 2.

## Key Concepts

### MCP Compatibility

This service is **MCP-compatible** (Model Context Protocol):
- ✅ Tool discovery endpoint (`GET /api/tools`)
- ✅ Tool invocation endpoint (`POST /api/tools/{toolName}`)
- ✅ Tool schema in discovery
- ✅ Predictable responses
- ✅ Error handling
- ✅ Stateless design
- ❌ NOT JSON-RPC 2.0 (uses HTTP instead)

**Result:** Works with Claude, cto agents, and any HTTP-based AI client.

### HTTP vs JSON-RPC

We chose HTTP over JSON-RPC because:
- Simpler to deploy on Netlify
- Web-standard (CORS-friendly)
- Lower overhead (no wrapper needed)
- Faster implementation

### Stateless Design

No data is stored between requests:
- Each request is independent
- No session tracking (Phase 1)
- No history (Phase 1)
- Advantage: Scales horizontally

### Deterministic Encoding

Same PlantUML code → Same URL:
- Uses standard compression algorithm
- Character mapping is deterministic
- Enables caching and reproducibility

## Error Handling

Agents should handle these errors:

### Empty Code (400)
```json
{
  "success": false,
  "error": {
    "code": "EMPTY_CODE",
    "message": "plantumlCode is required and cannot be empty"
  }
}
```

**Action:** Tell user they need to provide diagram code, or generate it yourself.

### Code Too Large (413)
```json
{
  "success": false,
  "error": {
    "code": "CODE_TOO_LARGE",
    "message": "PlantUML code exceeds maximum size of 50KB"
  }
}
```

**Action:** Break into smaller diagrams or simplify.

### Encoding Failed (500)
```json
{
  "success": false,
  "error": {
    "code": "ENCODING_FAILED",
    "message": "Failed to encode PlantUML code"
  }
}
```

**Action:** Retry or use a simpler diagram.

## Architecture Decisions

### Why HTTP (not JSON-RPC)?

See [DECISIONS.log](./DECISIONS.log#decision-1-http-vs-json-rpc-20):
- Simpler deployment
- Web-standard
- CORS-friendly
- Faster to implement

### Why Stateless?

See [DECISIONS.log](./DECISIONS.log#decision-2-stateless-api-no-storage-in-phase-1):
- Simpler implementation
- Free tier compatible
- Better performance
- Clearer scope

### Why Single Tool?

See [DECISIONS.log](./DECISIONS.log#decision-5-single-tool-in-phase-1-encodeplantuml):
- Focus on core functionality
- Faster delivery
- Prove concept
- Primary use case

## Future Extensions

### Phase 2: History Tracking

Will add endpoints to retrieve diagram history:
- `GET /api/diagrams/latest` → Last N diagrams
- `GET /api/diagrams/{sessionId}` → All diagrams for session
- Storage: Netlify KV

### Phase 3: More Tools

Will add more diagram tools:
- `encodeMermaid` → Mermaid diagrams
- `validatePlantUML` → Syntax validation
- `renderTemplate` → Fill templates

### Phase 4: Full MCP

Will add full MCP compliance:
- JSON-RPC 2.0 transport
- SSE streaming
- Resource management
- Prompt system

See [ROADMAP.md](../../ROADMAP.md) for details.

## Working with This Project

### For cto Planning Agent

When discussing architecture:
1. Identify need for diagram
2. Generate PlantUML code
3. Call `POST /api/tools/encodePlantUML`
4. Show URL to user
5. Get feedback
6. Iterate

### For Claude

When user asks for a diagram:
1. Generate PlantUML code
2. Encode using this service
3. Provide URL
4. Explain the diagram

### For Other Agents

1. Call `GET /api/tools` to discover available tools
2. Parse tool schemas
3. Call tools with appropriate parameters
4. Handle errors gracefully
5. Show results to users

## Quick Reference

### Base URL
```
https://webodar.netlify.app/api
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tools` | Discover tools |
| POST | `/api/tools/encodePlantUML` | Encode diagram |

### Request Example

```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{
    "plantumlCode": "@startuml\nA --> B\n@enduml"
  }'
```

### Response (Success)

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

### Response (Error)

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

## Common Issues

### Issue: CORS errors
**Solution:** Ensure `Access-Control-Allow-Origin: *` header is present (it is).

### Issue: Slow response times
**Solution:** First request may be slow (cold start ~300-500ms), subsequent requests are fast (<50ms).

### Issue: URL doesn't render
**Solution:** Verify PlantUML syntax is correct. Check the URL format: `https://www.plantuml.com/plantuml/svg/{encoded}`.

### Issue: Code too large
**Solution:** Simplify diagram or break into multiple diagrams. Max 50KB.

## Questions?

- **Architecture**: See [ARCHITECTURE.md](../../ARCHITECTURE.md)
- **Technical Spec**: See [SPEC.md](./SPEC.md)
- **Decisions**: See [DECISIONS.log](./DECISIONS.log)
- **Roadmap**: See [ROADMAP.md](../../ROADMAP.md)
- **Glossary**: See [GLOSSARY.md](./GLOSSARY.md)
