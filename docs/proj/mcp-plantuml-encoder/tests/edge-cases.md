# Edge Cases

## Overview

This document describes edge cases and the expected behavior of the HTTP MCP-compatible PlantUML Encoder service.

---

## Decision Table

| Input | Type | Size | Valid? | Status | Error Code | Notes |
|-------|------|------|--------|--------|------------|-------|
| `""` | string | 0B | ✗ | 400 | EMPTY_CODE | Empty string |
| `null` | null | 0B | ✗ | 400 | EMPTY_CODE | Null value |
| `undefined` | undefined | 0B | ✗ | 400 | EMPTY_CODE | Missing parameter |
| `"   "` | string | 3B | ✗ | 400 | EMPTY_CODE | Whitespace only |
| `"\n\t  \n"` | string | 5B | ✗ | 400 | EMPTY_CODE | Mixed whitespace |
| `"A"` | string | 1B | ✓ | 200 | - | Minimal valid code |
| `@startuml\n@enduml` | string | 20B | ✓ | 200 | - | Empty diagram (valid) |
| `"A".repeat(51200)` | string | 50KB | ✓ | 200 | - | Maximum size |
| `"A".repeat(52224)` | string | 51KB | ✗ | 413 | CODE_TOO_LARGE | Exceeds limit |
| Valid diagram | string | 10KB | ✓ | 200 | - | Typical use case |
| Valid diagram | string | 25KB | ✓ | 200 | - | Large but valid |
| `123` | number | 3B | ✗ | 400 | EMPTY_CODE | Wrong type |
| `{}` | object | 2B | ✗ | 400 | EMPTY_CODE | Wrong type |
| `[]` | array | 2B | ✗ | 400 | EMPTY_CODE | Wrong type |
| Invalid UTF-8 | string | 10B | ✗ | 500 | ENCODING_FAILED | Encoding error |

---

## Edge Case Details

### 1. Empty String

**Input:**
```json
{
  "plantumlCode": ""
}
```

**Expected Behavior:**
- Status: 400 Bad Request
- Success: false
- Error Code: EMPTY_CODE
- Error Message: "plantumlCode is required and cannot be empty"

**Rationale:** Empty string cannot be encoded meaningfully.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":""}'
```

---

### 2. Null Value

**Input:**
```json
{
  "plantumlCode": null
}
```

**Expected Behavior:**
- Status: 400 Bad Request
- Success: false
- Error Code: EMPTY_CODE
- Error Message: "plantumlCode is required and cannot be empty"

**Rationale:** Null is not a valid string.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":null}'
```

---

### 3. Undefined/Missing Parameter

**Input:**
```json
{}
```

**Expected Behavior:**
- Status: 400 Bad Request
- Success: false
- Error Code: EMPTY_CODE
- Error Message: "plantumlCode is required and cannot be empty"

**Rationale:** Parameter is missing entirely.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### 4. Whitespace-Only String

**Input:**
```json
{
  "plantumlCode": "   \n\t  \n   "
}
```

**Expected Behavior:**
- Status: 400 Bad Request
- Success: false
- Error Code: EMPTY_CODE
- Error Message: "plantumlCode is required and cannot be empty"

**Rationale:** Whitespace-only content is meaningless after trimming.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":"   \n\t  \n   "}'
```

---

### 5. Exactly 50KB

**Input:**
```bash
# Create 50KB file (51200 bytes)
dd if=/dev/zero bs=1024 count=50 | tr '\0' 'A' | tr -d '\n' > 50kb.txt
```

**Request:**
```json
{
  "plantumlCode": "A".repeat(51200)
}
```

**Expected Behavior:**
- Status: 200 OK
- Success: true
- Result: URL returned

**Rationale:** 50KB is the maximum allowed size.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d "{\"plantumlCode\":\"$(cat 50kb.txt)\"}"
```

---

### 6. Slightly Over 50KB (50.1KB)

**Input:**
```bash
# Create 51KB file (52224 bytes)
dd if=/dev/zero bs=1024 count=51 | tr '\0' 'A' | tr -d '\n' > 51kb.txt
```

**Request:**
```json
{
  "plantumlCode": "A".repeat(52224)
}
```

**Expected Behavior:**
- Status: 413 Payload Too Large
- Success: false
- Error Code: CODE_TOO_LARGE
- Error Message: "PlantUML code exceeds maximum size of 50KB"

**Rationale:** Size limit is strictly enforced.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d "{\"plantumlCode\":\"$(cat 51kb.txt)\"}"
```

---

### 7. Wrong Type (Number)

**Input:**
```json
{
  "plantumlCode": 123
}
```

**Expected Behavior:**
- Status: 400 Bad Request
- Success: false
- Error Code: EMPTY_CODE
- Error Message: "plantumlCode is required and cannot be empty"

**Rationale:** Parameter must be a string.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":123}'
```

---

### 8. Wrong Type (Object)

**Input:**
```json
{
  "plantumlCode": {}
}
```

**Expected Behavior:**
- Status: 400 Bad Request
- Success: false
- Error Code: EMPTY_CODE
- Error Message: "plantumlCode is required and cannot be empty"

**Rationale:** Parameter must be a string.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":{}}'
```

---

### 9. Invalid UTF-8

**Input:**
```bash
# Create invalid UTF-8 bytes
echo -ne '\xff\xfe' > invalid.txt
```

**Request:**
```json
{
  "plantumlCode": "<invalid UTF-8 bytes>"
}
```

**Expected Behavior:**
- Status: 500 Internal Server Error
- Success: false
- Error Code: ENCODING_FAILED
- Error Message: "Failed to encode PlantUML code"

**Rationale:** Invalid UTF-8 cannot be encoded.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  --data-binary @invalid.txt
```

---

### 10. Empty Diagram (Valid)

**Input:**
```json
{
  "plantumlCode": "@startuml\n@enduml"
}
```

**Expected Behavior:**
- Status: 200 OK
- Success: true
- Result: URL returned
- URL: Renders empty diagram (blank)

**Rationale:** Empty diagram is syntactically valid.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":"@startuml\n@enduml"}'
```

---

### 11. Unknown Tool

**Request:**
```bash
POST /api/tools/unknownTool
```

**Input:**
```json
{}
```

**Expected Behavior:**
- Status: 404 Not Found
- Success: false
- Error Code: TOOL_NOT_FOUND
- Error Message: "Tool 'unknownTool' not found"

**Rationale:** Tool does not exist in Phase 1.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/unknownTool \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### 12. Wrong HTTP Method

**Request:**
```bash
GET /api/tools/encodePlantUML
```

**Expected Behavior:**
- Status: 405 Method Not Allowed
- Success: false
- Error Code: METHOD_NOT_ALLOWED
- Error Message: "Only POST method is allowed"

**Rationale:** Tool invocation requires POST.

**Test:**
```bash
curl -X GET https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json"
```

---

### 13. Invalid JSON

**Request:**
```bash
POST /api/tools/encodePlantUML
```

**Input:**
```
invalid json
```

**Expected Behavior:**
- Status: 500 Internal Server Error
- Success: false
- Error Code: INTERNAL_ERROR
- Error Message: "Internal server error"

**Rationale:** JSON parsing failed.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

---

### 14. Special Characters in PlantUML

**Input:**
```json
{
  "plantumlCode": "@startuml\nA --> B: Hello! @#$%^&*()\n@enduml"
}
```

**Expected Behavior:**
- Status: 200 OK
- Success: true
- Result: URL returned
- URL: Renders diagram with special characters

**Rationale:** Special characters are valid in PlantUML labels.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":"@startuml\nA --> B: Hello! @#$%^&*()\n@enduml"}'
```

---

### 15. Very Long Line in PlantUML

**Input:**
```json
{
  "plantumlCode": "@startuml\nA --> B: " + "x".repeat(1000) + "\n@enduml"
}
```

**Expected Behavior:**
- Status: 200 OK
- Success: true
- Result: URL returned
- URL: Renders diagram with long label

**Rationale:** Long lines are allowed (as long as total <50KB).

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d "{\"plantumlCode\":\"@startuml\nA --> B: $(printf 'x%.0s' {1..1000})\n@enduml\"}"
```

---

### 16. Newlines and Tabs

**Input:**
```json
{
  "plantumlCode": "@startuml\n\tA\n\t\t-->\n\tB\n@enduml"
}
```

**Expected Behavior:**
- Status: 200 OK
- Success: true
- Result: URL returned
- URL: Renders diagram correctly

**Rationale:** Whitespace is preserved in PlantUML.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":"@startuml\n\tA\n\t\t-->\n\tB\n@enduml"}'
```

---

### 17. Multiple Diagrams in One File

**Input:**
```json
{
  "plantumlCode": "@startuml\nA --> B\n@enduml\n@startuml\nC --> D\n@enduml"
}
```

**Expected Behavior:**
- Status: 200 OK
- Success: true
- Result: URL returned
- URL: Renders first diagram (or all, depending on PlantUML)

**Rationale:** Multiple diagrams are syntactically valid.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":"@startuml\nA --> B\n@enduml\n@startuml\nC --> D\n@enduml"}'
```

---

### 18. Unicode Characters

**Input:**
```json
{
  "plantumlCode": "@startuml\nA --> B: 你好 🌍\n@enduml"
}
```

**Expected Behavior:**
- Status: 200 OK
- Success: true
- Result: URL returned
- URL: Renders diagram with Unicode characters

**Rationale:** Unicode is fully supported.

**Test:**
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":"@startuml\nA --> B: 你好 🌍\n@enduml"}'
```

---

## Validation Rules

### Rule 1: Required Parameter
**Check:** `plantumlCode` parameter is present in request body
**Failure:** 400 EMPTY_CODE

### Rule 2: Type Check
**Check:** `plantumlCode` is a string
**Failure:** 400 EMPTY_CODE

### Rule 3: Non-Empty After Trim
**Check:** `plantumlCode.trim() !== ''`
**Failure:** 400 EMPTY_CODE

### Rule 4: Size Limit
**Check:** `Buffer.byteLength(plantumlCode, 'utf8') <= 50 * 1024`
**Failure:** 413 CODE_TOO_LARGE

### Rule 5: Valid UTF-8
**Check:** String is valid UTF-8 (handled by Node.js)
**Failure:** 500 ENCODING_FAILED

---

## Invariants

1. **Empty or null `plantumlCode` → Error**
   - No encoding attempted
   - Fail fast

2. **`plantumlCode` > 50KB → Error 413**
   - Size limit enforced
   - Fail fast

3. **URL format always consistent**
   - `https://www.plantuml.com/plantuml/svg/{encoded}`
   - Never varies

4. **On success → URL is valid**
   - URL is non-empty
   - URL renders correctly

5. **On error → `status="error"` and `code` present**
   - Error always has code
   - Error always has message

6. **Stateless → No side effects**
   - Each request independent
   - No cross-request state

7. **Same code → same URL**
   - Deterministic encoding
   - Enables caching

8. **CORS enabled**
   - Allow from any origin
   - Required headers present

9. **Error response always includes `error.code`**
   - Agent can programmatically handle
   - Predictable format

10. **Agent can always parse response JSON**
    - Valid JSON always
    - No malformed responses

---

## Testing Strategy

### Unit-Level Testing
Test each edge case individually:
1. Create test input
2. Make API call
3. Verify status code
4. Verify response structure
5. Verify error code (if error)

### Integration-Level Testing
Test edge cases in context:
1. Call tool discovery
2. Call tool with edge case input
3. Verify agent can handle response
4. Verify conversation continues

### Stress Testing
Test limits:
1. Exactly 50KB: Should work
2. 50.1KB: Should fail
3. 100 sequential calls: Should all work
4. Cold vs warm starts: Measure performance

---

## References

- [TEST_PLAN.md](./TEST_PLAN.md) - Complete test plan
- [scenarios.md](./scenarios.md) - Gherkin scenarios
- [examples.md](./examples.md) - Executable examples

---

**Last Updated:** 2025-01-03
