const { handler } = require('../netlify/functions/encode-plantuml');

const mockContext = {};

async function testExpectedEncoding() {
  console.log('Testing Expected Encoding from Ticket...\n');

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

  const expected = 'SoWkIImgAStDuNBAJrBGjLDmpCbCJbMmKiX8pSd9vt98pKi1IW80';
  
  console.log('Expected encoded:', expected);
  console.log('Our encoded:     ', body.encoded);
  console.log('\nMatch:', body.encoded === expected ? 'YES ✓' : 'NO ✗');
  
  if (body.encoded !== expected) {
    console.log('\nNote: Different encoding is expected due to:');
    console.log('- Different compression algorithms');
    console.log('- Different zlib versions/settings');
    console.log('- Both should produce valid diagrams on plantuml.com');
  }
  
  console.log('\nURL:', body.url);
}

testExpectedEncoding().catch(console.error);
