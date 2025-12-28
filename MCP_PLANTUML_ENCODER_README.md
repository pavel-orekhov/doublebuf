# MCP PlantUML Encoder Service

A Netlify Function microservice for encoding PlantUML diagrams into URLs for viewing on plantuml.com. This service acts as an MCP endpoint for the cto Planning Agent.

## Features

- **Simple URL Encoding**: Convert PlantUML code to shareable URLs
- **Stateless**: No side effects between requests
- **Deterministic**: Same code always produces the same URL
- **Validated**: Input validation with meaningful error messages
- **CORS Enabled**: Ready for cross-origin requests
- **Fast**: Sub-500ms response times

## API Endpoint

### POST /mcp/v1/encode-plantuml

Encodes PlantUML code into a URL for plantuml.com.

#### Request

```json
{
  "plantumlCode": "@startuml\nactor Writer1\nrectangle \"Front Buffer\"\nWriter1 --> \"Front Buffer\"\n@enduml"
}
```

#### Success Response (200 OK)

```json
{
  "status": "success",
  "url": "https://www.plantuml.com/plantuml/svg/SoWkIImgAStDuNBAJrBGjLDmpCbCJbMmKiX8pSd9vt98pKi1IW80",
  "encoded": "SoWkIImgAStDuNBAJrBGjLDmpCbCJbMmKiX8pSd9vt98pKi1IW80",
  "format": "svg"
}
```

#### Error Responses

**400 Bad Request** - Empty or invalid code:
```json
{
  "status": "error",
  "code": "EMPTY_CODE",
  "message": "plantumlCode is required and cannot be empty"
}
```

**413 Payload Too Large** - Code exceeds 50KB:
```json
{
  "status": "error",
  "code": "CODE_TOO_LARGE",
  "message": "PlantUML code exceeds maximum size of 50KB"
}
```

**500 Internal Server Error** - Encoding failed:
```json
{
  "status": "error",
  "code": "ENCODING_FAILED",
  "message": "Failed to encode PlantUML code"
}
```

## Usage Examples

### cURL

```bash
curl -X POST https://webodar.netlify.app/mcp/v1/encode-plantuml \
  -H "Content-Type: application/json" \
  -d '{
    "plantumlCode": "@startuml\nactor A\nrectangle B\nA --> B\n@enduml"
  }'
```

### JavaScript (MCP Client)

```javascript
async function encodePlantUML(code) {
  const response = await fetch('https://webodar.netlify.app/mcp/v1/encode-plantuml', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plantumlCode: code })
  });
  
  const data = await response.json();
  if (data.status === 'success') {
    console.log('Diagram URL:', data.url);
    return data.url;
  } else {
    console.error('Error:', data.message);
    throw new Error(data.message);
  }
}

// Usage
const plantumlCode = `@startuml
actor Writer1
actor Writer2
rectangle "Front Buffer" as Front
Writer1 --> Front
Writer2 --> Front
@enduml`;

const url = await encodePlantUML(plantumlCode);
```

### Python

```python
import requests
import json

def encode_plantuml(code):
    response = requests.post(
        'https://webodar.netlify.app/mcp/v1/encode-plantuml',
        headers={'Content-Type': 'application/json'},
        json={'plantumlCode': code}
    )
    data = response.json()
    
    if data['status'] == 'success':
        print('Diagram URL:', data['url'])
        return data['url']
    else:
        print('Error:', data['message'])
        raise Exception(data['message'])

# Usage
plantuml_code = """
@startuml
[*] --> Writing
Writing --> Swapping: CAS
Swapping --> Reading
Reading --> [*]
@enduml
"""

url = encode_plantuml(plantuml_code)
```

## Test Examples

### Example 1: Lock-Free Double Buffer Diagram

**Input:**
```
@startuml
actor Writer1
actor Writer2
actor WriterN
rectangle "Front Buffer" as Front
rectangle "Back Buffer" as Back
rectangle "CAS Swap" as Swap
actor Reader

Writer1 --> Front
Writer2 --> Front
WriterN --> Front
Front --> Swap
Swap --> Back
Back --> Reader
@enduml
```

**Output URL:**
```
https://www.plantuml.com/plantuml/svg/SoWkIImgAStDuNBAJrBGjLDmpCbCJbMmKiX8pSd9vt98pKi1IW80
```

### Example 2: Simple State Machine

**Input:**
```
@startuml
[*] --> Writing
Writing --> Swapping: CAS
Swapping --> Reading
Reading --> [*]
@enduml
```

**Output URL:**
```
https://www.plantuml.com/plantuml/svg/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000
```

## Running Tests

```bash
# Run all tests
npm test

# Or run directly with Node
node test/encode-plantuml.test.js
```

Test coverage includes:
- Valid PlantUML diagram encoding
- Empty code validation
- Null/undefined code handling
- Whitespace-only code validation
- Size limit validation (50KB)
- Boundary cases (exactly 50KB)
- Deterministic encoding
- CORS headers
- HTTP method validation

## Deployment to Netlify

### Prerequisites

- Netlify account
- Netlify CLI installed: `npm install -g netlify-cli`

### Deploy

```bash
# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

The service will be available at:
- `https://your-site.netlify.app/mcp/v1/encode-plantuml`

## Project Structure

```
.
├── netlify/
│   ├── functions/
│   │   └── encode-plantuml.js    # Main function handler
│   └── toml                       # Netlify configuration
├── test/
│   └── encode-plantuml.test.js    # Test suite
├── package.json                   # Node.js dependencies
└── MCP_PLANTUML_ENCODER_README.md # This file
```

## Configuration

The service is configured via `netlify.toml`:

```toml
[functions]
  node_bundler = "esbuild"
  
[[redirects]]
  from = "/mcp/v1/encode-plantuml"
  to = "/.netlify/functions/encode-plantuml"
  status = 200
  force = true
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `EMPTY_CODE` | 400 | PlantUML code is empty, null, or whitespace-only |
| `CODE_TOO_LARGE` | 413 | Code exceeds 50KB size limit |
| `ENCODING_FAILED` | 500 | Internal error during encoding |
| `METHOD_NOT_ALLOWED` | 405 | Non-POST method used |

## Invariants

1. Empty or null `plantumlCode` → Error, no encoding attempted
2. `plantumlCode` > 50KB → Error 413, fail fast
3. URL always has format: `https://www.plantuml.com/plantuml/svg/{encoded}`
4. On success → URL is non-empty and valid
5. On error → `status="error"` and `code` is present
6. Service is stateless → no side effects between requests
7. Same code → same URL (deterministic)

## Future Enhancements (Scenario 2)

Currently not implemented, planned for future:

- `/mcp/v1/render-plantuml` - Render diagrams as PNG
- `/mcp/v1/diagrams/latest` - Retrieve latest diagram from session
- Session history tracking
- Browser-based UI for diagram viewing

## Technical Details

- **Runtime**: Node.js (Netlify Functions)
- **Algorithm**: Base64 encoding with URL-safe character mapping
- **Format**: SVG (default, scalable)
- **Compression**: None (encoding only, simpler and sufficient)
- **CORS**: Enabled for all origins
- **Rate Limiting**: Not implemented (future enhancement)

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
