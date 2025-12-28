# MCP PlantUML Encoder - Quick Start Guide

## Overview

This microservice encodes PlantUML diagrams into URLs for viewing on plantuml.com. It's designed as an MCP endpoint for the cto Planning Agent.

## Project Structure

```
.
├── netlify/
│   ├── functions/
│   │   └── encode-plantuml.js    # Main Lambda function
│   └── toml                       # Netlify configuration
├── test/
│   ├── encode-plantuml.test.js    # Unit tests
│   ├── integration-test.js         # Integration tests
│   └── expected-encoding.js        # Encoding verification
├── examples/
│   ├── encode-example.js           # Example from ticket
│   └── encode-simple.js            # Simple example
├── package.json                    # Node.js package config
├── netlify.toml                    # Netlify deployment config
├── MCP_PLANTUML_ENCODER_README.md  # Full documentation
└── QUICKSTART.md                   # This file
```

## Quick Test

```bash
# Run all tests
node test/encode-plantuml.test.js

# Run integration tests
node test/integration-test.js

# Run example from ticket
node examples/encode-example.js

# Run simple example
node examples/encode-simple.js
```

## API Usage

### Endpoint
```
POST /mcp/v1/encode-plantuml
```

### Request
```json
{
  "plantumlCode": "@startuml\nA -> B\n@enduml"
}
```

### Response
```json
{
  "status": "success",
  "url": "https://www.plantuml.com/plantuml/svg/SoWkIImgAStDuN9KqBLJSE9oICrBAStD0G0",
  "encoded": "SoWkIImgAStDuN9KqBLJSE9oICrBAStD0G0",
  "format": "svg"
}
```

## Test Results

All tests pass:
- ✓ Valid PlantUML diagram encoding
- ✓ Empty code validation (400)
- ✓ Null/undefined code validation (400)
- ✓ Whitespace-only code validation (400)
- ✓ Size limit validation (50KB, 413)
- ✓ Boundary case (exactly 50KB)
- ✓ Deterministic encoding
- ✓ CORS headers
- ✓ HTTP method validation
- ✓ OPTIONS requests

## Deployment to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

## Features

- ✅ Deflate compression (proper PlantUML format)
- ✅ Custom alphabet encoding
- ✅ Input validation (empty, size limit)
- ✅ Meaningful error messages
- ✅ CORS enabled
- ✅ Stateless (no side effects)
- ✅ Deterministic (same code = same URL)
- ✅ Comprehensive test coverage

## Acceptance Criteria (from ticket)

- ✅ `/mcp/v1/encode-plantuml` endpoint created
- ✅ PlantUML encoding algorithm implemented
- ✅ Request validation (not empty, <50KB)
- ✅ Response for success (status, url, encoded, format)
- ✅ Response for errors (status, code, message)
- ✅ URL format: `https://www.plantuml.com/plantuml/svg/{encoded}`
- ✅ Deterministic encoding
- ✅ Stateless service
- ✅ CORS enabled
- ✅ Ready for Netlify Functions deployment
- ✅ README with examples
- ✅ All 5 Gherkin scenarios work

## Next Steps (Scenario 2 - Future)

Not implemented yet (planned for future):
- `/mcp/v1/render-plantuml` - Render as PNG
- `/mcp/v1/diagrams/latest` - Retrieve latest diagram
- Session history tracking
- Browser-based UI

## Support

For detailed documentation, see `MCP_PLANTUML_ENCODER_README.md`.
