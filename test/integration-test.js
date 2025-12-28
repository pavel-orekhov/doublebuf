const { handler } = require('../netlify/functions/encode-plantuml');

const mockContext = {};

async function runIntegrationTests() {
  console.log('=== MCP PlantUML Encoder - Integration Tests ===\n');

  let passed = 0;
  let failed = 0;

  const tests = [
    {
      name: 'Test 1: Lock-Free Double Buffer Diagram',
      code: `@startuml
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
@enduml`
    },
    {
      name: 'Test 2: Simple FSM',
      code: `@startuml
[*] --> Writing
Writing --> Swapping: CAS
Swapping --> Reading
Reading --> [*]
@enduml`
    },
    {
      name: 'Test 3: Sequence Diagram',
      code: `@startuml
Alice -> Bob: hello
Bob -> Alice: hi
@enduml`
    },
    {
      name: 'Test 4: Class Diagram',
      code: `@startuml
class Buffer {
  +data: void*
  +size: size_t
}
@enduml`
    }
  ];

  for (const test of tests) {
    try {
      const event = {
        httpMethod: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantumlCode: test.code })
      };

      const response = await handler(event, mockContext);
      const body = JSON.parse(response.body);

      if (response.statusCode === 200 && 
          body.status === 'success' && 
          body.url && 
          body.url.startsWith('https://www.plantuml.com/plantuml/svg/')) {
        console.log(`✓ ${test.name}`);
        console.log(`  URL: ${body.url.substring(0, 70)}...`);
        console.log(`  Encoded length: ${body.encoded.length} chars\n`);
        passed++;
      } else {
        console.log(`✗ ${test.name}`);
        console.log(`  Unexpected response: ${JSON.stringify(body)}\n`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${test.name}`);
      console.log(`  Error: ${error.message}\n`);
      failed++;
    }
  }

  const errorTests = [
    {
      name: 'Test 5: Empty code',
      code: '',
      expectedStatus: 400,
      expectedCode: 'EMPTY_CODE'
    },
    {
      name: 'Test 6: Null code',
      code: null,
      expectedStatus: 400,
      expectedCode: 'EMPTY_CODE'
    },
    {
      name: 'Test 7: Large code (>50KB)',
      code: '@startuml\n' + 'A --> B\n'.repeat(20000) + '\n@enduml',
      expectedStatus: 413,
      expectedCode: 'CODE_TOO_LARGE'
    }
  ];

  for (const test of errorTests) {
    try {
      const event = {
        httpMethod: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantumlCode: test.code })
      };

      const response = await handler(event, mockContext);
      const body = JSON.parse(response.body);

      if (response.statusCode === test.expectedStatus && 
          body.code === test.expectedCode) {
        console.log(`✓ ${test.name}`);
        console.log(`  Status: ${response.statusCode}, Code: ${body.code}\n`);
        passed++;
      } else {
        console.log(`✗ ${test.name}`);
        console.log(`  Expected: ${test.expectedStatus}/${test.expectedCode}`);
        console.log(`  Got: ${response.statusCode}/${body.code}\n`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${test.name}`);
      console.log(`  Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log('=== Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n✓ All integration tests passed!');
  } else {
    console.log('\n✗ Some tests failed.');
    process.exit(1);
  }
}

runIntegrationTests().catch(console.error);
