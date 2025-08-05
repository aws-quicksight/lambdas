import { DescribeUserCommand, QuickSightClient } from '@aws-sdk/client-quicksight';
import { StoreJsonToBiMasterApiLogsClient } from '@quicksight/lambda-calls';
import { errors } from '@vinejs/vine';
import { type APIGatewayProxyHandler } from 'aws-lambda';
import { env } from './config/env.js';
import { type UserSchema, userValidator } from './validators/user.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = event.httpMethod ? JSON.parse(event.body ?? '{}') : event;
  let payload: UserSchema;
  try {
    payload = await userValidator.validate(body);
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

  const { action, namespace, userName } = payload;
  const actions = {
    'describe-user': 'quicksight-describe-user',
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

    // Action describe
    const describeCommand = new DescribeUserCommand({
      AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID, // required
      UserName: userName!, // required
      Namespace: namespace!, // required
    });

    const responseDescribe = await clientQuickSight.send(describeCommand);
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
      await storeJsonToBiMasterApiLogsClient.store(payload, response, actionMessage);
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
