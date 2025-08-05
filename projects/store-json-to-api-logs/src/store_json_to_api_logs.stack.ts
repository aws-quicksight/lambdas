import { Duration, Size, Stack, type StackProps } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RecursiveLoop, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { type Construct } from 'constructs';

export class StoreJsonToApiLogsStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const logsPolicy = new PolicyStatement();
    logsPolicy.effect = Effect.ALLOW;
    logsPolicy.addActions('logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents');
    logsPolicy.addResources('*');

    new NodejsFunction(this, 'storeJsonToApiLogsFn', {
      entry: 'src/store_json_to_api_logs.handler.ts',
      runtime: Runtime.NODEJS_22_X,
      memorySize: 128,
      timeout: Duration.seconds(29),
      ephemeralStorageSize: Size.mebibytes(512),
      recursiveLoop: RecursiveLoop.TERMINATE,
      initialPolicy: [logsPolicy],
      maxEventAge: Duration.seconds(21600),
      environment: {
        DB_HOST: '',
        DB_PORT: '',
        DB_NAME: 'bi_master',
        DB_USER: '',
        DB_PASSWORD: '',
      },
      retryAttempts: 0,
      bundling: {
        format: OutputFormat.ESM,
        mainFields: ['module', 'main'],
        banner:
          "const require = (await import('node:module')).createRequire(import.meta.url);const __filename = (await import('node:url')).fileURLToPath(import.meta.url);const __dirname = (await import('node:path')).dirname(__filename);",
      },
      functionName: 'quicksightCreateIngestion',
      logRetention: RetentionDays.FIVE_DAYS,
    });
  }
}
