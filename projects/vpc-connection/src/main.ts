import { App } from 'aws-cdk-lib';
import { VpcConnectionStack } from './vpc_connection.stack.js';

const app = new App();

new VpcConnectionStack(app, 'vpc-connection');

app.synth();
