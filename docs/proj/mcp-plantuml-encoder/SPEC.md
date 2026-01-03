# Technical Specification

## Overview

This document provides the complete technical specification for the HTTP MCP-compatible PlantUML Encoder service.

## System Context

The service is a stateless HTTP API that encodes PlantUML diagram code into URLs for viewing on plantuml.com. It provides tool discovery and invocation endpoints compatible with the Model Context Protocol (MCP) semantics.

## API Specification

### Base URL
```
https://webodar.netlify.app/api
```

### Authentication
None required (public API in Phase 1).

---

## Endpoint 1: Tool Discovery

### GET /api/tools

Discovers available tools and their schemas.

#### Request
```
GET /api/tools
Accept: application/json
```

#### Response (200 OK)
```json
{
  "tools": [
    {
      "id": "encodePlantUML",
      "name": "encodePlantUML",
      "description": "Encodes PlantUML diagram code into a shareable URL for viewing on plantuml.com",
      "inputSchema": {
        "type": "object",
        "properties": {
          "plantumlCode": {
            "type": "string",
            "description": "Valid PlantUML diagram code (must start with @startuml and end with @enduml)"
          }
        },
        "required": ["plantumlCode"]
      }
    }
  ]
}
```

#### Response (405 Method Not Allowed)
```json
{
  "success": false,
  "error": {
    "code": "METHOD_NOT_ALLOWED",
    "message": "Only GET method is allowed"
  }
}
```

#### Headers
```
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: GET, OPTIONS
```

---

## Endpoint 2: Tool Invocation

### POST /api/tools/{toolName}

Invokes a specific tool with parameters.

### POST /api/tools/encodePlantUML

Encodes PlantUML code into a URL.

#### Request
```
POST /api/tools/encodePlantUML
Content-Type: application/json

{
  "plantumlCode": "@startuml\nactor Writer1\nrectangle \"Front Buffer\"\nWriter1 --> \"Front Buffer\"\n@enduml"
}
```

#### Response (200 OK - Success)
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

#### Response (400 Bad Request - Empty Code)
```json
{
  "success": false,
  "error": {
    "code": "EMPTY_CODE",
    "message": "plantumlCode is required and cannot be empty"
  }
}
```

#### Response (413 Payload Too Large)
```json
{
  "success": false,
  "error": {
    "code": "CODE_TOO_LARGE",
    "message": "PlantUML code exceeds maximum size of 50KB"
  }
}
```

#### Response (500 Internal Server Error)
```json
{
  "success": false,
  "error": {
    "code": "ENCODING_FAILED",
    "message": "Failed to encode PlantUML code"
  }
}
```

#### Response (404 Not Found - Unknown Tool)
```json
{
  "success": false,
  "error": {
    "code": "TOOL_NOT_FOUND",
    "message": "Tool 'unknownTool' not found"
  }
}
```

#### Headers
```
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: POST, OPTIONS
```

---

## Data Models

### Tool Discovery Response

```typescript
interface Tool {
  id: string;
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required: string[];
  };
}

interface ToolsResponse {
  tools: Tool[];
}
```

### Tool Call Request (encodePlantUML)

```typescript
interface EncodePlantUMLRequest {
  plantumlCode: string;
}
```

### Tool Call Success Response

```typescript
interface SuccessResponse {
  success: true;
  result: {
    url: string;           // https://www.plantuml.com/plantuml/svg/{encoded}
    encoded: string;       // PlantUML encoded string
    format: 'svg';         // Output format
  };
}
```

### Tool Call Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;          // Error code
    message: string;       // Human-readable description
  };
}
```

---

## Encoding Algorithm

### Algorithm Steps

1. **Input**: PlantUML code as UTF-8 string
2. **Compress**: `zlib.deflateRaw(code, { level: 9 })`
3. **Encode Base64**: `deflated.toString('base64')`
4. **Map Characters**: Replace Base64 chars with PlantUML alphabet
5. **Output**: Encoded string for URL

### Character Mapping

```
Base64:     ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/
PlantUML:   0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_
```

### Example

```javascript
const plantumlCode = "@startuml\nactor A\nactor B\nA --> B\n@enduml";

// Step 1: UTF-8 bytes
Buffer.from(plantumlCode, 'utf8')
// → [64, 115, 116, 97, 114, 116, 117, 109, 108, 10, ...]

// Step 2: Deflate
zlib.deflateRawSync(bytes, { level: 9 })
// → [120, 156, 75, 203, 72, 45, 73, 46, 1, 0, ...]

// Step 3: Base64
deflated.toString('base64')
// → "eJxLLSMuSS4BAC5BBzA="

// Step 4: Character mapping
"eJxLLSMuSS4BAC5BBzA="
// → "fJy0iLkkuAA1AQc0"

// Step 5: URL
"https://www.plantuml.com/plantuml/svg/fJy0iLkkuAA1AQc0"
```

### Properties

- **Deterministic**: Same input → Same output
- **Lossless**: URL renders identical diagram
- **URL-safe**: Uses `-`, `_`, digits, letters only
- **Efficient**: Compression reduces size by 60-80%

---

## Error Codes

| Code | Status | Description | HTTP Status |
|------|--------|-------------|-------------|
| `EMPTY_CODE` | Error | PlantUML code is empty, null, or whitespace-only | 400 |
| `CODE_TOO_LARGE` | Error | Code exceeds 50KB size limit | 413 |
| `ENCODING_FAILED` | Error | Internal error during encoding | 500 |
| `TOOL_NOT_FOUND` | Error | Requested tool does not exist | 404 |
| `METHOD_NOT_ALLOWED` | Error | Wrong HTTP method used | 405 |
| `TOOL_NAME_REQUIRED` | Error | Tool name missing from path | 400 |
| `INTERNAL_ERROR` | Error | Unexpected server error | 500 |

---

## Validation Rules

### Input Validation

| Rule | Condition | Error |
|------|-----------|-------|
| Required | `plantumlCode` present | 400 EMPTY_CODE |
| Type | `plantumlCode` is string | 400 EMPTY_CODE |
| Non-empty | `plantumlCode.trim() !== ''` | 400 EMPTY_CODE |
| Size limit | `byteLength <= 50KB` | 413 CODE_TOO_LARGE |
| UTF-8 valid | Valid UTF-8 encoding | 500 ENCODING_FAILED |

### Output Validation

| Rule | Condition | Check |
|------|-----------|-------|
| URL format | URL matches pattern | `https://www.plantuml.com/plantuml/svg/{encoded}` |
| Non-empty | `url.length > 0` | URL is not empty string |
| Valid chars | URL-safe characters only | `[0-9A-Za-z\-_/]` |
| Deterministic | Same input → same output | Test with known examples |

---

## Invariants

1. **GET /api/tools always succeeds**: Returns tool list (even if empty)
2. **Tool schema completeness**: Each tool has `id`, `name`, `description`, `inputSchema`
3. **Success/exclusivity**: `success: true` ↔ `result` present
4. **Error/exclusivity**: `success: false` ↔ `error` present (never both)
5. **URL format**: Always `https://www.plantuml.com/plantuml/svg/{encoded}`
6. **Determinism**: Same `plantumlCode` → Same URL
7. **Stateless**: No side effects between requests
8. **CORS enabled**: `Access-Control-Allow-Origin: *`
9. **Error codes**: All errors include `error.code`
10. **Parseability**: Agent can always parse response as JSON

---

## CORS Configuration

### Headers

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

### Preflight Handling

```
OPTIONS /api/tools
→ 200 OK (with CORS headers)

OPTIONS /api/tools/encodePlantUML
→ 200 OK (with CORS headers)
```

---

## Performance Requirements

### Response Time Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| P50 (warm) | <100ms | Median response time |
| P95 (cold) | <500ms | 95th percentile (includes cold start) |
| P99 (warm) | <200ms | 99th percentile (warm) |

### Resource Limits

| Resource | Limit | Rationale |
|----------|-------|-----------|
| Request size | 50KB | PlantUML code input |
| Response size | ~1KB | JSON response |
| Execution time | 10s | Netlify limit (actual: <500ms) |
| Memory | 1GB | Netlify limit (actual: ~50MB) |

---

## Security Considerations

### Phase 1 (Current)

- **Input validation**: Size limit, type checking
- **CORS**: Open to all origins (acceptable for public tool)
- **No authentication**: Stateless public API
- **No rate limiting**: Future enhancement

### Threat Model

| Threat | Likelihood | Mitigation |
|--------|------------|------------|
| DoS via large payloads | Low | 50KB size limit |
| Injection attacks | Low | No code execution, just encoding |
| XSS via PlantUML | Low | We generate URLs only, plantuml.com renders |

### Future Enhancements

- Rate limiting per origin
- Input sanitization (if rendering locally)
- API keys for heavy users
- Content Security Policy headers

---

## Deployment Configuration

### Netlify.toml

```toml
[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/tools"
  to = "/.netlify/functions/tools-discovery"
  status = 200
  force = true

[[redirects]]
  from = "/api/tools/*"
  to = "/.netlify/functions/tools-call"
  status = 200
  force = true
```

### Function Structure

```
netlify/
├── functions/
│   ├── tools-discovery.js    # GET /api/tools
│   ├── tools-call.js         # POST /api/tools/*
│   └── encode-plantuml.js    # Legacy endpoint
```

### Environment Variables

None required for Phase 1.

---

## Testing Strategy

### Manual Testing

```bash
# Test tool discovery
curl https://webodar.netlify.app/api/tools

# Test valid encoding
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":"@startuml\nA --> B\n@enduml"}'

# Test empty code
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":""}'

# Test oversized code (create 51KB string)
dd if=/dev/zero bs=1024 count=51 | tr '\0' 'A' | tr -d '\n' > large.txt
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d "{\"plantumlCode\":\"$(cat large.txt)\"}"
```

### Test Cases

See [tests/TEST_PLAN.md](./tests/TEST_PLAN.md) for complete test scenarios.

---

## Monitoring

### Logging

```javascript
console.log('Tool discovery called', { timestamp, userAgent });
console.error('Encoding error', { error, stack });
```

### Metrics to Track

- Invocation count (by endpoint)
- Error rate (by code)
- Response time (p50, p95, p99)
- Tool usage frequency

---

## Dependencies

### Runtime

- **Node.js**: 18+ (Netlify runtime)
- **zlib**: Built-in compression library

### External

- **PlantUML.com**: Diagram rendering (no API key)
- **Netlify**: Hosting platform (free tier)

---

## Versioning

### API Version

Current: `v1`
Path: `/api/v1/tools` (not used in Phase 1, reserved for future)

### Compatibility

- **Breaking changes**: Require URL version bump
- **Non-breaking additions**: Keep existing endpoints
- **Deprecation**: Document for 6 months before removal

---

## References

- [PlantUML Encoding](https://plantuml.com/en/code-javascript-sql)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
