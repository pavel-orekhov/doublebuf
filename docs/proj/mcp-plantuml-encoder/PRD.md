# Product Requirements Document (PRD)

## Problem Statement

When AI agents like Claude or cto planning agents discuss software architecture, they often need to generate and share diagrams. However, current workflows are cumbersome:

1. Agents generate PlantUML code in text
2. Users must manually copy-paste code to plantuml.com
3. No easy way to share URLs in conversations
4. No tool discovery mechanism for agents
5. Limited integration with MCP (Model Context Protocol)

This friction reduces productivity and breaks the conversational flow.

## Solution Overview

Build a simple HTTP API that:
1. Allows agents to encode PlantUML code into shareable URLs
2. Provides tool discovery for MCP compatibility
3. Uses standard HTTP (web-native, CORS-friendly)
4. Works on Netlify free tier
5. Integrates seamlessly with AI conversations

## Target Users

### Primary: cto Planning Agent
- **Use Case:** Designing lock-free double buffer architecture
- **Needs:** Generate FSM, sequence, and state diagrams
- **Workflow:** Discuss architecture → generate diagram → share URL → iterate

### Secondary: Claude
- **Use Case:** General diagram generation for technical discussions
- **Needs:** Quick diagram encoding without manual steps
- **Workflow:** Chat → encode → URL → view → refine

### Tertiary: Developers
- **Use Case:** Quick diagram generation during coding
- **Needs:** Simple API, no authentication, fast response
- **Workflow:** Generate code → API call → get URL → share

## Success Criteria

### Functional Requirements
- [ ] Encode valid PlantUML code to URL
- [ ] Tool discovery endpoint returns schema
- [ ] Error handling with clear messages
- [ ] CORS enabled for cross-origin requests
- [ ] Response time <500ms (95th percentile)

### Non-Functional Requirements
- [ ] Stateless (no persistent storage in Phase 1)
- [ ] Deterministic encoding (same code → same URL)
- [ ] Handle 50KB max code size
- [ ] 125k invocations/month budget (free tier)
- [ ] Uptime >99% (Netlify SLA)

### Quality Requirements
- [ ] Clean, documented API
- [ ] Predictable error codes
- [ ] Valid JSON responses
- [ ] Works with Claude, cto agents
- [ ] Easy to extend (add new tools)

## User Stories

### As an AI Agent
```
When I need to show a diagram to a user
I want to encode PlantUML code to a URL
So that I can share it in the conversation
```

### As a cto Planning Agent
```
When I'm discussing architecture
I want to generate FSM and sequence diagrams
So that I can visualize state transitions and interactions
```

### As a User
```
When an agent shares a diagram URL
I want to click and see the rendered diagram
So that I can understand the design
```

### As a Developer
```
When I'm building a tool for diagrams
I want to discover available tools programmatically
So that I can integrate without hardcoding endpoints
```

## Out of Scope

### Phase 1 (Current)
- ❌ Persistent storage (diagram history)
- ❌ JSON-RPC 2.0 (HTTP-only)
- ❌ Multiple diagram formats (PNG only)
- ❌ User authentication
- ❌ Rate limiting
- ❌ Diagram rendering (we generate URLs only)
- ❌ Diagram validation (syntax checking)
- ❌ Template system
- ❌ Real-time collaboration

### Future Phases
- ✅ History tracking (Phase 2)
- ✅ More tools (Mermaid, validation) (Phase 3)
- ✅ Full MCP server (Phase 4)

## Constraints

### Technical Constraints
- HTTP-only (not JSON-RPC 2.0)
- Stateless design
- Max 50KB per PlantUML code
- Must work on Netlify free tier

### Business Constraints
- No budget for hosting (use free tier)
- Must be simple enough for single developer
- Must be maintainable without team

### User Constraints
- No authentication required
- Works in any environment (browser, server, embedded)
- CORS enabled for all origins

## Requirements Breakdown

### R1: Tool Discovery
**Priority:** Must Have
**Description:** Agents must discover available tools programmatically
**Acceptance:**
- GET /api/tools returns tool list
- Each tool has id, name, description, inputSchema
- Response is valid JSON
- CORS enabled

### R2: PlantUML Encoding
**Priority:** Must Have
**Description:** Encode PlantUML code to shareable URL
**Acceptance:**
- POST /api/tools/encodePlantUML accepts plantumlCode
- Returns { success: true, result: { url, encoded, format } }
- URL is valid and works on plantuml.com
- Same code → same URL (deterministic)

### R3: Error Handling
**Priority:** Must Have
**Description:** Clear, actionable error messages
**Acceptance:**
- Empty code → 400 EMPTY_CODE
- Oversized code → 413 CODE_TOO_LARGE
- Encoding error → 500 ENCODING_FAILED
- All errors have code + message
- Response format: { success: false, error: { code, message } }

### R4: Input Validation
**Priority:** Must Have
**Description:** Validate input before processing
**Acceptance:**
- Reject null/undefined plantumlCode
- Reject whitespace-only code
- Reject code >50KB
- Reject non-string types

### R5: CORS Support
**Priority:** Must Have
**Description:** Enable cross-origin requests from any origin
**Acceptance:**
- Access-Control-Allow-Origin: *
- Allow GET, POST, OPTIONS methods
- Allow Content-Type header

### R6: Performance
**Priority:** Should Have
**Description:** Fast response times for good UX
**Acceptance:**
- P50 response <100ms (warm)
- P95 response <500ms (cold)
- No memory leaks
- Efficient encoding algorithm

### R7: Documentation
**Priority:** Must Have
**Description:** Complete, understandable documentation
**Acceptance:**
- API specification with examples
- Architecture documentation
- Decision log with rationale
- Context for agents
- Task breakdown

### R8: Extensibility
**Priority:** Should Have
**Description:** Easy to add new tools
**Acceptance:**
- Tool discovery dynamically lists tools
- Tool call uses dynamic routing
- New tools don't require code changes to router

## Open Questions

1. **Q:** Do we need rate limiting?
   **A:** No for Phase 1 (free tier handles it). Yes for Phase 3+ if abused.

2. **Q:** Should we validate PlantUML syntax?
   **A:** No for Phase 1 (let plantuml.com handle errors). Yes for Phase 3 (validation tool).

3. **Q:** What about PNG output?
   **A:** SVG only in Phase 1 (simpler). PNG in Phase 3 (multiple formats).

4. **Q:** Do we need API keys?
   **A:** No for Phase 1 (public API). Yes for Phase 4 if abuse occurs.

5. **Q:** How do we handle session tracking?
   **A:** Not in Phase 1 (stateless). Use sessionId in Phase 2 (KV storage).

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Free tier exhausted | Medium | High | Monitor usage; upgrade to Pro if needed |
| Slow response times | Low | Medium | Optimize algorithm; consider edge caching |
| URL encoding changes | Low | High | Pin algorithm version; add validation |
| PlantUML.com downtime | Medium | Medium | Document dependency; consider alternative |
| Abuse/bot traffic | Low | Medium | Add rate limiting in Phase 2 |

## Success Metrics

### Usage Metrics
- Number of invocations per month
- Error rate (<1% target)
- Average response time (<300ms)
- Tools used (encodePlantUML vs future tools)

### Quality Metrics
- URL validity (100% of URLs work)
- Error rate by code (aim for <0.5%)
- Uptime (target >99%)

### User Satisfaction
- Successful diagram renders
- Agent integration ease
- Documentation clarity

## Dependencies

### Internal
- cto Planning Agent (primary user)
- Claude (secondary user)
- doublebuf project (use case)

### External
- PlantUML.com (diagram rendering)
- Netlify (hosting platform)
- zlib (compression library)

## Timeline

### Phase 1: Core
- **Duration:** 1 week
- **Effort:** ~10 hours
- **Deliverables:**
  - Tool discovery endpoint
  - PlantUML encoder
  - Documentation

### Phase 2: History
- **Duration:** 1 week
- **Effort:** ~6 hours
- **Deliverables:**
  - KV storage
  - History endpoints

### Phase 3: Expansion
- **Duration:** 2 weeks
- **Effort:** ~10 hours
- **Deliverables:**
  - Multiple tools
  - Multiple formats
  - Templates

### Phase 4: Full MCP
- **Duration:** 2 weeks
- **Effort:** ~15 hours
- **Deliverables:**
  - JSON-RPC 2.0
  - SSE streaming
  - Resource management

## Approval

- **Product Owner:** [User]
- **Technical Lead:** [User]
- **Date:** 2025-01-03
- **Status:** Approved for Phase 1
