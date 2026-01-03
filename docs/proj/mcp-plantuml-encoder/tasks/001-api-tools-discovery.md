# Task 001: Tool Discovery Endpoint

**Status:** ✅ Complete
**Effort:** ~2 hours
**Priority:** Critical
**Dependencies:** None

---

## Objective

Implement `GET /api/tools` endpoint to allow agents to discover available tools and their schemas.

---

## Requirements

### Functional Requirements
1. Endpoint returns `200 OK` on successful GET request
2. Response contains `tools` array
3. Each tool has `id`, `name`, `description`, `inputSchema`
4. `inputSchema` uses JSON Schema-like format
5. Tool schema includes `type`, `properties`, `required` fields

### Non-Functional Requirements
1. CORS headers enabled for cross-origin requests
2. Handle `OPTIONS` preflight requests
3. Return `405 Method Not Allowed` for non-GET requests
4. Response time <500ms (cold start)
5. Response size <1KB

### Data Requirements
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

---

## Implementation Details

### File Structure
```
netlify/functions/tools-discovery.js
```

### Function Handler
```javascript
exports.handler = async (event, context) => {
  // Implementation
};
```

### HTTP Methods
- **GET**: Returns tool list
- **OPTIONS**: Returns CORS headers (preflight)
- **Others**: Returns 405

### CORS Headers
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};
```

---

## Testing Plan

### Manual Testing

#### Test 1: Successful Tool Discovery
```bash
curl -X GET https://webodar.netlify.app/api/tools \
  -H "Accept: application/json"
```

**Expected Result:**
- Status: 200 OK
- Body: JSON with `tools` array
- `encodePlantUML` tool present
- Schema includes `plantumlCode` parameter

#### Test 2: OPTIONS Preflight
```bash
curl -X OPTIONS https://webodar.netlify.app/api/tools \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: GET"
```

**Expected Result:**
- Status: 200 OK
- CORS headers present
- Body: Empty

#### Test 3: Invalid Method
```bash
curl -X POST https://webodar.netlify.app/api/tools \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Result:**
- Status: 405 Method Not Allowed
- Body: JSON with error

---

## Acceptance Criteria

- [x] Endpoint accessible at `GET /api/tools`
- [x] Returns 200 OK on successful request
- [x] Response contains `tools` array
- [x] `encodePlantUML` tool is listed
- [x] Tool has `id`, `name`, `description`, `inputSchema`
- [x] `inputSchema` includes `plantumlCode` property
- [x] `required` array contains `"plantumlCode"`
- [x] CORS headers are present
- [x] OPTIONS request returns 200 OK
- [x] Non-GET requests return 405
- [x] Response is valid JSON
- [x] Response time <500ms

---

## Implementation Notes

### Tool Schema Format
Using JSON Schema-like format (simplified for Phase 1):
- `type`: Always "object" for tool parameters
- `properties`: Object defining each parameter
- `required`: Array of required parameter names

### Extensibility
Future tools can be added by extending the `tools` array:
```javascript
const tools = [
  {
    id: 'encodePlantUML',
    // ...
  },
  {
    id: 'encodeMermaid',  // Future
    // ...
  }
];
```

### Error Handling
- Always returns JSON (even on error)
- Consistent error format: `{ success: false, error: { code, message } }`
- Never throws unhandled exceptions

---

## Dependencies

### External
- Netlify Functions runtime
- None (no external dependencies)

### Internal
- None (independent endpoint)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CORS issues | Low | Medium | Test from multiple origins |
| Response time | Low | Low | Keep logic simple, minimal computation |
| Schema changes | Medium | High | Document clearly, use versioning |

---

## Success Metrics

- Endpoint uptime: 100%
- Response time (p95): <500ms
- Error rate: 0% (endpoint is read-only)
- Integration success: Works with Claude/cto agents

---

## Known Issues

None

---

## Future Enhancements

### Phase 3
- Add more tools to discovery (Mermaid, validation)
- Add tool versioning
- Add tool deprecation notices
- Add tool categories/tags

### Phase 4
- Full MCP schema compliance
- Tool examples and samples
- Tool usage statistics
- Rate limiting per tool

---

## References

- [SPEC.md - Tool Discovery](../SPEC.md#endpoint-1-tool-discovery)
- [ARCHITECTURE.md - Tool Discovery](../../../ARCHITECTURE.md#tool-discovery)
- [GLOSSARY.md - Tool Discovery](../GLOSSARY.md#tool-discovery)

---

**Last Updated:** 2025-01-03
**Status:** Complete ✅
