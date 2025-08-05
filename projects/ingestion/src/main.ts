import { App } from 'aws-cdk-lib';
import { IngestionStack } from './ingestion.stack.js';

const app = new App();

new IngestionStack(app, 'ingestion');

app.synth();
