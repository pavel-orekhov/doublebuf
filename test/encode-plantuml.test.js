const { handler } = require('../netlify/functions/encode-plantuml');

function mockEvent(body, method = 'POST') {
  return {
    httpMethod: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

const mockContext = {};

async function test(name, testFn) {
  try {
    await testFn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    process.exit(1);
  }
}

async function assertEquals(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message}\n  Expected: ${expectedStr}\n  Actual: ${actualStr}`);
  }
}

async function assertStatusCode(response, expected, message) {
  if (response.statusCode !== expected) {
    throw new Error(`${message}\n  Expected status: ${expected}\n  Actual: ${response.statusCode}`);
  }
}

(async () => {
  console.log('Running PlantUML Encoder Tests...\n');

  await test('Scenario 1: Valid PlantUML diagram encoding', async () => {
    const plantumlCode = `@startuml
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
@enduml`;

    const response = await handler(mockEvent({ plantumlCode }), mockContext);
    const body = JSON.parse(response.body);

    await assertStatusCode(response, 200, 'Should return 200 status');
    await assertEquals(body.status, 'success', 'Should have success status');
    
    if (!body.url || !body.url.startsWith('https://www.plantuml.com/plantuml/svg/')) {
      throw new Error('URL should start with https://www.plantuml.com/plantuml/svg/');
    }
    
    if (!body.encoded || body.encoded.length === 0) {
      throw new Error('encoded field should not be empty');
    }
    
    await assertEquals(body.format, 'svg', 'Format should be svg');
  });

  await test('Scenario 2: Empty code returns 400 error', async () => {
    const response = await handler(mockEvent({ plantumlCode: '' }), mockContext);
    const body = JSON.parse(response.body);

    await assertStatusCode(response, 400, 'Should return 400 status');
    await assertEquals(body.status, 'error', 'Should have error status');
    await assertEquals(body.code, 'EMPTY_CODE', 'Should have EMPTY_CODE code');
    
    if (!body.message || body.message.length === 0) {
      throw new Error('Error message should not be empty');
    }
  });

  await test('Scenario 3: Null/undefined code returns 400 error', async () => {
    let response = await handler(mockEvent({ plantumlCode: null }), mockContext);
    let body = JSON.parse(response.body);

    await assertStatusCode(response, 400, 'Should return 400 status for null');
    await assertEquals(body.code, 'EMPTY_CODE', 'Should have EMPTY_CODE code for null');

    response = await handler(mockEvent({}), mockContext);
    body = JSON.parse(response.body);

    await assertStatusCode(response, 400, 'Should return 400 status for undefined');
    await assertEquals(body.code, 'EMPTY_CODE', 'Should have EMPTY_CODE code for undefined');
  });

  await test('Scenario 4: Whitespace-only code returns 400 error', async () => {
    const response = await handler(mockEvent({ plantumlCode: '   \n\t  ' }), mockContext);
    const body = JSON.parse(response.body);

    await assertStatusCode(response, 400, 'Should return 400 status');
    await assertEquals(body.code, 'EMPTY_CODE', 'Should have EMPTY_CODE code');
  });

  await test('Scenario 5: Code larger than 50KB returns 413 error', async () => {
    const largeCode = '@startuml\n' + 'A --> B\n'.repeat(20000) + '\n@enduml';
    const response = await handler(mockEvent({ plantumlCode: largeCode }), mockContext);
    const body = JSON.parse(response.body);

    await assertStatusCode(response, 413, 'Should return 413 status');
    await assertEquals(body.code, 'CODE_TOO_LARGE', 'Should have CODE_TOO_LARGE code');
  });

  await test('Scenario 6: Exactly 50KB code should succeed', async () => {
    const code = '@startuml\nA --> B\n@enduml';
    const padding = ' '.repeat(50 * 1024 - Buffer.byteLength(code, 'utf8'));
    const validLargeCode = code + padding;
    
    const response = await handler(mockEvent({ plantumlCode: validLargeCode }), mockContext);
    const body = JSON.parse(response.body);

    await assertStatusCode(response, 200, 'Should return 200 status');
    await assertEquals(body.status, 'success', 'Should have success status');
  });

  await test('Scenario 7: Simple FSM diagram encoding', async () => {
    const plantumlCode = `@startuml
[*] --> Writing
Writing --> Swapping: CAS
Swapping --> Reading
Reading --> [*]
@enduml`;

    const response = await handler(mockEvent({ plantumlCode }), mockContext);
    const body = JSON.parse(response.body);

    await assertStatusCode(response, 200, 'Should return 200 status');
    await assertEquals(body.status, 'success', 'Should have success status');
    
    if (!body.url || !body.url.startsWith('https://www.plantuml.com/plantuml/svg/')) {
      throw new Error('URL should be valid PlantUML URL');
    }
  });

  await test('Scenario 8: Deterministic encoding - same code produces same URL', async () => {
    const plantumlCode = `@startuml
actor A
rectangle B
A --> B
@enduml`;

    const response1 = await handler(mockEvent({ plantumlCode }), mockContext);
    const body1 = JSON.parse(response1.body);

    const response2 = await handler(mockEvent({ plantumlCode }), mockContext);
    const body2 = JSON.parse(response2.body);

    await assertEquals(body1.url, body2.url, 'Same code should produce same URL');
    await assertEquals(body1.encoded, body2.encoded, 'Same code should produce same encoded string');
  });

  await test('Scenario 9: OPTIONS request returns 200', async () => {
    const response = await handler({ httpMethod: 'OPTIONS', headers: {} }, mockContext);
    await assertStatusCode(response, 200, 'OPTIONS should return 200');
    await assertEquals(response.body, '', 'OPTIONS should have empty body');
  });

  await test('Scenario 10: Non-POST request returns 405', async () => {
    const response = await handler({ httpMethod: 'GET', headers: {} }, mockContext);
    const body = JSON.parse(response.body);

    await assertStatusCode(response, 405, 'GET should return 405');
    await assertEquals(body.code, 'METHOD_NOT_ALLOWED', 'Should have METHOD_NOT_ALLOWED code');
  });

  await test('Scenario 11: CORS headers are present', async () => {
    const plantumlCode = '@startuml\nA --> B\n@enduml';
    const response = await handler(mockEvent({ plantumlCode }), mockContext);

    if (!response.headers['Access-Control-Allow-Origin']) {
      throw new Error('CORS header Access-Control-Allow-Origin should be present');
    }
    
    if (!response.headers['Access-Control-Allow-Headers']) {
      throw new Error('CORS header Access-Control-Allow-Headers should be present');
    }
    
    if (!response.headers['Access-Control-Allow-Methods']) {
      throw new Error('CORS header Access-Control-Allow-Methods should be present');
    }
  });

  console.log('\n✓ All tests passed!');
})();
