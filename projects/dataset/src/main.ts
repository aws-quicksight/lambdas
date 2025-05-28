import { App } from 'aws-cdk-lib';
import { DatasetStack } from './dataset.stack.js';

const app = new App();

new DatasetStack(app, 'quicksight-dataset');

app.synth();
