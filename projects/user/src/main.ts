import { App } from 'aws-cdk-lib';
import { UserStack } from './user.stack.js';

const app = new App();

new UserStack(app, 'user');

app.synth();
