# Gherkin Scenarios

## Overview

These Gherkin scenarios describe the complete workflow of how agents discover, call, and use tools in this HTTP MCP-compatible PlantUML Encoder service.

---

## Scenario 1: Agent Discovers Available Tools

### Objective
Agent learns what tools are available and their parameters before generating diagrams.

### Gherkin

```gherkin
Feature: Tool Discovery
  As an AI agent
  I want to discover available tools and their schemas
  So that I know what functionality I can use

  Scenario: Agent discovers tools on startup
    Given: MCP-compatible service is deployed
    When: Agent calls GET /api/tools
    Then:
      - Status code is 200
      - Response contains "tools" array
      - encodePlantUML tool is listed in tools array
      - Tool has "id" field with value "encodePlantUML"
      - Tool has "name" field
      - Tool has "description" field
      - Tool has "inputSchema" field
      - inputSchema has "type" field with value "object"
      - inputSchema has "properties" field
      - inputSchema.properties contains "plantumlCode"
      - inputSchema.required array contains "plantumlCode"
      - plantumlCode has "type" field with value "string"
      - plantumlCode has "description" field
    And: Agent can parse and understand tool schema
    And: Agent knows it needs to provide "plantumlCode" parameter
    And: Agent can proceed to generate PlantUML code
```

### Notes
- Tool discovery is the first step for any agent
- Schema format is JSON Schema-like
- Required parameters are explicitly listed

---

## Scenario 2: Agent Encodes Valid Diagram

### Objective
Agent generates PlantUML code and encodes it into a shareable URL.

### Gherkin

```gherkin
Feature: Tool Invocation
  As an AI agent
  I want to encode PlantUML diagrams into URLs
  So that I can share visual diagrams with users

  Scenario: Agent encodes valid PlantUML diagram
    Given: Agent knows about encodePlantUML tool
    When: Agent calls POST /api/tools/encodePlantUML
    And: Agent passes valid PlantUML code in "plantumlCode" parameter:
      """
      @startuml
      actor Writer1
      actor Writer2
      rectangle "Front Buffer" as Front
      Writer1 --> Front
      Writer2 --> Front
      @enduml
      """
    Then:
      - Status code is 200
      - Response has "success" field with value "true"
      - Response has "result" field (not "error" field)
      - result has "url" field
      - result.url starts with "https://www.plantuml.com/plantuml/svg/"
      - result.url is a valid HTTPS URL
      - result.url is non-empty
      - result has "encoded" field
      - result.encoded is non-empty string
      - result has "format" field
      - result.format has value "svg"
    And: URL points to plantuml.com
    And: URL renders diagram correctly when opened in browser
    And: All participants and relationships are visible
    And: Agent can extract URL from response
    And: Agent can show URL to user
    And: User can click URL and see diagram
  ```

### Notes
- Successful encoding always returns `success: true`
- URL format is always `https://www.plantuml.com/plantuml/svg/{encoded}`
- Same PlantUML code → Same URL (deterministic)

---

## Scenario 3: Agent Handles Empty Code

### Objective
Agent handles user request without providing PlantUML code.

### Gherkin

```gherkin
Feature: Error Handling
  As an AI agent
  I want to receive clear error messages for invalid input
  So that I can explain the issue to users and recover gracefully

  Scenario: Agent handles empty PlantUML code
    Given: Service is deployed
    When: Agent calls POST /api/tools/encodePlantUML
    And: Agent passes empty "plantumlCode" parameter: ""
    Then:
      - Status code is 400 Bad Request
      - Response has "success" field with value "false"
      - Response has "error" field (not "result" field)
      - error has "code" field
      - error.code has value "EMPTY_CODE"
      - error has "message" field
      - error.message is descriptive: "plantumlCode is required and cannot be empty"
    And: Agent can detect error via success=false
    And: Agent can extract error.code and error.message
    And: Agent can report error to user
    And: Agent can ask user to provide PlantUML code
    And: Agent can continue conversation
    And: Agent can retry when user provides code
  ```

### Notes
- Empty code includes: empty string, null, whitespace-only
- Error code is always uppercase snake_case
- Error message is human-readable and actionable

---

## Scenario 4: Agent Handles Encoding Error

### Objective
Agent handles unexpected encoding failures gracefully.

### Gherkin

```gherkin
Feature: Error Handling
  As an AI agent
  I want to receive clear error messages for encoding failures
  So that I can explain the issue and suggest alternatives

  Scenario: Agent handles encoding failure
    Given: Service is deployed
    When: Agent calls POST /api/tools/encodePlantUML
    And: Encoding algorithm fails for any reason
    Then:
      - Status code is 500 Internal Server Error
      - Response has "success" field with value "false"
      - Response has "error" field (not "result" field)
      - error has "code" field
      - error.code has value "ENCODING_FAILED"
      - error has "message" field
      - error.message is descriptive: "Failed to encode PlantUML code"
    And: Agent can detect error via success=false
    And: Agent can explain error to user
    And: Agent can suggest user to try different code
    And: Agent can suggest user to simplify diagram
    And: Agent can retry with simplified code
  ```

### Notes
- Encoding failures are rare (should not happen with valid UTF-8)
- 500 errors are server-side issues
- Agent should suggest retrying or simplifying

---

## Scenario 5: Multiple Sequential Tool Calls

### Objective
Service handles multiple sequential requests correctly without state persistence.

### Gherkin

```gherkin
Feature: Statelessness
  As an AI agent
  I want to make multiple sequential tool calls
  So that I can generate multiple diagrams in a conversation

  Scenario: Agent makes 5 sequential tool calls
    Given: Agent is discussing architecture with user
    When: Agent generates first diagram (FSM)
    And: Agent calls POST /api/tools/encodePlantUML with FSM code
    Then:
      - First call returns success: true
      - First call returns valid URL
      - First URL renders FSM correctly
    When: Agent generates second diagram (sequence)
    And: Agent calls POST /api/tools/encodePlantUML with sequence code
    Then:
      - Second call returns success: true
      - Second call returns valid URL
      - Second URL renders sequence diagram correctly
      - Second URL is different from first URL
    When: Agent generates third diagram (component)
    And: Agent calls POST /api/tools/encodePlantUML with component code
    Then:
      - Third call returns success: true
      - Third call returns valid URL
    When: Agent generates fourth diagram (state)
    And: Agent calls POST /api/tools/encodePlantUML with state code
    Then:
      - Fourth call returns success: true
      - Fourth call returns valid URL
    When: Agent generates fifth diagram (deployment)
    And: Agent calls POST /api/tools/encodePlantUML with deployment code
    Then:
      - Fifth call returns success: true
      - Fifth call returns valid URL
    And: All 5 calls return correct results
    And: No state persists between calls (stateless)
    And: Response time <500ms for each call
    And: All 5 URLs work and render correctly
    And: Each URL is unique (different diagrams)
  ```

### Notes
- Stateless design means no cross-call dependencies
- Each request is independent
- No rate limiting in Phase 1

---

## Scenario 6: Agent Handles Oversized Code

### Objective
Agent handles code exceeding 50KB size limit.

### Gherkin

```gherkin
Feature: Validation
  As an AI agent
  I want to receive clear error messages for oversized input
  So that I can explain the size limit and suggest alternatives

  Scenario: Agent handles code exceeding 50KB
    Given: Service is deployed
    And: Agent generates very large PlantUML diagram (51KB)
    When: Agent calls POST /api/tools/encodePlantUML
    And: Agent passes large "plantumlCode" parameter (51KB)
    Then:
      - Status code is 413 Payload Too Large
      - Response has "success" field with value "false"
      - Response has "error" field (not "result" field)
      - error has "code" field
      - error.code has value "CODE_TOO_LARGE"
      - error has "message" field
      - error.message is descriptive: "PlantUML code exceeds maximum size of 50KB"
    And: Agent can detect error via success=false
    And: Agent can explain size limit to user
    And: Agent can suggest breaking diagram into smaller parts
    And: Agent can retry with smaller diagram
  ```

### Notes
- 50KB limit is enforced
- Exactly 50KB should work
- 50.1KB should fail with 413

---

## Scenario 7: Agent Handles Unknown Tool

### Objective
Agent handles requests for non-existent tools.

### Gherkin

```gherkin
Feature: Tool Discovery
  As an AI agent
  I want to receive clear error messages for unknown tools
  So that I know the tool doesn't exist

  Scenario: Agent attempts to call unknown tool
    Given: Service is deployed
    When: Agent calls POST /api/tools/unknownTool
    Then:
      - Status code is 404 Not Found
      - Response has "success" field with value "false"
      - Response has "error" field (not "result" field)
      - error has "code" field
      - error.code has value "TOOL_NOT_FOUND"
      - error has "message" field
      - error.message is descriptive: "Tool 'unknownTool' not found"
    And: Agent can detect error via success=false
    And: Agent knows the tool doesn't exist
    And: Agent can call GET /api/tools to discover available tools
  ```

### Notes
- Only `encodePlantUML` tool exists in Phase 1
- Future tools will be added in Phase 3

---

## Scenario 8: Agent Validates Deterministic Encoding

### Objective
Agent confirms that same code produces same URL.

### Gherkin

```gherkin
Feature: Determinism
  As an AI agent
  I want to verify that same input produces same output
  So that I can cache results and predict URLs

  Scenario: Agent verifies deterministic encoding
    Given: Agent has PlantUML code:
      """
      @startuml
      A --> B
      @enduml
      """
    When: Agent calls POST /api/tools/encodePlantUML with code
    And: Agent saves URL from first call
    When: Agent calls POST /api/tools/encodePlantUML with same code
    Then:
      - Second call returns success: true
      - Second call returns same URL as first call
      - URLs are identical (character-by-character)
    And: Agent can cache result for performance
    And: Agent can predict URL before encoding
  ```

### Notes
- Determinism enables caching
- Same code always produces same URL
- URLs are reproducible

---

## Summary of Scenarios

| Scenario | Purpose | Key Outcome |
|----------|---------|-------------|
| 1 | Tool Discovery | Agent learns available tools |
| 2 | Valid Encoding | Agent encodes diagram successfully |
| 3 | Empty Code | Agent handles empty input gracefully |
| 4 | Encoding Error | Agent handles unexpected failures |
| 5 | Multiple Calls | Service handles sequential requests |
| 6 | Oversized Code | Agent enforces size limits |
| 7 | Unknown Tool | Agent handles non-existent tools |
| 8 | Determinism | Agent confirms reproducibility |

---

## References

- [TEST_PLAN.md](./TEST_PLAN.md) - Complete test plan
- [examples.md](./examples.md) - Executable examples
- [edge-cases.md](./edge-cases.md) - Decision table

---

**Last Updated:** 2025-01-03
