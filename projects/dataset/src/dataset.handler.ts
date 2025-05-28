import {
  CreateDataSetCommand,
  type CreateDataSetCommandInput,
  DeleteDataSetCommand,
  DescribeDataSetCommand,
  QuickSightClient,
} from '@aws-sdk/client-quicksight';
import {
  StoreJsonToBiMasterApiLogsClient,
} from '@quicksight/lambda-calls';
import { type APIGatewayProxyHandler } from 'aws-lambda';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import {
  checkAwsQuickSightAssetsExists,
  storeAwsQuickSightAssets,
  updateAwsQuickSightAssets,
  updateDeleteAwsQuickSightAssets,
} from './actions/aws_quicksight_assets.js';
import jsonSetValueByPath from './actions/json_set_value_by_path.js';
import jsonStringReplace from './actions/json_string_replace.js';
import { getObjectFromS3, putObjectToS3 } from './actions/s3_quicksight.js';
import { env } from './config/env.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = (event.httpMethod ? JSON.parse(event.body ?? '{}') : event) as {
    serviceId: string;
    action: string;
    dataSetId?: string;
    create?: {
      object: string;
      replace_text?: { find: string; replace: string }[];
      replace_key_value?: { path: string; value: string }[];
    };
  };

  if (!body.action || body.action === '') {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: 'El campo action es obligatorio' }),
    };
  }

  // Validamos que la acción sea una de las válidas
  if (!['create', 'describe', 'delete'].includes(body.action)) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: 'La acción debe ser create, describe o delete' }),
    };
  }

  // Validamos basado en la acción que se esté realizando
  if (body.action === 'create') {
    if (!body.create?.object) {
      return {
        statusCode: 422,
        body: JSON.stringify({ error: 'El campo create.object es obligatorio' }),
      };
    }
  } else {
    if (!body.dataSetId) {
      return {
        statusCode: 422,
        body: JSON.stringify({ error: 'El campo dataSetId es obligatorio' }),
      };
    }
  }

  const { action, create, dataSetId } = body;
  const actions = {
    create: 'quicksight-create-dataset',
    describe: 'quicksight-describe-dataset',
    delete: 'quicksight-delete-dataset',
  };
  const actionMessage = actions[action as keyof typeof actions];

  const storeJsonToBiMasterApiLogsClient = new StoreJsonToBiMasterApiLogsClient();
  try {
    // cliente de quicksight
    const clientQuickSight = new QuickSightClient({
      credentials: {
        accessKeyId: env.AWS_CUSTOM_KEY,
        secretAccessKey: env.AWS_CUSTOM_SECRET,
      },
    });

    if (action === 'create') {
      // Action create
      const { object, replace_text, replace_key_value } = create!;
      const replaceTextArray = replace_text ?? [];
      const replaceKeyValueArray = replace_key_value ?? [];

      const bodyS3 = await getObjectFromS3(object, env.BUCKET_NAME);
      let json = await bodyS3.transformToString();

      for (const replaceSearch of replaceTextArray) {
        json = jsonStringReplace(json, replaceSearch.find, replaceSearch.replace);
      }

      const jsonDataSet: CreateDataSetCommandInput = JSON.parse(json);
      jsonDataSet.DataSetId = uuidv4();
      jsonDataSet.AwsAccountId = env.AWS_CUSTOM_ACCOUNT_ID;

      for (const replaceKeyValue of replaceKeyValueArray) {
        jsonSetValueByPath(
          jsonDataSet as unknown as Record<string, unknown>,
          replaceKeyValue.path,
          replaceKeyValue.value,
        );
      }

      if (jsonDataSet.DatasetParameters && Array.isArray(jsonDataSet.DatasetParameters)) {
        for (const datasetParameter of jsonDataSet.DatasetParameters) {
          if (datasetParameter.DateTimeDatasetParameter) {
            const dateTimeDatasetParameter = datasetParameter.DateTimeDatasetParameter;
            if (
              dateTimeDatasetParameter.DefaultValues?.StaticValues &&
              Array.isArray(dateTimeDatasetParameter.DefaultValues.StaticValues)
            ) {
              for (const [index, staticValue] of dateTimeDatasetParameter.DefaultValues.StaticValues.entries()) {
                dateTimeDatasetParameter.DefaultValues.StaticValues[index] = new Date(staticValue);
              }
            }
          }
        }
      }

      const createCommand = new CreateDataSetCommand(jsonDataSet);
      const responseCreate = await clientQuickSight.send(createCommand);
      await storeJsonToBiMasterApiLogsClient.store(body, responseCreate, actionMessage);

      let awsQuickSightAssetsId: number | null = null;
      try {
        awsQuickSightAssetsId = await checkAwsQuickSightAssetsExists(
          responseCreate.DataSetId!,
          env.AWS_CUSTOM_ACCOUNT_ID,
          env.AWS_CUSTOM_REGION,
        );
      } catch (error) {
        console.error(error);

        return {
          statusCode: 200,
          body: JSON.stringify({
            message:
              'No se pudo obtener la información de awsQuickSightAssets db pero se ha creado el dataset en QuickSight',
            dataSetId: responseCreate.DataSetId,
            result: responseCreate,
          }),
        };
      }

      const values = {
        assetId: responseCreate.DataSetId!,
        name: jsonDataSet.Name!,
        awsAccountId: env.AWS_CUSTOM_ACCOUNT_ID,
        region: env.AWS_CUSTOM_REGION,
      };

      await (awsQuickSightAssetsId
        ? updateAwsQuickSightAssets(awsQuickSightAssetsId, values)
        : storeAwsQuickSightAssets(values));

      return {
        statusCode: 200,
        body: JSON.stringify(responseCreate),
      };
    }

    if (action === 'describe') {
      // Action describe
      const describeCommand = new DescribeDataSetCommand({
        AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID, // required
        DataSetId: dataSetId!, // required
      });
      const responseDescribe = await clientQuickSight.send(describeCommand);
      await storeJsonToBiMasterApiLogsClient.store(body, responseDescribe, actionMessage);

      const dataset = responseDescribe.DataSet;
      if (dataset) {
        try {
          const directory = DateTime.utc().toFormat('yyyy-MM-dd');
          const isoDate = DateTime.utc().toISO();
          const fileName = `${directory}/${dataset.Name}-${isoDate}.json`;
          await putObjectToS3(fileName, JSON.stringify(dataset), env.BACKUP_BUCKET_NAME);
        } catch (error) {
          console.error(error);
        }
      } else {
        console.error(`No se pudo obtener el dataset ${dataSetId} y no se ha guardado en el backup`);
      }

      return {
        statusCode: 200,
        body: JSON.stringify(responseDescribe),
      };
    }

    // Action delete
    const deleteCommand = new DeleteDataSetCommand({
      AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID, // required
      DataSetId: dataSetId!, // required
    });
    const responseDelete = await clientQuickSight.send(deleteCommand);
    await storeJsonToBiMasterApiLogsClient.store(body, responseDelete, actionMessage);
    await updateDeleteAwsQuickSightAssets(dataSetId!, env.AWS_CUSTOM_ACCOUNT_ID, env.AWS_CUSTOM_REGION);

    return {
      statusCode: 200,
      body: JSON.stringify(responseDelete),
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
