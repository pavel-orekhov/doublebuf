const zlib = require('zlib');

const PLANTUML_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function encodePlantUML(plantumlCode) {
  const deflated = zlib.deflateRawSync(Buffer.from(plantumlCode, 'utf8'), { level: 9 });
  const base64 = deflated.toString('base64');
  
  let encoded = '';
  for (let i = 0; i < base64.length; i++) {
    const char = base64[i];
    const index = BASE64_ALPHABET.indexOf(char);
    if (index !== -1) {
      encoded += PLANTUML_ALPHABET[index];
    }
  }
  
  return encoded;
}

function validatePlantUMLCode(plantumlCode) {
  if (!plantumlCode || typeof plantumlCode !== 'string') {
    return { valid: false, code: 'EMPTY_CODE', message: 'plantumlCode is required and cannot be empty' };
  }

  const trimmed = plantumlCode.trim();
  if (trimmed.length === 0) {
    return { valid: false, code: 'EMPTY_CODE', message: 'plantumlCode is required and cannot be empty' };
  }

  const maxSize = 50 * 1024;
  if (Buffer.byteLength(plantumlCode, 'utf8') > maxSize) {
    return { valid: false, code: 'CODE_TOO_LARGE', message: 'PlantUML code exceeds maximum size of 50KB' };
  }

  return { valid: true };
}

async function handleEncodePlantUML(plantumlCode) {
  const validation = validatePlantUMLCode(plantumlCode);
  if (!validation.valid) {
    return {
      statusCode: validation.code === 'CODE_TOO_LARGE' ? 413 : 400,
      body: {
        success: false,
        error: {
          code: validation.code,
          message: validation.message
        }
      }
    };
  }

  try {
    const encoded = encodePlantUML(plantumlCode);
    const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;

    return {
      statusCode: 200,
      body: {
        success: true,
        result: {
          url,
          encoded,
          format: 'svg'
        }
      }
    };
  } catch (error) {
    console.error('Encoding error:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: {
          code: 'ENCODING_FAILED',
          message: 'Failed to encode PlantUML code'
        }
      }
    };
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed'
        }
      })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const pathParts = event.path.split('/').filter(Boolean);
    const toolName = pathParts[pathParts.length - 1];

    if (!toolName || toolName === 'tools') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'TOOL_NAME_REQUIRED',
            message: 'Tool name is required in the path'
          }
        })
      };
    }

    let response;
    switch (toolName) {
      case 'encodePlantUML':
        response = await handleEncodePlantUML(body.plantumlCode);
        break;

      default:
        response = {
          statusCode: 404,
          body: {
            success: false,
            error: {
              code: 'TOOL_NOT_FOUND',
              message: `Tool '${toolName}' not found`
            }
          }
        };
    }

    return {
      statusCode: response.statusCode,
      headers,
      body: JSON.stringify(response.body)
    };

  } catch (error) {
    console.error('Tool call error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    };
  }
};
