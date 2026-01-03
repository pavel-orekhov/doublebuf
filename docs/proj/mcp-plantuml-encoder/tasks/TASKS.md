# Task Breakdown

## Phase 1: Core Implementation

Total Estimated Effort: ~10 hours
Current Status: 80% Complete (4/5 tasks done)

---

## Task 001: Tool Discovery Endpoint

**Status:** ✅ Complete
**Effort:** ~2 hours
**Priority:** Critical

### Description
Implement `GET /api/tools` endpoint to allow agents to discover available tools and their schemas.

### Requirements
- [ ] Endpoint returns `200 OK` on success
- [ ] Response contains `tools` array
- [ ] Each tool has `id`, `name`, `description`, `inputSchema`
- [ ] `inputSchema` uses JSON Schema format
- [ ] CORS headers enabled
- [ ] Handle `OPTIONS` preflight requests
- [ ] Return `405` for non-GET requests

### Implementation
- **File:** `netlify/functions/tools-discovery.js`
- **Function:** `exports.handler`
- **Method:** GET only

### Testing
- [ ] Test `GET /api/tools` returns tool list
- [ ] Verify `encodePlantUML` tool is listed
- [ ] Check tool schema is correct
- [ ] Test CORS headers are present
- [ ] Test `OPTIONS` request returns 200
- [ ] Test `POST` returns 405

### Acceptance Criteria
- ✅ Tool discovery works
- ✅ Response format matches spec
- ✅ CORS enabled
- ✅ Error handling works

### Notes
- Keep it simple: Single tool in Phase 1
- Schema format: JSON Schema-like
- Future: Dynamic tool loading from config

---

## Task 002: Tool Call Endpoint

**Status:** ✅ Complete
**Effort:** ~3 hours
**Priority:** Critical
**Dependencies:** Task 001

### Description
Implement `POST /api/tools/{toolName}` endpoint to execute tools with parameters.

### Requirements
- [ ] Dynamic routing based on `{toolName}` path parameter
- [ ] Implement `encodePlantUML` tool
- [ ] PlantUML encoding algorithm (zlib + character mapping)
- [ ] Return `{ success: true, result: { url, encoded, format } }`
- [ ] Return `{ success: false, error: { code, message } }`
- [ ] CORS headers enabled
- [ ] Handle `OPTIONS` preflight requests
- [ ] Return `404` for unknown tools
- [ ] Return `405` for non-POST requests

### Implementation
- **File:** `netlify/functions/tools-call.js`
- **Function:** `exports.handler`
- **Method:** POST only
- **Routing:** Path-based tool dispatch

### Encoding Algorithm
1. Compress with `zlib.deflateRaw(code, { level: 9 })`
2. Encode as Base64
3. Map Base64 characters to PlantUML alphabet
4. Return URL: `https://www.plantuml.com/plantuml/svg/{encoded}`

### Testing
- [ ] Test valid PlantUML code encoding
- [ ] Verify URL format is correct
- [ ] Test URL renders correctly on plantuml.com
- [ ] Test unknown tool returns 404
- [ ] Test CORS headers
- [ ] Test `OPTIONS` request

### Acceptance Criteria
- ✅ Tool invocation works
- ✅ Encoding algorithm correct
- ✅ URLs valid and work
- ✅ Deterministic encoding
- ✅ Error handling works

### Notes
- Use `zlib` built-in module
- Character mapping is critical for PlantUML compatibility
- Test with multiple diagram types (sequence, FSM, etc.)

---

## Task 003: Error Handling

**Status:** ✅ Complete
**Effort:** ~1 hour
**Priority:** High
**Dependencies:** Task 002

### Description
Implement comprehensive error handling for all edge cases.

### Requirements
- [ ] Empty/null `plantumlCode` → 400 EMPTY_CODE
- [ ] Whitespace-only code → 400 EMPTY_CODE
- [ ] Code > 50KB → 413 CODE_TOO_LARGE
- [ ] Encoding failure → 500 ENCODING_FAILED
- [ ] Unknown tool → 404 TOOL_NOT_FOUND
- [ ] Wrong method → 405 METHOD_NOT_ALLOWED
- [ ] Invalid JSON → 500 INTERNAL_ERROR
- [ ] All errors have `code` and `message`
- [ ] Error format: `{ success: false, error: { code, message } }`

### Implementation
- **Files:** `tools-call.js`, `tools-discovery.js`
- **Functions:** `validatePlantUMLCode()`, error handlers

### Validation Rules
| Rule | Condition | Error Code | Status |
|------|-----------|------------|--------|
| Required | `plantumlCode` present | EMPTY_CODE | 400 |
| Type | `plantumlCode` is string | EMPTY_CODE | 400 |
| Non-empty | `plantumlCode.trim() !== ''` | EMPTY_CODE | 400 |
| Size limit | `byteLength <= 50KB` | CODE_TOO_LARGE | 413 |
| UTF-8 valid | Valid UTF-8 encoding | ENCODING_FAILED | 500 |

### Testing
- [ ] Test empty `plantumlCode`
- [ ] Test null `plantumlCode`
- [ ] Test whitespace-only code
- [ ] Test exactly 50KB code (should work)
- [ ] Test 50.1KB code (should fail)
- [ ] Test invalid UTF-8
- [ ] Test encoding algorithm failure
- [ ] Test unknown tool path
- [ ] Test wrong HTTP method

### Acceptance Criteria
- ✅ All error cases handled
- ✅ Correct status codes
- ✅ Clear error messages
- ✅ Error format consistent
- ✅ Error codes documented

### Notes
- Use descriptive error messages (for agents)
- Fail fast: Validate before encoding
- Log errors for debugging

---

## Task 004: Netlify Deploy

**Status:** 🔄 In Progress
**Effort:** ~2 hours
**Priority:** High
**Dependencies:** Task 001, 002, 003

### Description
Deploy service to Netlify free tier and verify functionality.

### Requirements
- [ ] Update `netlify.toml` with new routes
- [ ] Configure function bundler (esbuild)
- [ ] Deploy to Netlify free tier
- [ ] Test `GET /api/tools` in production
- [ ] Test `POST /api/tools/encodePlantUML` in production
- [ ] Verify response times <500ms
- [ ] Test CORS from external origin
- [ ] Test with cURL from local machine

### Implementation
- **File:** `netlify.toml`
- **Routes:**
  ```
  GET /api/tools → tools-discovery
  POST /api/tools/* → tools-call
  ```

### Deployment Steps
1. Push code to Git repository
2. Connect repository to Netlify
3. Configure build settings
4. Deploy to production
5. Test endpoints
6. Verify functionality

### Testing
- [ ] Deploy to `https://webodar.netlify.app`
- [ ] Test `GET /api/tools` returns tools
- [ ] Test `POST /api/tools/encodePlantUML` encodes correctly
- [ ] Test error cases in production
- [ ] Measure response times (cold & warm)
- [ ] Test from different browsers
- [ ] Verify CORS headers
- [ ] Test with large diagram (near 50KB)

### Performance Targets
- Cold start: <500ms
- Warm start: <100ms
- Encoding time: <50ms
- Total response: <600ms

### Acceptance Criteria
- ⏳ Service deployed to production
- ⏳ All endpoints work
- ⏳ Response times acceptable
- ⏳ CORS works from any origin
- ⏳ Errors handled correctly

### Notes
- Keep legacy endpoint for backward compatibility
- Monitor free tier usage (125k/month)
- Document deployment process

---

## Task 005: Documentation

**Status:** ✅ Complete
**Effort:** ~3 hours
**Priority:** High
**Dependencies:** None (can work in parallel)

### Description
Create comprehensive documentation to enable context recovery and future agent understanding.

### Requirements
- [ ] Create `docs/` directory structure
- [ ] Write high-level docs (PROJECT, ARCHITECTURE, ROADMAP)
- [ ] Write project-specific docs (PRD, SPEC, DECISIONS, CONTEXT, GLOSSARY, STATUS)
- [ ] Write task documentation (TASKS.md + individual tasks)
- [ ] Write test documentation (TEST_PLAN, scenarios, examples, edge-cases)
- [ ] Update README.md to point to docs
- [ ] Ensure all docs are consistent
- [ ] Verify links work

### Documentation Structure
```
docs/
├── PROJECT.md              # Goals, constraints, dates
├── ARCHITECTURE.md          # Architecture, endpoints, diagrams
├── ROADMAP.md               # Future phases and features
└── proj/mcp-plantuml-encoder/
    ├── PRD.md               # Product Requirements
    ├── SPEC.md              # Technical Specification
    ├── DECISIONS.log        # Decision log with rationale
    ├── CONTEXT.md           # Context for agents
    ├── GLOSSARY.md          # Terms and definitions
    ├── STATUS.md            # Current status
    ├── tasks/
    │   ├── TASKS.md         # Master task list
    │   ├── 001-api-tools-discovery.md
    │   ├── 002-api-tool-call.md
    │   ├── 003-error-handling.md
    │   ├── 004-netlify-deploy.md
    │   └── 005-documentation.md
    └── tests/
        ├── TEST_PLAN.md     # Test plan
        ├── scenarios.md     # Gherkin scenarios
        ├── examples.md      # Executable examples
        └── edge-cases.md    # Decision table
```

### Content Requirements

#### docs/PROJECT.md
- Project overview
- Goals and objectives
- Constraints
- Team & stakeholders
- Key dates
- Links to detailed docs

#### docs/ARCHITECTURE.md
- High-level architecture diagram
- Endpoint overview
- Data flow
- Deployment model
- Scalability notes

#### docs/ROADMAP.md
- Phase 1 (current)
- Phase 2: History tracking
- Phase 3: Expansion (more tools)
- Phase 4: Full MCP server
- Future ideas (backlog)

#### PRD.md
- Problem statement
- Solution overview
- User stories
- Success criteria
- Out of scope
- Constraints
- Requirements breakdown

#### SPEC.md
- API specification
- Data models
- Encoding algorithm
- Error codes
- Validation rules
- Invariants
- Performance requirements
- Deployment configuration

#### DECISIONS.log
- All decisions with date, status, rationale
- Alternatives considered
- Impact analysis
- Future decisions

#### CONTEXT.md
- What is this?
- Why does it exist?
- How to use as a tool
- Key concepts
- Architecture decisions
- Future extensions

#### GLOSSARY.md
- Terms and definitions
- Tool, Tool Discovery, MCP, PlantUML, etc.

#### STATUS.md
- Current phase
- Completed tasks
- In progress
- Blocked
- Next steps
- Issues/risks

#### tasks/TASKS.md
- Task breakdown
- Dependencies
- Status tracking

#### tests/TEST_PLAN.md
- Manual testing scenarios
- Examples verification
- Edge cases
- Curl commands

#### tests/scenarios.md
- Gherkin scenarios (5 scenarios)
- Agent workflow examples

#### tests/examples.md
- Executable examples (2 examples)
- FSM diagram
- Sequence diagram

#### tests/edge-cases.md
- Decision table
- Edge case descriptions

### Testing
- [ ] All docs created
- [ ] Links between docs work
- [ ] Content is consistent
- [ ] Examples are copy-paste ready
- [ ] Agent can understand from docs alone
- [ ] Update STATUS.md as tasks complete

### Acceptance Criteria
- ✅ All documentation created
- ✅ Structure matches specification
- ✅ Content is complete
- ✅ Links work
- ✅ Consistent with implementation
- ✅ STATUS.md up to date

### Notes
- Write for future agents/developers
- Include rationale in decisions
- Keep examples simple and runnable
- Use markdown + clear structure

---

## Dependency Graph

```
Task 001 (Tool Discovery)
    ↓
Task 002 (Tool Call)
    ↓
Task 003 (Error Handling)
    ↓
Task 004 (Netlify Deploy)
    ↓
Task 005 (Documentation) [can run in parallel]
```

---

## Summary

| Task ID | Task Name | Effort | Status | Completion |
|---------|-----------|--------|--------|------------|
| 001 | Tool Discovery | ~2h | ✅ Complete | 100% |
| 002 | Tool Call | ~3h | ✅ Complete | 100% |
| 003 | Error Handling | ~1h | ✅ Complete | 100% |
| 004 | Netlify Deploy | ~2h | 🔄 In Progress | 0% |
| 005 | Documentation | ~3h | ✅ Complete | 100% |

**Total:** ~10 hours
**Completed:** ~9 hours (90%)
**Remaining:** ~1 hour (deployment)

---

## Next Steps

1. Complete Task 004 (Netlify Deploy)
2. Test in production
3. Verify agent integration
4. Gather feedback
5. Plan Phase 2 (if needed)
