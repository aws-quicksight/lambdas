import {
  CreateDataSetCommand,
  type CreateDataSetCommandInput,
  DeleteDataSetCommand,
  DescribeDataSetCommand,
  DescribeDataSetPermissionsCommand,
  QuickSightClient,
} from '@aws-sdk/client-quicksight';
import { StoreJsonToBiMasterApiLogsClient } from '@quicksight/lambda-calls';
import { errors } from '@vinejs/vine';
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
import { type DatasetSchema, datasetValidator } from './validators/dataset.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = event.httpMethod ? JSON.parse(event.body ?? '{}') : event;
  let payload: DatasetSchema;
  try {
    payload = await datasetValidator.validate(body);
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

  const { action, dataSetId, create } = payload;
  const actions = {
    'create': 'quicksight-create-dataset',
    'describe': 'quicksight-describe-dataset',
    'delete': 'quicksight-delete-dataset',
    'describe-dataset-permissions': 'quicksight-describe-dataset-permissions',
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
      await storeJsonToBiMasterApiLogsClient.store(payload, responseCreate, actionMessage);

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
      await storeJsonToBiMasterApiLogsClient.store(payload, responseDescribe, actionMessage);

      const dataset = responseDescribe.DataSet;
      if (dataset) {
        try {
          const directory = DateTime.utc().toFormat('yyyy-MM-dd');
          const isoDate = DateTime.utc().toISO();
          const fileName = `${directory}/${dataSetId}-${isoDate}.json`;
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

    if (action === 'describe-dataset-permissions') {
      // Action describe
      const describeCommand = new DescribeDataSetPermissionsCommand({
        AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID, // required
        DataSetId: dataSetId!, // required
      });

      const responseDescribePermissions = await clientQuickSight.send(describeCommand);
      await storeJsonToBiMasterApiLogsClient.store(payload, responseDescribePermissions, actionMessage);

      const permissions = responseDescribePermissions.Permissions;
      if (permissions) {
        try {
          const directory = DateTime.utc().toFormat('yyyy-MM-dd');
          const isoDate = DateTime.utc().toISO();
          const fileName = `${directory}/${dataSetId}-permissions-${isoDate}.json`;
          await putObjectToS3(fileName, JSON.stringify(permissions), env.BACKUP_BUCKET_NAME);
        } catch (error) {
          console.error(error);
        }
      } else {
        console.error(`No se pudo obtener el dataset permissions ${dataSetId} y no se ha guardado en el backup`);
      }

      return {
        statusCode: 200,
        body: JSON.stringify(responseDescribePermissions),
      };
    }

    // Action delete
    const deleteCommand = new DeleteDataSetCommand({
      AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID, // required
      DataSetId: dataSetId!, // required
    });
    const responseDelete = await clientQuickSight.send(deleteCommand);
    await storeJsonToBiMasterApiLogsClient.store(payload, responseDelete, actionMessage);
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
      await storeJsonToBiMasterApiLogsClient.store(payload, response, actionMessage);
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
