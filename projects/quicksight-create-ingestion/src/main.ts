import { App } from 'aws-cdk-lib';
import { QuicksightCreateIngestionStack } from './quicksight_create_ingestion.stack.js';

const app = new App();

new QuicksightCreateIngestionStack(app, 'quicksight-create-ingestion');

app.synth();
