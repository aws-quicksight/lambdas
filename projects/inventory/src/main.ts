import { App } from 'aws-cdk-lib';
import { InventoryStack } from './inventory.stack.js';

const app = new App();

new InventoryStack(app, 'inventory');

app.synth();
