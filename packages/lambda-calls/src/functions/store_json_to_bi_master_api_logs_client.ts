import { Lambda } from '@aws-sdk/client-lambda';

export class StoreJsonToBiMasterApiLogsClient {
  private readonly lambdaName: string;

  public constructor(customName?: string) {
    this.lambdaName = customName ?? 'storeJsonToBiMasterApiLogs';
  }

  public async store(entry: object, response: object, action: string): Promise<void> {
    const paramsFunction = {
      FunctionName: this.lambdaName,
      Payload: JSON.stringify({ entry, response, action }),
    };
    const lambda = new Lambda();
    await lambda.invoke(paramsFunction);
  }
}
