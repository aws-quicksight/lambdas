import { App } from 'aws-cdk-lib';
import { AnalysisStack } from './analysis.stack.js';

const app = new App();

new AnalysisStack(app, 'analysis');

app.synth();
