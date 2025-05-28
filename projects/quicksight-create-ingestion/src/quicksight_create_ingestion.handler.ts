import {
  CreateIngestionCommand,
  DescribeIngestionCommand,
  IngestionType,
  QuickSightClient,
} from '@aws-sdk/client-quicksight';
import { StoreJsonToBiMasterApiLogsClient } from '@quicksight/lambda-calls';
import { type APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { env } from './config/env.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = (event.httpMethod ? JSON.parse(event.body ?? '{}') : event) as {
    dataSetId: string;
    serviceId: string;
    action?: string;
    ingestionId?: string;
  };
  const actions = {
    create: 'quicksight-create-ingestion',
    describe: 'quicksight-describe-ingestion',
  };
  const { dataSetId } = body;
  const action = body.action ?? 'describe';
  const actionMessage = action === 'create' ? actions.create : actions.describe;
  const ingestionId = body.ingestionId ?? uuidv4();
  const awsConfig = {
    key: env.AWS_CUSTOM_KEY,
    secret: env.AWS_CUSTOM_SECRET,
    region: env.AWS_CUSTOM_REGION,
    awsAccountId: env.AWS_CUSTOM_ACCOUNT_ID,
  };
  const storeJsonToBiMasterApiLogsClient = new StoreJsonToBiMasterApiLogsClient();
  try {
    // here make call to quicksight
    const client = new QuickSightClient({
      credentials: {
        accessKeyId: awsConfig.key,
        secretAccessKey: awsConfig.secret,
      },
    });

    if (action === 'create') {
      const input = {
        DataSetId: dataSetId as unknown as string, // required
        IngestionId: ingestionId as unknown as string, // required
        AwsAccountId: awsConfig.awsAccountId as unknown as string, // required
        IngestionType: IngestionType.FULL_REFRESH, // required
      };
      const command = new CreateIngestionCommand(input);
      const response = await client.send(command);
      await storeJsonToBiMasterApiLogsClient.store(body, response, actionMessage);

      return {
        statusCode: 200,
        body: JSON.stringify(response),
      };
    }
    if (action === 'describe') {
      const input = {
        // DescribeIngestionRequest
        AwsAccountId: awsConfig.awsAccountId, // required
        DataSetId: dataSetId, // required
        IngestionId: ingestionId, // required
      };
      const command = new DescribeIngestionCommand(input);
      const response = await client.send(command);
      await storeJsonToBiMasterApiLogsClient.store(body, response, actionMessage);

      return {
        statusCode: 200,
        body: JSON.stringify(response),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Send create or describe as action.' }),
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
      await storeJsonToBiMasterApiLogsClient.store(body, response, actionMessage);
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
