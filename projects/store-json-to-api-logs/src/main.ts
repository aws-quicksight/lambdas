import { App } from 'aws-cdk-lib';
import { StoreJsonToApiLogsStack } from './store_json_to_api_logs.stack.js';

const app = new App();

new StoreJsonToApiLogsStack(app, 'store-json-to-api-logs');

app.synth();
