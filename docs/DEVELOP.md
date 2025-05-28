# Quicksight

Repository that manages Lambda functions and libraries for Quicksight.

## Requirements

- [Node.js](https://nodejs.org/en/) >= 22.14.0
- Enable corepack: `corepack enable`
- Run `npx projen` at the root of the project the first time

## Installation

Once the requirements are installed, run:

```bash
pnpm projen
```

## Development

### Add a new Lambda function or library

To add a Lambda function or a library, you must include it in the list of childrens in `.projenrc.ts` and run:

```bash
pnpm projen
```

- To add a new Lambda function, there's a helper in `.projenrc.ts` called `addCdkTs`.
- To add a new library, there's a helper in `.projenrc.ts` called `addLibTs`.

After running the previous command, a new directory will be generated in the `packages` or `projects` folder with the project name, and the CDK or TypeScript project template will be copied there, ready to start developing.

### Helper commands

| Command                                      | Description                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm format`                                | Formats the base code using Prettier                                                            |
| `pnpm format:check`                          | Checks that the code complies with the Prettier formatting style                                |
| `pnpm projen`                                | Applies the configuration defined in `.projenrc.ts` to the project structure                    |
| `pnpm nx run-many --target <command>`        | Runs the command on all subprojects, for example `pnpm nx run-many --target lint:check`         |
| `pnpm nx run-many --target build`            | Builds all subprojects                                                                          |
| `pnpm nx run-many --target test`             | Runs the tests for all subprojects                                                              |
| `pnpm nx affected --target build --verbose`  | Builds only the affected subprojects                                                            |
| `pnpm nx affected --target deploy --verbose` | Deploys the affected subprojects                                                                |
