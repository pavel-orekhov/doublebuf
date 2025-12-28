const { handler } = require('../netlify/functions/encode-plantuml');

const mockContext = {};

async function testSimpleEncoding() {
  console.log('Testing Simple PlantUML Encoding...\n');

  const plantumlCode = `@startuml
A -> B
@enduml`;

  const event = {
    httpMethod: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plantumlCode })
  };

  const response = await handler(event, mockContext);
  const body = JSON.parse(response.body);

  console.log('Status:', response.statusCode);
  console.log('URL:', body.url);
  console.log('Encoded:', body.encoded);
  console.log('\nOpening in browser:', body.url);
  
  return body;
}

testSimpleEncoding().catch(console.error);
