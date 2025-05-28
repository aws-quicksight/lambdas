# LAMBDAS FOR QUICKSIGHT

This repository is a monorepo build over AWS CDK and AWS Lambda functions for managing Quicksight assets.

## Requirements

- [Node.js](https://nodejs.org/en/) >= 22.14.0
- Enable corepack: `corepack enable`
- Run `npx projen` at the root of the project the first time
- S3 bucket for storing json Quicksight assets
- Aurora RDS for managing Quicksight assets

## Installation

Once the requirements are installed, run:

```bash
pnpm projen
```

then you can run:

```bash
pnpm nx run-many --target build
```

To build all lambda functions.

Then you can deploy all lambdas using:

```bash
pnpm nx run-many --target deploy --profile <profile>
```

After you deploy all lambdas you need to configure the variables for the lambdas directly in the AWS console.

You also can modify this code with AWS API Gateway to create a REST API for the lambdas.
