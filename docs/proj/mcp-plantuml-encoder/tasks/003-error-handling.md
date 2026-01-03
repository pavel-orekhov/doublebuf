# Task 003: Error Handling

**Status:** ✅ Complete
**Effort:** ~1 hour
**Priority:** High
**Dependencies:** Task 002

---

## Objective

Implement comprehensive error handling for all edge cases with clear, actionable error codes.

---

## Requirements

### Functional Requirements
1. Validate all input before processing
2. Return appropriate HTTP status codes
3. Provide clear error codes and messages
4. Handle all edge cases gracefully
5. Never throw unhandled exceptions

### Error Cases

| Error Code | Status | Description |
|------------|--------|-------------|
| `EMPTY_CODE` | 400 | PlantUML code is empty, null, or whitespace-only |
| `CODE_TOO_LARGE` | 413 | Code exceeds 50KB size limit |
| `ENCODING_FAILED` | 500 | Internal error during encoding |
| `TOOL_NOT_FOUND` | 404 | Requested tool does not exist |
| `METHOD_NOT_ALLOWED` | 405 | Wrong HTTP method used |
| `TOOL_NAME_REQUIRED` | 400 | Tool name missing from path |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

---

## Implementation Details

### Validation Function
```javascript
function validatePlantUMLCode(plantumlCode) {
  if (!plantumlCode || typeof plantumlCode !== 'string') {
    return {
      valid: false,
      code: 'EMPTY_CODE',
      message: 'plantumlCode is required and cannot be empty'
    };
  }

  const trimmed = plantumlCode.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      code: 'EMPTY_CODE',
      message: 'plantumlCode is required and cannot be empty'
    };
  }

  const maxSize = 50 * 1024;
  if (Buffer.byteLength(plantumlCode, 'utf8') > maxSize) {
    return {
      valid: false,
      code: 'CODE_TOO_LARGE',
      message: 'PlantUML code exceeds maximum size of 50KB'
    };
  }

  return { valid: true };
}
```

### Validation Rules

| Rule | Condition | Error Code | Status |
|------|-----------|------------|--------|
| Required | `plantumlCode` present | EMPTY_CODE | 400 |
| Type | `plantumlCode` is string | EMPTY_CODE | 400 |
| Non-empty | `plantumlCode.trim() !== ''` | EMPTY_CODE | 400 |
| Size limit | `byteLength <= 50KB` | CODE_TOO_LARGE | 413 |
| UTF-8 valid | Valid UTF-8 encoding | ENCODING_FAILED | 500 |

### Error Handler
```javascript
try {
  const validation = validatePlantUMLCode(plantumlCode);
  if (!validation.valid) {
    const statusCode = validation.code === 'CODE_TOO_LARGE' ? 413 : 400;
    return {
      statusCode,
      body: {
        success: false,
        error: {
          code: validation.code,
          message: validation.message
        }
      };
    }

    // Encoding logic here...

  } catch (error) {
    console.error('Encoding error:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: {
          code: 'ENCODING_FAILED',
          message: 'Failed to encode PlantUML code'
        }
      }
    };
  }
}
```

### Method Validation
```javascript
if (event.httpMethod === 'OPTIONS') {
  return { statusCode: 200, headers, body: '' };
}

if (event.httpMethod !== 'POST') {
  return {
    statusCode: 405,
    body: {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed'
      }
    }
  };
}
```

---

## Testing Plan

### Manual Testing

#### Test 1: Empty String
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode": ""}'
```

**Expected Result:**
- Status: 400 Bad Request
- `success: false`
- `error.code: "EMPTY_CODE"`
- `error.message: "plantumlCode is required and cannot be empty"`

#### Test 2: Null Value
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode": null}'
```

**Expected Result:**
- Status: 400 Bad Request
- `error.code: "EMPTY_CODE"`

#### Test 3: Whitespace Only
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode": "   \n\n\t   "}'
```

**Expected Result:**
- Status: 400 Bad Request
- `error.code: "EMPTY_CODE"`

#### Test 4: Exactly 50KB
```bash
# Create 50KB file (51200 bytes)
dd if=/dev/zero bs=1024 count=50 | tr '\0' 'A' | tr -d '\n' > 50kb.txt
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d "{\"plantumlCode\":\"$(cat 50kb.txt)\"}"
```

**Expected Result:**
- Status: 200 OK (should work)
- `success: true`

#### Test 5: Over 50KB (51KB)
```bash
# Create 51KB file (52224 bytes)
dd if=/dev/zero bs=1024 count=51 | tr '\0' 'A' | tr -d '\n' > 51kb.txt
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d "{\"plantumlCode\":\"$(cat 51kb.txt)\"}"
```

**Expected Result:**
- Status: 413 Payload Too Large
- `error.code: "CODE_TOO_LARGE"`
- `error.message: "PlantUML code exceeds maximum size of 50KB"`

#### Test 6: Invalid JSON
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

**Expected Result:**
- Status: 500 Internal Server Error
- `error.code: "INTERNAL_ERROR"`

#### Test 7: Missing Tool Name
```bash
curl -X POST https://webodar.netlify.app/api/tools \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Result:**
- Status: 400 Bad Request
- `error.code: "TOOL_NAME_REQUIRED"`

#### Test 8: Unknown Tool
```bash
curl -X POST https://webodar.netlify.app/api/tools/unknownTool \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Result:**
- Status: 404 Not Found
- `error.code: "TOOL_NOT_FOUND"`

#### Test 9: Wrong Method
```bash
curl -X GET https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json"
```

**Expected Result:**
- Status: 405 Method Not Allowed
- `error.code: "METHOD_NOT_ALLOWED"`

---

## Acceptance Criteria

- [x] Empty `plantumlCode` → 400 EMPTY_CODE
- [x] Null `plantumlCode` → 400 EMPTY_CODE
- [x] Whitespace-only code → 400 EMPTY_CODE
- [x] Code > 50KB → 413 CODE_TOO_LARGE
- [x] Code = 50KB → 200 OK (works)
- [x] Invalid JSON → 500 INTERNAL_ERROR
- [x] Encoding failure → 500 ENCODING_FAILED
- [x] Unknown tool → 404 TOOL_NOT_FOUND
- [x] Wrong method → 405 METHOD_NOT_ALLOWED
- [x] All errors have `code` and `message`
- [x] Error format is consistent
- [x] Status codes are correct
- [x] Error messages are descriptive

---

## Implementation Notes

### Error Code Naming
Use `SCREAMING_SNAKE_CASE` for consistency:
- `EMPTY_CODE` (not `EmptyCode` or `empty_code`)
- `CODE_TOO_LARGE` (not `CodeTooLarge`)
- `ENCODING_FAILED` (not `EncodingFailed`)

### Error Messages
- Be descriptive: "PlantUML code exceeds maximum size of 50KB" (not "Too large")
- Be actionable: "plantumlCode is required and cannot be empty"
- Avoid jargon: Use plain language

### Fail Fast
Validate input before expensive operations:
1. Check presence → Check type → Check content
2. Check size limit before compression
3. Don't attempt encoding if validation fails

### Logging
Log all errors for debugging:
```javascript
console.error('Encoding error:', error);
```

View logs in Netlify dashboard.

---

## Dependencies

### External
- None (all validation is internal)

### Internal
- Task 002 (Tool Call) - uses validation

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Incomplete validation | Low | High | Comprehensive test cases |
| Unclear error messages | Low | Medium | User testing, feedback |
| Wrong status codes | Low | Medium | Review against HTTP spec |
| Unhandled exceptions | Low | High | Try-catch all handlers |

---

## Success Metrics

- Error rate: <1% (of total requests)
- Error coverage: 100% (all edge cases handled)
- Error clarity: User can understand and fix
- Error recovery: Agent can retry appropriately

---

## Known Issues

None

---

## Future Enhancements

### Phase 2
- Add `INVALID_SYNTAX` error code (if validation added)
- Add `SESSION_NOT_FOUND` error code
- Add more descriptive validation errors

### Phase 3
- Add `INVALID_TEMPLATE` error code
- Add `INVALID_FORMAT` error code
- Add validation error details (line/column numbers)

---

## Decision Table

| Input | Type | Size | Valid | Status | Code |
|-------|------|------|-------|--------|------|
| `""` | string | 0B | ✗ | 400 | EMPTY_CODE |
| `null` | null | 0B | ✗ | 400 | EMPTY_CODE |
| `"   "` | string | 3B | ✗ | 400 | EMPTY_CODE |
| `@startuml\n@enduml` | string | 20B | ✓ | 200 | - |
| `"A".repeat(51200)` | string | 50KB | ✓ | 200 | - |
| `"A".repeat(52224)` | string | 51KB | ✗ | 413 | CODE_TOO_LARGE |
| Invalid UTF-8 | string | 10B | ✗ | 500 | ENCODING_FAILED |

---

## References

- [SPEC.md - Error Codes](../SPEC.md#error-codes)
- [tests/edge-cases.md](../tests/edge-cases.md)
- [DECISIONS.log](../DECISIONS.md#decision-12-error-code-naming-convention)

---

**Last Updated:** 2025-01-03
**Status:** Complete ✅
