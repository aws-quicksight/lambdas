import { App } from 'aws-cdk-lib';
import { DataSourceStack } from './data_source.stack.js';

const app = new App();

new DataSourceStack(app, 'data-source');

app.synth();
