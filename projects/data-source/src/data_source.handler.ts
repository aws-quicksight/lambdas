import {
  DescribeDataSourceCommand,
  DescribeDataSourcePermissionsCommand,
  QuickSightClient,
} from '@aws-sdk/client-quicksight';
import { StoreJsonToBiMasterApiLogsClient } from '@quicksight/lambda-calls';
import { errors } from '@vinejs/vine';
import { type APIGatewayProxyHandler } from 'aws-lambda';
import { env } from './config/env.js';
import { type DataSourceSchema, dataSourceValidator } from './validators/data_source.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = event.httpMethod ? JSON.parse(event.body ?? '{}') : event;
  let payload: DataSourceSchema;
  try {
    payload = await dataSourceValidator.validate(body);
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

  const { action, dataSourceId } = payload;
  const actions = {
    'describe-data-source': 'quicksight-describe-data-source',
    'describe-data-source-permissions': 'quicksight-describe-data-source-permissions',
  };
  const actionMessage = actions[action];

  const storeJsonToBiMasterApiLogsClient = new StoreJsonToBiMasterApiLogsClient();
  try {
    // cliente de quicksight
    const clientQuickSight = new QuickSightClient({
      credentials: {
        accessKeyId: env.AWS_CUSTOM_KEY,
        secretAccessKey: env.AWS_CUSTOM_SECRET,
      },
    });

    let responseDescribe: object;
    if (action === 'describe-data-source') {
      // Action describe
      const describeCommand = new DescribeDataSourceCommand({
        AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID, // required
        DataSourceId: dataSourceId!, // required
      });

      responseDescribe = await clientQuickSight.send(describeCommand);
      await storeJsonToBiMasterApiLogsClient.store(payload, responseDescribe, actionMessage);

      // TODO: Checar como se guarda el backup
      // const analysis = responseDescribe.Analysis;
      // if (analysis) {
      //   try {
      //     const directory = DateTime.utc().toFormat('yyyy-MM-dd');
      //     const isoDate = DateTime.utc().toISO();
      //     const fileName = `${directory}/${analysis.Name}-${isoDate}.json`;
      //     await putObjectToS3(fileName, JSON.stringify(dataset), env.BACKUP_BUCKET_NAME);
      //   } catch (error) {
      //     console.error(error);
      //   }
      // } else {
      //   console.error(`No se pudo obtener el analysis ${analysisId} y no se ha guardado en el backup`);
      // }
    }

    if (action === 'describe-data-source-permissions') {
      // Action describe
      const describeCommand = new DescribeDataSourcePermissionsCommand({
        AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID, // required
        DataSourceId: dataSourceId!, // required
      });

      responseDescribe = await clientQuickSight.send(describeCommand);
      await storeJsonToBiMasterApiLogsClient.store(payload, responseDescribe, actionMessage);

      // TODO: Checar como se guarda el backup
      // const analysis = responseDescribe.Analysis;
      // if (analysis) {
      //   try {
      //     const directory = DateTime.utc().toFormat('yyyy-MM-dd');
      //     const isoDate = DateTime.utc().toISO();
      //     const fileName = `${directory}/${analysis.Name}-${isoDate}.json`;
      //     await putObjectToS3(fileName, JSON.stringify(dataset), env.BACKUP_BUCKET_NAME);
      //   } catch (error) {
      //     console.error(error);
      //   }
      // } else {
      //   console.error(`No se pudo obtener el analysis ${analysisId} y no se ha guardado en el backup`);
      // }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(responseDescribe!),
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
      await storeJsonToBiMasterApiLogsClient.store(payload, response, actionMessage);
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
