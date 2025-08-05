/* eslint-disable sonarjs/no-dead-store */
import {
  CreateAnalysisCommand,
  type CreateAnalysisCommandInput,
  DeleteAnalysisCommand,
  DescribeAnalysisCommand,
  DescribeAnalysisDefinitionCommand,
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
import { type AnalysisSchema, analysisValidator } from './validators/analysis.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = event.httpMethod ? JSON.parse(event.body ?? '{}') : event;
  let payload: AnalysisSchema;
  try {
    payload = await analysisValidator.validate(body);
  } catch (error) {
    console.error(error);
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

  const { action, analysisId, create } = payload;
  const actions = {
    'describe-analysis': 'quicksight-describe-analysis',
    'describe-analysis-definition': 'quicksight-describe-analysis-definition',
    'create-analysis': 'quicksight-create-analysis',
    'delete-analysis': 'quicksight-delete-analysis',
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
    if (action === 'create-analysis') {
      const { object, replace_text, replace_key_value } = create!;
      const replaceTextArray = replace_text ?? [];
      const replaceKeyValueArray = replace_key_value ?? [];
      const bodyS3 = await getObjectFromS3(object, env.BUCKET_NAME);
      let json = await bodyS3.transformToString();

      for (const replaceSearch of replaceTextArray) {
        json = jsonStringReplace(json, replaceSearch.find, replaceSearch.replace);
      }

      const jsonAnalysis: CreateAnalysisCommandInput = JSON.parse(json);
      jsonAnalysis.AnalysisId = uuidv4();
      jsonAnalysis.AwsAccountId = env.AWS_CUSTOM_ACCOUNT_ID;

      for (const replaceKeyValue of replaceKeyValueArray) {
        jsonSetValueByPath(
          jsonAnalysis as unknown as Record<string, unknown>,
          replaceKeyValue.path,
          replaceKeyValue.value,
        );
      }

      if (
        jsonAnalysis.Parameters &&
        typeof jsonAnalysis.Parameters === 'object' &&
        jsonAnalysis.Parameters.DateTimeParameters
      ) {
        const dateTimeDatasetParameters = jsonAnalysis.Parameters.DateTimeParameters;
        for (const dateTimeParameter of dateTimeDatasetParameters) {
          if (dateTimeParameter.Values) {
            for (let dateTime of dateTimeParameter.Values) {
              // eslint-disable-next-line sonarjs/updated-loop-counter
              dateTime = new Date(dateTime);
            }
          }
        }
      }
      if (
        jsonAnalysis.Definition?.ParameterDeclarations &&
        Array.isArray(jsonAnalysis.Definition.ParameterDeclarations)
      ) {
        for (const parameterDeclaration of jsonAnalysis.Definition.ParameterDeclarations) {
          if (parameterDeclaration.DateTimeParameterDeclaration) {
            const dateTimeParameter = parameterDeclaration.DateTimeParameterDeclaration;
            if (dateTimeParameter.DefaultValues?.StaticValues) {
              dateTimeParameter.DefaultValues.StaticValues = dateTimeParameter.DefaultValues.StaticValues.map(
                (x) => new Date(x),
              );
            }
          }
        }
      }
      if (jsonAnalysis.Definition?.FilterGroups && Array.isArray(jsonAnalysis.Definition.FilterGroups)) {
        for (const filterGroup of jsonAnalysis.Definition.FilterGroups) {
          if (filterGroup.Filters && Array.isArray(filterGroup.Filters)) {
            for (const filter of filterGroup.Filters) {
              if (filter.TimeRangeFilter?.RangeMinimumValue?.StaticValue) {
                filter.TimeRangeFilter.RangeMinimumValue.StaticValue = new Date(
                  filter.TimeRangeFilter.RangeMinimumValue.StaticValue,
                );
              }
              if (filter.TimeRangeFilter?.RangeMaximumValue?.StaticValue) {
                filter.TimeRangeFilter.RangeMaximumValue.StaticValue = new Date(
                  filter.TimeRangeFilter.RangeMaximumValue.StaticValue,
                );
              }
            }
          }
        }
      }

      const createCommand = new CreateAnalysisCommand(jsonAnalysis);
      const responseCreate = await clientQuickSight.send(createCommand);
      await storeJsonToBiMasterApiLogsClient.store(payload, responseCreate, actionMessage);

      let awsQuickSightAssetsId: number | null = null;
      try {
        awsQuickSightAssetsId = await checkAwsQuickSightAssetsExists(
          responseCreate.AnalysisId!,
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
            dataSetId: responseCreate.AnalysisId,
            result: responseCreate,
          }),
        };
      }

      const values = {
        assetId: responseCreate.AnalysisId!,
        name: jsonAnalysis.Name!,
        awsAccountId: env.AWS_CUSTOM_ACCOUNT_ID,
        region: env.AWS_CUSTOM_REGION,
      };

      await (awsQuickSightAssetsId
        ? updateAwsQuickSightAssets(awsQuickSightAssetsId, values)
        : storeAwsQuickSightAssets(values));
      console.info(responseCreate);

      return {
        statusCode: 200,
        body: JSON.stringify(responseCreate),
      };
    }
    if (action === 'delete-analysis') {
      const deleteCommand = new DeleteAnalysisCommand({
        AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID, // required
        AnalysisId: analysisId!, // required
      });
      const responseDelete = await clientQuickSight.send(deleteCommand);
      await storeJsonToBiMasterApiLogsClient.store(payload, responseDelete, actionMessage);
      await updateDeleteAwsQuickSightAssets(analysisId!, env.AWS_CUSTOM_ACCOUNT_ID, env.AWS_CUSTOM_REGION);

      return {
        statusCode: 200,
        body: JSON.stringify(responseDelete),
      };
    }
    if (action === 'describe-analysis') {
      // Action describe
      const describeCommand = new DescribeAnalysisCommand({
        AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID, // required
        AnalysisId: analysisId!, // required
      });

      responseDescribe = await clientQuickSight.send(describeCommand);
      await storeJsonToBiMasterApiLogsClient.store(payload, responseDescribe, actionMessage);

      const analysis = responseDescribe as { Name: string };
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (analysis) {
        try {
          const directory = DateTime.utc().toFormat('yyyy-MM-dd');
          const isoDate = DateTime.utc().toISO();
          const fileName = `${directory}/${analysisId}-${isoDate}.json`;
          await putObjectToS3(fileName, JSON.stringify(analysis), env.BACKUP_BUCKET_NAME);
        } catch (error) {
          console.error(error);
        }
      } else {
        console.error(`No se pudo obtener el analysis ${analysisId} y no se ha guardado en el backup`);
      }
    }

    if (action === 'describe-analysis-definition') {
      const describeCommand = new DescribeAnalysisDefinitionCommand({
        AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID, // required
        AnalysisId: analysisId!, // required
      });
      responseDescribe = await clientQuickSight.send(describeCommand);
      await storeJsonToBiMasterApiLogsClient.store(payload, responseDescribe, actionMessage);

      const analysis = responseDescribe as { Name: string };
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (analysis) {
        try {
          const directory = DateTime.utc().toFormat('yyyy-MM-dd');
          const isoDate = DateTime.utc().toISO();
          const fileName = `${directory}/${analysisId}-${isoDate}.json`;
          await putObjectToS3(fileName, JSON.stringify(analysis), env.BACKUP_BUCKET_NAME);
        } catch (error) {
          console.error(error);
        }
      } else {
        console.error(`No se pudo obtener el analysis ${analysisId} y no se ha guardado en el backup`);
      }
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
