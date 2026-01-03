const assert = require('assert');

// Import the functions directly for testing
const fs = require('fs');
const path = require('path');

// Mock event for testing
function createMockEvent(httpMethod, path, body = null) {
  return {
    httpMethod,
    path,
    body: body ? JSON.stringify(body) : null,
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://example.com'
    }
  };
}

// Mock context for testing
function createMockContext() {
  return {
    functionName: 'test-function',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
    memoryLimitInMB: 128,
    awsRequestId: 'test-request-id'
  };
}

// Test 1: Tool Discovery
console.log('Test 1: Tool Discovery');
const toolsDiscovery = require('../netlify/functions/tools-discovery');

toolsDiscovery.handler(createMockEvent('GET', '/api/tools'), createMockContext())
  .then(response => {
    console.log('Status:', response.statusCode);
    console.log('Body:', response.body);
    const body = JSON.parse(response.body);
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(Array.isArray(body.tools), true);
    assert.strictEqual(body.tools.length, 1);
    assert.strictEqual(body.tools[0].id, 'encodePlantUML');
    console.log('✓ Tool Discovery test passed\n');
  })
  .catch(err => {
    console.error('✗ Tool Discovery test failed:', err);
    process.exit(1);
  });

// Test 2: Valid Encoding
console.log('Test 2: Valid Encoding');
const toolsCall = require('../netlify/functions/tools-call');

const validCode = '@startuml\nA --> B\n@enduml';

toolsCall.handler(
  createMockEvent('POST', '/api/tools/encodePlantUML', { plantumlCode: validCode }),
  createMockContext()
)
  .then(response => {
    console.log('Status:', response.statusCode);
    console.log('Body:', response.body);
    const body = JSON.parse(response.body);
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(body.success, true);
    assert(body.result.url);
    assert(body.result.encoded);
    assert.strictEqual(body.result.format, 'svg');
    assert(body.result.url.startsWith('https://www.plantuml.com/plantuml/svg/'));
    console.log('✓ Valid Encoding test passed\n');
  })
  .catch(err => {
    console.error('✗ Valid Encoding test failed:', err);
    process.exit(1);
  });

// Test 3: Empty Code
console.log('Test 3: Empty Code');

toolsCall.handler(
  createMockEvent('POST', '/api/tools/encodePlantUML', { plantumlCode: '' }),
  createMockContext()
)
  .then(response => {
    console.log('Status:', response.statusCode);
    console.log('Body:', response.body);
    const body = JSON.parse(response.body);
    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'EMPTY_CODE');
    console.log('✓ Empty Code test passed\n');
  })
  .catch(err => {
    console.error('✗ Empty Code test failed:', err);
    process.exit(1);
  });

// Test 4: Null Code
console.log('Test 4: Null Code');

toolsCall.handler(
  createMockEvent('POST', '/api/tools/encodePlantUML', { plantumlCode: null }),
  createMockContext()
)
  .then(response => {
    console.log('Status:', response.statusCode);
    console.log('Body:', response.body);
    const body = JSON.parse(response.body);
    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'EMPTY_CODE');
    console.log('✓ Null Code test passed\n');
  })
  .catch(err => {
    console.error('✗ Null Code test failed:', err);
    process.exit(1);
  });

// Test 5: Whitespace Only
console.log('Test 5: Whitespace Only');

toolsCall.handler(
  createMockEvent('POST', '/api/tools/encodePlantUML', { plantumlCode: '   \n\t  ' }),
  createMockContext()
)
  .then(response => {
    console.log('Status:', response.statusCode);
    console.log('Body:', response.body);
    const body = JSON.parse(response.body);
    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'EMPTY_CODE');
    console.log('✓ Whitespace Only test passed\n');
  })
  .catch(err => {
    console.error('✗ Whitespace Only test failed:', err);
    process.exit(1);
  });

// Test 6: Unknown Tool
console.log('Test 6: Unknown Tool');

toolsCall.handler(
  createMockEvent('POST', '/api/tools/unknownTool', {}),
  createMockContext()
)
  .then(response => {
    console.log('Status:', response.statusCode);
    console.log('Body:', response.body);
    const body = JSON.parse(response.body);
    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'TOOL_NOT_FOUND');
    console.log('✓ Unknown Tool test passed\n');
  })
  .catch(err => {
    console.error('✗ Unknown Tool test failed:', err);
    process.exit(1);
  });

// Test 7: Deterministic Encoding
console.log('Test 7: Deterministic Encoding');

const code1 = '@startuml\nA --> B\n@enduml';
const code2 = '@startuml\nA --> B\n@enduml';

Promise.all([
  toolsCall.handler(
    createMockEvent('POST', '/api/tools/encodePlantUML', { plantumlCode: code1 }),
    createMockContext()
  ),
  toolsCall.handler(
    createMockEvent('POST', '/api/tools/encodePlantUML', { plantumlCode: code2 }),
    createMockContext()
  )
])
  .then(([response1, response2]) => {
    const body1 = JSON.parse(response1.body);
    const body2 = JSON.parse(response2.body);
    assert.strictEqual(body1.result.encoded, body2.result.encoded);
    assert.strictEqual(body1.result.url, body2.result.url);
    console.log('✓ Deterministic Encoding test passed\n');
  })
  .catch(err => {
    console.error('✗ Deterministic Encoding test failed:', err);
    process.exit(1);
  });

// Wait for all tests to complete
setTimeout(() => {
  console.log('\n✓ All tests passed!');
}, 1000);
