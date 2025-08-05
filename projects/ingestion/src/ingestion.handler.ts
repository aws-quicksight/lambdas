import {
  CreateIngestionCommand,
  type CreateIngestionCommandInput,
  DescribeIngestionCommand,
  type DescribeIngestionCommandInput,
  IngestionType,
  QuickSightClient,
} from '@aws-sdk/client-quicksight';
import { StoreJsonToBiMasterApiLogsClient } from '@quicksight/lambda-calls';
import { errors } from '@vinejs/vine';
import { type APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { env } from './config/env.js';
import { type IngestionSchema, ingestionValidator } from './validators/ingestion.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = event.httpMethod ? JSON.parse(event.body ?? '{}') : event;
  let payload: IngestionSchema;
  try {
    payload = await ingestionValidator.validate(body);
  } catch (error) {
    if (error instanceof errors.E_VALIDATION_ERROR) {
      return {
        statusCode: 422,
        body: JSON.stringify(error.messages),
      };
    }

    return {
      statusCode: 422,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }

  const storeJsonToBiMasterApiLogsClient = new StoreJsonToBiMasterApiLogsClient();
  try {
    // here make call to quicksight
    const client = new QuickSightClient({
      credentials: {
        accessKeyId: env.AWS_CUSTOM_KEY,
        secretAccessKey: env.AWS_CUSTOM_SECRET,
      },
    });
    let input: CreateIngestionCommandInput | DescribeIngestionCommandInput;
    if (payload.action === 'create-ingestion') {
      input = {
        DataSetId: payload.dataSetId, // required
        IngestionId: payload.ingestionId ?? uuidv4(), // required
        AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID, // required
        IngestionType: IngestionType.FULL_REFRESH, // required
      };
      const commandCreate = new CreateIngestionCommand(input);
      const responseCreate = await client.send(commandCreate);
      await storeJsonToBiMasterApiLogsClient.store(payload, responseCreate, payload.action);

      return {
        statusCode: 200,
        body: JSON.stringify(responseCreate),
      };
    }
    input = {
      // DescribeIngestionRequest
      AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID, // required
      DataSetId: payload.dataSetId, // required
      IngestionId: payload.ingestionId!, // required
    };
    const commandDescribe = new DescribeIngestionCommand(input);
    const responseDescribe = await client.send(commandDescribe);
    await storeJsonToBiMasterApiLogsClient.store(payload, responseDescribe, payload.action);

    return {
      statusCode: 200,
      body: JSON.stringify(responseDescribe),
    };
  } catch (error) {
    console.error(error);
    if (
      error instanceof ReferenceError ||
      error instanceof TypeError ||
      error instanceof SyntaxError ||
      error instanceof Error
    ) {
      const response = { errmsg: error.stack ?? error };
      await storeJsonToBiMasterApiLogsClient.store(payload, response, payload.action);
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
