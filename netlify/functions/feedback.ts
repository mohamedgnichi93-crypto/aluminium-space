import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    console.log('--- AI FEEDBACK RECEIVED ---');
    console.log(JSON.stringify(data, null, 2));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok' }),
    };
  } catch (error: any) {
    return { statusCode: 500, body: error.message };
  }
};
