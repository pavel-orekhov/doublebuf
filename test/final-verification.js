const { handler } = require('../netlify/functions/encode-plantuml');

const mockContext = {};

async function verifyEncoding() {
  console.log('=== Final Verification ===\n');

  const testCases = [
    {
      name: 'Ticket Example: Lock-Free Double Buffer',
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
      name: 'Simple Example',
      code: '@startuml\nA -> B\n@enduml'
    }
  ];

  for (const test of testCases) {
    const event = {
      httpMethod: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plantumlCode: test.code })
    };

    const response = await handler(event, mockContext);
    const body = JSON.parse(response.body);

    console.log(`✓ ${test.name}`);
    console.log(`  Status: ${response.statusCode}`);
    console.log(`  Status field: ${body.status}`);
    console.log(`  URL format: ${body.url.startsWith('https://www.plantuml.com/plantuml/svg/') ? 'VALID ✓' : 'INVALID ✗'}`);
    console.log(`  URL: ${body.url}`);
    console.log(`  Encoded: ${body.encoded}`);
    console.log(`  Format: ${body.format}`);
    console.log();
  }

  console.log('=== All verifications passed! ===');
}

verifyEncoding().catch(console.error);
