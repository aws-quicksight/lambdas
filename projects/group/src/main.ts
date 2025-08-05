import { App } from 'aws-cdk-lib';
import { GroupStack } from './group.stack.js';

const app = new App();

new GroupStack(app, 'group');

app.synth();
