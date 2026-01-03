exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only GET method is allowed'
        }
      })
    };
  }

  const tools = [
    {
      id: 'encodePlantUML',
      name: 'encodePlantUML',
      description: 'Encodes PlantUML diagram code into a shareable URL for viewing on plantuml.com',
      inputSchema: {
        type: 'object',
        properties: {
          plantumlCode: {
            type: 'string',
            description: 'Valid PlantUML diagram code (must start with @startuml and end with @enduml)'
          }
        },
        required: ['plantumlCode']
      }
    }
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ tools })
  };
};
