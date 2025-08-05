import { App } from 'aws-cdk-lib';
import { DashboardStack } from './dashboard.stack.js';

const app = new App();

new DashboardStack(app, 'dashboard');

app.synth();
