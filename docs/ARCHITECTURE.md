# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AI Agent                              │
│                   (Claude / cto Agent)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP Request
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Netlify Edge CDN                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Netlify Functions Runtime                    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  GET /api/tools  → tools-discovery.js               │    │
│  │  Returns: Tool list with schemas                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  POST /api/tools/encodePlantUML  → tools-call.js    │    │
│  │  Returns: { success, result/error }                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### 1. Tool Discovery

**Endpoint:** `GET /api/tools`

**Purpose:** Allow agents to discover available tools and their schemas

**Response:**
```json
{
  "tools": [
    {
      "id": "encodePlantUML",
      "name": "encodePlantUML",
      "description": "Encodes PlantUML diagram code into a shareable URL",
      "inputSchema": { ... }
    }
  ]
}
```

### 2. Tool Invocation

**Endpoint:** `POST /api/tools/{toolName}`

**Purpose:** Execute a specific tool with parameters

**Example:** `POST /api/tools/encodePlantUML`

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

## Data Flow

### Agent Workflow

```
1. Discovery Phase
   Agent → GET /api/tools → Tool List
         ↓
   Agent parses tool schemas
         ↓
   Agent identifies encodePlantUML

2. Generation Phase
   Agent generates PlantUML code
         ↓
   Agent: POST /api/tools/encodePlantUML
   Body: { "plantumlCode": "..." }

3. Response Phase
   API → { success: true, result: { url, encoded, format } }
         ↓
   Agent extracts URL
         ↓
   Agent: "Here's your diagram: [URL]"

4. User Interaction
   User clicks URL → plantuml.com renders diagram
         ↓
   User provides feedback
         ↓
   Agent modifies code → Repeat from step 2
```

## Deployment Model

### Netlify Functions

- **Type**: Serverless functions
- **Runtime**: Node.js 18+
- **Cold Start**: ~500ms (acceptable for this use case)
- **Warm Start**: <50ms
- **Scaling**: Automatic horizontal scaling
- **Pricing**: Free tier (125k invocations/month)

### Function Structure

```
netlify/
├── functions/
│   ├── tools-discovery.js    # GET /api/tools
│   ├── tools-call.js         # POST /api/tools/*
│   └── encode-plantuml.js    # Legacy endpoint
└── toml                       # Routing configuration
```

## State Management

### Phase 1 (Current)
- **Stateless**: No persistent storage
- **No sessions**: Each request is independent
- **No history**: Diagrams not saved
- **Advantages**: Simple, scalable, free tier compatible

### Phase 2 (Future)
- **Netlify KV**: Key-value storage
- **Session tracking**: Store latest N diagrams
- **TTL**: Auto-expiration after 24h
- **Endpoint**: `GET /api/diagrams/latest`

## Encoding Algorithm

```
PlantUML Code (UTF-8)
    ↓
zlib.deflateRaw (level 9)
    ↓
Base64 encoding
    ↓
Character mapping (base64 → plantuml alphabet)
    ↓
URL: https://www.plantuml.com/plantuml/svg/{encoded}
```

**Properties:**
- **Deterministic**: Same code → same URL
- **Lossless**: URL renders identical diagram
- **URL-safe**: Uses safe characters only

## Error Handling

### Error Response Structure

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `EMPTY_CODE` | 400 | PlantUML code is empty/whitespace |
| `CODE_TOO_LARGE` | 413 | Exceeds 50KB limit |
| `ENCODING_FAILED` | 500 | Internal encoding error |
| `TOOL_NOT_FOUND` | 404 | Unknown tool requested |
| `METHOD_NOT_ALLOWED` | 405 | Wrong HTTP method |
| `TOOL_NAME_REQUIRED` | 400 | Missing tool name in path |

## CORS Configuration

```javascript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}
```

**Rationale:** Agents run in various contexts (browser, server, embedded) and need cross-origin access.

## Scalability Notes

### Current Capacity (Netlify Free Tier)
- 125,000 invocations/month
- ~4,100/day
- ~170/hour
- Sufficient for development + light usage

### Scaling Path
1. **Pro Tier**: 400k invocations/month ($19/month)
2. **Custom functions**: Bring your own backend
3. **Multi-region**: Deploy to multiple regions

### Performance Characteristics
- **Cold start**: 300-500ms (acceptable for MCP)
- **Warm start**: 10-50ms
- **Network latency**: 50-200ms (CDN edge)
- **Total**: <600ms typical

## Security Considerations

### Current (Phase 1)
- **Input validation**: Size limit, type checking
- **CORS**: Open to all origins (acceptable for public tool)
- **No authentication**: Stateless public API
- **Rate limiting**: Not implemented (future)

### Future Enhancements
- Rate limiting per origin
- API keys for heavy users
- Content sanitization (if rendering locally)
- Input validation against PlantUML syntax

## Monitoring

### Logging
- Error logging to Netlify dashboard
- Access logs available
- No custom analytics (Phase 1)

### Metrics to Track
- Invocation count
- Error rate by code
- Response time (p50, p95)
- Tool usage frequency
