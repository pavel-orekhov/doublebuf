const { handler } = require('../netlify/functions/encode-plantuml');

const mockContext = {};

async function testEncoding() {
  console.log('Testing PlantUML Encoding Example from Ticket...\n');

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

  const event = {
    httpMethod: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plantumlCode })
  };

  const response = await handler(event, mockContext);
  const body = JSON.parse(response.body);

  console.log('Response Status:', response.statusCode);
  console.log('Response Body:', JSON.stringify(body, null, 2));
  console.log('\nOpening URL (copy to browser):');
  console.log(body.url);
  
  return body;
}

testEncoding().catch(console.error);
