import {
  ListAnalysesCommand,
  ListDashboardsCommand,
  ListDataSetsCommand,
  ListDataSourcesCommand,
  ListGroupMembershipsCommand,
  ListGroupsCommand,
  ListUsersCommand,
  ListVPCConnectionsCommand,
  QuickSightClient,
} from '@aws-sdk/client-quicksight';
import { StoreJsonToBiMasterApiLogsClient } from '@quicksight/lambda-calls';
import { errors } from '@vinejs/vine';
import { type APIGatewayProxyHandler } from 'aws-lambda';
import { env } from './config/env.js';
import { type InventorySchema, inventoryValidator } from './validators/inventory.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = event.httpMethod ? JSON.parse(event.body ?? '{}') : event;
  let payload: InventorySchema;
  try {
    payload = await inventoryValidator.validate(body);
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

  const actionMessage = `quicksight-${payload.action}-${payload.action === 'list' ? payload.listType : payload.describeType}`;
  const storeJsonToBiMasterApiLogsClient = new StoreJsonToBiMasterApiLogsClient();
  try {
    // cliente de quicksight
    const clientQuickSight = new QuickSightClient({
      credentials: {
        accessKeyId: env.AWS_KEY,
        secretAccessKey: env.AWS_SECRET,
      },
    });

    if (payload.action === 'list') {
      let responseList: object;

      switch (payload.listType!) {
        case 'analyses': {
          const command = new ListAnalysesCommand({
            AwsAccountId: env.AWS_ACCOUNT_ID,
          });
          responseList = await clientQuickSight.send(command);

          break;
        }
        case 'dashboards': {
          const command = new ListDashboardsCommand({
            AwsAccountId: env.AWS_ACCOUNT_ID,
          });
          responseList = await clientQuickSight.send(command);

          break;
        }
        case 'data-sets': {
          const command = new ListDataSetsCommand({
            AwsAccountId: env.AWS_ACCOUNT_ID,
          });
          responseList = await clientQuickSight.send(command);

          break;
        }
        case 'data-sources': {
          const command = new ListDataSourcesCommand({
            AwsAccountId: env.AWS_ACCOUNT_ID,
          });
          responseList = await clientQuickSight.send(command);

          break;
        }
        case 'groups': {
          const command = new ListGroupsCommand({
            AwsAccountId: env.AWS_ACCOUNT_ID,
            Namespace: payload.namespace,
          });
          responseList = await clientQuickSight.send(command);

          break;
        }
        case 'group-memberships': {
          const command = new ListGroupMembershipsCommand({
            AwsAccountId: env.AWS_ACCOUNT_ID,
            GroupName: payload.groupName,
            Namespace: payload.namespace,
          });
          responseList = await clientQuickSight.send(command);

          break;
        }
        case 'users': {
          const command = new ListUsersCommand({
            AwsAccountId: env.AWS_ACCOUNT_ID,
            Namespace: payload.namespace,
          });
          responseList = await clientQuickSight.send(command);

          break;
        }
        case 'vpc-connections': {
          const command = new ListVPCConnectionsCommand({
            AwsAccountId: env.AWS_ACCOUNT_ID,
          });
          responseList = await clientQuickSight.send(command);

          break;
        }
      }

      await storeJsonToBiMasterApiLogsClient.store(payload, responseList, actionMessage);

      return {
        statusCode: 200,
        body: JSON.stringify(responseList),
      };
    }

    // Action describe
    // const describeCommand = new DescribeDataSetCommand({
    //   AwsAccountId: infoService.awsConfig.awsAccountId, // required
    //   DataSetId: dataSetId!, // required
    // });
    // const responseDescribe = await clientQuickSight.send(describeCommand);
    // await storeJsonToBiMasterApiLogsClient.store(body, responseDescribe, actionMessage);

    // const dataset = responseDescribe.DataSet;
    // if (dataset) {
    //   try {
    //     const directory = DateTime.utc().toFormat('yyyy-MM-dd');
    //     const isoDate = DateTime.utc().toISO();
    //     const fileName = `${directory}/${dataset.Name}-${isoDate}.json`;
    //     await putObjectToS3(fileName, JSON.stringify(dataset), env.BACKUP_BUCKET_NAME);
    //   } catch (error) {
    //     console.error(error);
    //   }
    // } else {
    //   console.error(`No se pudo obtener el dataset ${dataSetId} y no se ha guardado en el backup`);
    // }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'In progress' }),
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
