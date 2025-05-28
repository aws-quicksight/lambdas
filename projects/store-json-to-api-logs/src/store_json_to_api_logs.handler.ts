import { type APIGatewayProxyHandler } from 'aws-lambda';
import { executeSP } from './actions/execute_sp_api_logs.js';
import { storeApiLog } from './actions/store_api_log.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = (event.httpMethod ? JSON.parse(event.body ?? '{}') : event) as {
      entry: object;
      response: object;
      action: string;
    };
    const uuid = await storeApiLog(body.entry, body.response, body.action);
    await executeSP(uuid, body.action);

    return {
      statusCode: 200,
      body: JSON.stringify({ uuid }),
    };
  } catch (error) {
    console.error('Error al procesar la petición', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
