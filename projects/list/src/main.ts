import { App } from 'aws-cdk-lib';
import { ListStack } from './list.stack.js';

const app = new App();

new ListStack(app, 'list');

app.synth();
