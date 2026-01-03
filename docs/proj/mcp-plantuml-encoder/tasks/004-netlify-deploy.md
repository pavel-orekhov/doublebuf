# Task 004: Netlify Deploy

**Status:** 🔄 In Progress
**Effort:** ~2 hours
**Priority:** High
**Dependencies:** Task 001, 002, 003

---

## Objective

Deploy service to Netlify free tier and verify all functionality in production.

---

## Requirements

### Functional Requirements
1. Deploy to Netlify free tier
2. Configure routing for new API endpoints
3. Test tool discovery in production
4. Test tool invocation in production
5. Test error handling in production
6. Verify CORS works from external origins

### Non-Functional Requirements
1. Response time <500ms (cold start)
2. Response time <100ms (warm start, p50)
3. Uptime >99%
4. SSL/TLS enabled (automatic with Netlify)

### Configuration Requirements
- **Base URL:** `https://webodar.netlify.app`
- **Endpoints:**
  - `GET /api/tools`
  - `POST /api/tools/encodePlantUML`
- **Legacy endpoints** (maintained for backward compatibility):
  - `POST /mcp/v1/encode-plantuml`

---

## Implementation Details

### Netlify.toml Configuration
```toml
[functions]
  node_bundler = "esbuild"

# MCP-compatible API routes
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

# Legacy routes for backward compatibility
[[redirects]]
  from = "/mcp/v1/encode-plantuml"
  to = "/.netlify/functions/encode-plantuml"
  status = 200
  force = true

[[redirects]]
  from = "/mcp/*"
  to = "/.netlify/functions/:splat"
  status = 200
  force = true
```

### Function Files
```
netlify/functions/
├── tools-discovery.js    # GET /api/tools
├── tools-call.js         # POST /api/tools/*
└── encode-plantuml.js    # Legacy endpoint
```

---

## Deployment Steps

### 1. Prepare Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Implement HTTP MCP-compatible PlantUML encoder"
git push origin webodar-plantuml-encoder
```

### 2. Connect to Netlify
```bash
# Install Netlify CLI (if not installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init
```

**Prompts:**
- "What would you like to do?" → Create & deploy a manually configured site
- "Team:" → Select your team
- "Site name:" → `webodar` (or choose custom)
- "Site directory:" → `.` (root)

### 3. Configure Build Settings
```bash
# Configure build settings (if needed)
netlify build
```

**Build command:** None (static functions)
**Publish directory:** `.` (root)

### 4. Deploy to Production
```bash
# Deploy
netlify deploy --prod
```

**Output:**
```
Deploying to main site URL...
Site URL:       https://webodar.netlify.app
```

### 5. Verify Deployment
```bash
# Test tool discovery
curl https://webodar.netlify.app/api/tools

# Test encoding
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":"@startuml\nA --> B\n@enduml"}'
```

---

## Testing Plan

### Manual Testing (Production)

#### Test 1: Tool Discovery
```bash
curl -X GET https://webodar.netlify.app/api/tools \
  -H "Accept: application/json" \
  -w "\nResponse Time: %{time_total}s\n"
```

**Expected Result:**
- Status: 200 OK
- `tools` array present
- `encodePlantUML` tool listed
- Response time <500ms

#### Test 2: Valid Encoding
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":"@startuml\nA --> B\n@enduml"}' \
  -w "\nResponse Time: %{time_total}s\n"
```

**Expected Result:**
- Status: 200 OK
- `success: true`
- Valid URL returned
- URL renders diagram correctly
- Response time <500ms

#### Test 3: Empty Code
```bash
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":""}'
```

**Expected Result:**
- Status: 400 Bad Request
- `error.code: "EMPTY_CODE"`

#### Test 4: Oversized Code
```bash
# Create 51KB file
dd if=/dev/zero bs=1024 count=51 | tr '\0' 'A' | tr -d '\n' > large.txt
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d "{\"plantumlCode\":\"$(cat large.txt)\"}"
```

**Expected Result:**
- Status: 413 Payload Too Large
- `error.code: "CODE_TOO_LARGE"`

#### Test 5: CORS Test
```bash
curl -X OPTIONS https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Expected Result:**
- Status: 200 OK
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`

#### Test 6: Cold Start Test
```bash
# Wait 10 minutes (for function to go cold)
sleep 600

# Measure cold start time
curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":"@startuml\nA --> B\n@enduml"}' \
  -w "\nResponse Time: %{time_total}s\n"
```

**Expected Result:**
- Status: 200 OK
- Response time: 300-500ms (cold start)

#### Test 7: Warm Start Test
```bash
# Make 10 requests quickly
for i in {1..10}; do
  curl -X POST https://webodar.netlify.app/api/tools/encodePlantUML \
    -H "Content-Type: application/json" \
    -d '{"plantumlCode":"@startuml\nA --> B\n@enduml"}' \
    -w " %{time_total}s"
  echo
done
```

**Expected Result:**
- All succeed
- Response times: 10-100ms (warm)

#### Test 8: Legacy Endpoint
```bash
curl -X POST https://webodar.netlify.app/mcp/v1/encode-plantuml \
  -H "Content-Type: application/json" \
  -d '{"plantumlCode":"@startuml\nA --> B\n@enduml"}'
```

**Expected Result:**
- Status: 200 OK
- Valid URL returned
- Backward compatibility maintained

---

## Acceptance Criteria

- ⏳ Service deployed to `https://webodar.netlify.app`
- ⏳ `GET /api/tools` returns tool list
- ⏳ `POST /api/tools/encodePlantUML` encodes correctly
- ⏳ URLs render correctly on plantuml.com
- ⏳ Error handling works (empty, oversized code)
- ⏳ CORS headers present
- ⏳ Cold start <500ms
- ⏳ Warm start <100ms
- ⏳ Legacy endpoint still works
- ⏳ SSL/TLS enabled

---

## Implementation Notes

### Free Tier Limits
- **Invocations:** 125,000/month
- **Execution time:** 10s max
- **Memory:** 1GB max
- **Bandwidth:** 100GB/month

### Monitoring
- View logs: Netlify dashboard → Functions
- Monitor usage: Netlify dashboard → Usage
- Set up alerts (optional)

### Troubleshooting

#### Deployment Fails
```bash
# Check for errors
netlify status
netlify logs --functions

# Redeploy
netlify deploy --prod
```

#### Function Not Found
- Check `netlify.toml` configuration
- Verify function files exist in `netlify/functions/`
- Check function names match configuration

#### CORS Errors
- Verify `Access-Control-Allow-Origin: *` header
- Check `OPTIONS` request handling
- Test with `-H "Origin: https://example.com"`

---

## Dependencies

### External
- Netlify account (free)
- Netlify CLI
- Git repository

### Internal
- Task 001 (Tool Discovery)
- Task 002 (Tool Call)
- Task 003 (Error Handling)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cold start latency | Medium | Medium | Document expected times, accept trade-off |
| Free tier exhaustion | Low | High | Monitor usage, upgrade if needed |
| Deployment issues | Low | Medium | Test locally first, use rollback |
| CORS issues | Low | High | Test from multiple origins |

---

## Success Metrics

- Deployment success: 100%
- Uptime: >99%
- Response time (p95): <500ms
- Response time (p50): <100ms
- Error rate: <1%
- Integration test: Pass

---

## Known Issues

None

---

## Post-Deployment

### Immediate
- [ ] Test with cURL from local machine
- [ ] Test with Claude in conversation
- [ ] Test with cto Planning Agent
- [ ] Verify CORS from browser
- [ ] Check Netlify logs for errors

### Short-term (Week 1)
- [ ] Monitor usage daily
- [ ] Check error logs
- [ ] Gather feedback from users
- [ ] Document any issues

### Long-term (Month 1)
- [ ] Analyze usage patterns
- [ ] Monitor free tier exhaustion
- [ ] Plan Phase 2 if needed
- [ ] Consider upgrade to Pro

---

## Rollback Plan

If issues occur:
```bash
# Rollback to previous deployment
netlify deploy --prod --dir=previous-build

# Or revert Git commit
git revert HEAD
git push
netlify deploy --prod
```

---

## References

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [netlify.toml Reference](https://docs.netlify.com/configure-builds/file-based-configuration/)
- [Free Tier Limits](https://www.netlify.com/pricing)

---

**Last Updated:** 2025-01-03
**Status:** In Progress 🔄
