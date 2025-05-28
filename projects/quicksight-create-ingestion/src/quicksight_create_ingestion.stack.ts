import { Duration, Size, Stack, type StackProps } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RecursiveLoop, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { type Construct } from 'constructs';

export class QuicksightCreateIngestionStack extends Stack {
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

    new NodejsFunction(this, 'quicksightCreateIngestionFn', {
      entry: 'src/quicksight_create_ingestion.handler.ts',
      runtime: Runtime.NODEJS_22_X,
      memorySize: 128,
      timeout: Duration.seconds(29),
      ephemeralStorageSize: Size.mebibytes(512),
      recursiveLoop: RecursiveLoop.TERMINATE,
      initialPolicy: [lambdaPolicy, logsPolicy],
      maxEventAge: Duration.seconds(21600),
      environment: {
        AWS_CUSTOM_KEY: '',
        AWS_CUSTOM_SECRET: '',
        AWS_CUSTOM_REGION: '',
        AWS_CUSTOM_ACCOUNT_ID: '',
        AWS_CUSTOM_ACCES_KEY_ID: '',
        AWS_CUSTOM_SECRET_ACCESS_KEY: '',
        ACTION: 'quicksight-create-ingestion',
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

    // const endpoint = new apigw.LambdaRestApi(this, `ApiGwEndpoint`, {
    //   handler: fn,
    //   restApiName: `quicksightCreateIngestion`,
    // });
  }
}
