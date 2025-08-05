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
import { createOrUpdateAwsQuickSightList } from './actions/aws_quicksight_list.js';
import { env } from './config/env.js';
import { type ListSchema, listValidator } from './validators/list.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = event.httpMethod ? JSON.parse(event.body ?? '{}') : event;
  let payload: ListSchema;
  try {
    payload = await listValidator.validate(body);
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

  const actionMessage = `quicksight-list-${payload.type}`;
  const storeJsonToBiMasterApiLogsClient = new StoreJsonToBiMasterApiLogsClient();

  try {
    // cliente de quicksight
    const clientQuickSight = new QuickSightClient({
      credentials: {
        accessKeyId: env.AWS_CUSTOM_KEY,
        secretAccessKey: env.AWS_CUSTOM_SECRET,
      },
    });

    let responseList: object;

    switch (payload.type) {
      case 'analysis': {
        const command = new ListAnalysesCommand({
          AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID,
        });
        const response = await clientQuickSight.send(command);
        if (response.RequestId && response.AnalysisSummaryList) {
          for (const analysisSummary of response.AnalysisSummaryList) {
            if (analysisSummary.AnalysisId === undefined) {
              continue;
            }

            await createOrUpdateAwsQuickSightList(
              response.RequestId,
              analysisSummary.AnalysisId,
              analysisSummary.Name ?? null,
              'analysis',
              env.AWS_CUSTOM_ACCOUNT_ID,
              env.AWS_CUSTOM_REGION,
            );
          }
        }
        responseList = response;

        break;
      }
      case 'dashboards': {
        const command = new ListDashboardsCommand({
          AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID,
        });
        const response = await clientQuickSight.send(command);
        if (response.RequestId && response.DashboardSummaryList) {
          for (const dashboardSummary of response.DashboardSummaryList) {
            if (dashboardSummary.DashboardId === undefined) {
              continue;
            }

            await createOrUpdateAwsQuickSightList(
              response.RequestId,
              dashboardSummary.DashboardId,
              dashboardSummary.Name ?? null,
              'dashboards',
              env.AWS_CUSTOM_ACCOUNT_ID,
              env.AWS_CUSTOM_REGION,
            );
          }
        }
        responseList = response;
        break;
      }
      case 'data-sets': {
        const command = new ListDataSetsCommand({
          AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID,
        });
        const response = await clientQuickSight.send(command);
        if (response.RequestId && response.DataSetSummaries) {
          for (const dataSetSummary of response.DataSetSummaries) {
            if (dataSetSummary.DataSetId === undefined) {
              continue;
            }

            await createOrUpdateAwsQuickSightList(
              response.RequestId,
              dataSetSummary.DataSetId,
              dataSetSummary.Name ?? null,
              'data-sets',
              env.AWS_CUSTOM_ACCOUNT_ID,
              env.AWS_CUSTOM_REGION,
            );
          }
        }
        responseList = response;

        break;
      }
      case 'data-sources': {
        const command = new ListDataSourcesCommand({
          AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID,
        });
        const response = await clientQuickSight.send(command);
        if (response.RequestId && response.DataSources) {
          for (const dataSource of response.DataSources) {
            if (dataSource.DataSourceId === undefined) {
              continue;
            }

            await createOrUpdateAwsQuickSightList(
              response.RequestId,
              dataSource.DataSourceId,
              dataSource.Name ?? null,
              'data-sources',
              env.AWS_CUSTOM_ACCOUNT_ID,
              env.AWS_CUSTOM_REGION,
            );
          }
        }
        responseList = response;

        break;
      }
      case 'groups': {
        const command = new ListGroupsCommand({
          AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID,
          Namespace: payload.namespace,
        });
        const response = await clientQuickSight.send(command);
        if (response.RequestId && response.GroupList) {
          for (const group of response.GroupList) {
            if (group.PrincipalId === undefined) {
              continue;
            }

            await createOrUpdateAwsQuickSightList(
              response.RequestId,
              group.PrincipalId,
              group.GroupName ?? null,
              'groups',
              env.AWS_CUSTOM_ACCOUNT_ID,
              env.AWS_CUSTOM_REGION,
            );
          }
        }
        responseList = response;

        break;
      }
      case 'group-memberships': {
        const command = new ListGroupMembershipsCommand({
          AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID,
          GroupName: payload.groupName,
          Namespace: payload.namespace,
        });
        responseList = await clientQuickSight.send(command);

        break;
      }
      case 'users': {
        const command = new ListUsersCommand({
          AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID,
          Namespace: payload.namespace,
        });
        const response = await clientQuickSight.send(command);
        if (response.RequestId && response.UserList) {
          for (const user of response.UserList) {
            if (user.PrincipalId === undefined) {
              continue;
            }

            await createOrUpdateAwsQuickSightList(
              response.RequestId,
              user.PrincipalId,
              user.UserName ?? null,
              'users',
              env.AWS_CUSTOM_ACCOUNT_ID,
              env.AWS_CUSTOM_REGION,
            );
          }
        }
        responseList = await clientQuickSight.send(command);

        break;
      }
      case 'vpc-connections': {
        const command = new ListVPCConnectionsCommand({
          AwsAccountId: env.AWS_CUSTOM_ACCOUNT_ID,
        });
        const response = await clientQuickSight.send(command);
        if (response.RequestId && response.VPCConnectionSummaries) {
          for (const vpcConnectionSummary of response.VPCConnectionSummaries) {
            if (vpcConnectionSummary.VPCConnectionId === undefined) {
              continue;
            }

            await createOrUpdateAwsQuickSightList(
              response.RequestId,
              vpcConnectionSummary.VPCConnectionId,
              vpcConnectionSummary.Name ?? null,
              'vpc-connections',
              env.AWS_CUSTOM_ACCOUNT_ID,
              env.AWS_CUSTOM_REGION,
            );
          }
        }
        responseList = await clientQuickSight.send(command);

        break;
      }
    }

    await storeJsonToBiMasterApiLogsClient.store(payload, responseList, actionMessage);

    return {
      statusCode: 200,
      body: JSON.stringify(responseList),
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
