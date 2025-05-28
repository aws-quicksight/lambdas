import { Duration, Size, Stack, type StackProps } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RecursiveLoop, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { type Construct } from 'constructs';

export class DatasetStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const lambdaPolicy = new PolicyStatement();
    lambdaPolicy.effect = Effect.ALLOW;
    lambdaPolicy.addActions('lambda:InvokeFunction', 'lambda:InvokeAsync');
    lambdaPolicy.addResources('*', 'arn:aws:quicksight:*:*:*');

    const logsPolicy = new PolicyStatement();
    logsPolicy.effect = Effect.ALLOW;
    logsPolicy.addActions('logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents');
    logsPolicy.addResources('*');

    new NodejsFunction(this, 'QuicksightDatasetFn', {
      entry: 'src/dataset.handler.ts',
      runtime: Runtime.NODEJS_22_X,
      memorySize: 128,
      timeout: Duration.seconds(30),
      ephemeralStorageSize: Size.mebibytes(512),
      recursiveLoop: RecursiveLoop.TERMINATE,
      initialPolicy: [lambdaPolicy, logsPolicy],
      maxEventAge: Duration.seconds(120),
      retryAttempts: 0,
      environment: {
        BUCKET_NAME: 'quicksightassets',
        BACKUP_BUCKET_NAME: 'quicksightassets-backup',
        AWS_CUSTOM_KEY: '',
        AWS_CUSTOM_SECRET: '',
        AWS_CUSTOM_REGION: '',
        AWS_CUSTOM_ACCOUNT_ID: '',
        AWS_CUSTOM_ACCES_KEY_ID: '',
        AWS_CUSTOM_SECRET_ACCESS_KEY: '',
        DB_HOST: '',
        DB_PORT: '3306',
        DB_NAME: 'bi_master',
        DB_USER: 'root',
        DB_PASSWORD: '',
      },
      bundling: {
        format: OutputFormat.ESM,
        mainFields: ['module', 'main'],
        banner:
          "const require = (await import('node:module')).createRequire(import.meta.url);const __filename = (await import('node:url')).fileURLToPath(import.meta.url);const __dirname = (await import('node:path')).dirname(__filename);",
      },
      functionName: 'quicksight-dataset',
      logRetention: RetentionDays.FIVE_DAYS,
    });
  }
}
