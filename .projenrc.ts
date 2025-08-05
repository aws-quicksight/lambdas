import { awscdk, javascript, typescript } from 'projen';
import { PnpmWorkspace } from './src/components/pnpm';
import { VscodeSettings } from './src/components/vscode';
import { EditorConfig } from './src/components/editorconfig';
import { VitestWorkspace } from './src/components/vitest';
import { Nx } from './src/components/nx';
import { configureESM, defaultTsConfig } from './src/esm';
import { ProjenSubprojects } from './src/projen_subprojects';

const defaultReleaseBranch = 'main';
const nodeVersion = '22.14.0';
const pnpmVersion = '10.5.2';

const root = new typescript.TypeScriptProject({
  name: '@quicksight/root',
  defaultReleaseBranch,
  packageManager: javascript.NodePackageManager.PNPM,
  projenCommand: 'pnpm dlx projen',
  minNodeVersion: nodeVersion,
  projenrcTs: true,
  sampleCode: false,
  github: false,
  licensed: false,

  // Jest and eslint are disabled at the root as they will be
  // configured by each subproject.
  eslint: false,
  jest: false,

  prettier: true,
  prettierOptions: {
    settings: {
      arrowParens: javascript.ArrowParens.ALWAYS,
      bracketSameLine: false,
      bracketSpacing: true,
      endOfLine: javascript.EndOfLine.LF,
      printWidth: 120,
      proseWrap: javascript.ProseWrap.PRESERVE,
      quoteProps: javascript.QuoteProps.CONSISTENT,
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: javascript.TrailingComma.ALL,
      useTabs: false,
    },
    ignoreFileOptions: {
      ignorePatterns: [
        'tsconfig.json',
        'tsconfig.*.json',
        'pnpm-lock.yaml',
        'pnpm-workspace.yaml',
        '**/cdk.json',
        '**/eslint.config.js',
        '**/vitest.config.ts',
        '.projen/',
        '.vscode/',
        '**/cdk.out/',
        'nx.json',
        '**/lib/*',
      ],
    },
  },

  depsUpgradeOptions: { workflow: false },
  buildWorkflow: false,
  release: false,
  tsconfig: {
    compilerOptions: {
      ...defaultTsConfig.compilerOptions,
    },
  },

  devDeps: ['@nodecfdi/eslint-config@^3', '@nikovirtala/projen-vitest@^2', '@poppinss/string', 'vitest'],
});

/** Additional configurations on root project */

// Configure ESM
configureESM(root);
// Configure prettier only on the root project
root.addScripts({
  'format': 'prettier --write .',
  'format:check': 'prettier --check .',
});
// Configure pnpm packageManager
root.package.addField('packageManager', `pnpm@${pnpmVersion}`);
// Configure other settings
root.npmrc.addConfig('auto-install-peers', 'true');
new EditorConfig(root);
/** End of additional configurations on root project */

/** Subprojects configurations */
const childrens = new ProjenSubprojects(root);

// Shared libraries
const packageDatabase = childrens.addLibTs('@quicksight/database', 'database', {
  typescriptProjectOptions: {
    deps: ['drizzle-orm', 'mysql2'],
    devDeps: ['drizzle-kit', 'dotenv'],
  },
  eslintOptions: {
    configBlocksToMerge: [
      {
        files: ['drizzle.config.ts'],
        rules: {
          'import-x/no-unassigned-import': 'off',
        },
      },
    ],
    options: {
      projectService: {
        allowDefaultProject: ['drizzle.config.ts'],
      },
    },
  },
});
packageDatabase.addGitIgnore('.env');
packageDatabase.addGitIgnore('drizzle');

childrens.addLibTs('@quicksight/lambda-calls', 'lambda-calls', {
  typescriptProjectOptions: {
    deps: ['@aws-sdk/client-lambda'],
  },
});

childrens.addCdkTs('@quicksight/quicksight-create-ingestion', 'quicksight-create-ingestion', {
  awsCdkTypeScriptAppOptions: {
    requireApproval: awscdk.ApprovalLevel.NEVER,
    deps: [
      'envalid',
      '@aws-sdk/client-lambda',
      'drizzle-orm',
      'uuid',
      '@aws-sdk/client-quicksight',
      '@quicksight/database@workspace:*',
      '@quicksight/lambda-calls@workspace:*',
    ],
    devDeps: ['@types/aws-lambda', '@types/uuid'],
  },
});

childrens.addCdkTs('@quicksight/analysis', 'analysis', {
  awsCdkTypeScriptAppOptions: {
    requireApproval: awscdk.ApprovalLevel.NEVER,
    deps: [
      'envalid',
      '@aws-sdk/client-lambda',
      '@aws-sdk/client-quicksight',
      '@aws-sdk/client-s3',
      'drizzle-orm',
      '@quicksight/database@workspace:*',
      '@quicksight/lambda-calls@workspace:*',
      'uuid',
      'luxon',
      '@vinejs/vine',
    ],
    devDeps: ['@types/aws-lambda', '@types/uuid', '@types/luxon'],
  },
});

childrens.addCdkTs('@quicksight/dataset', 'dataset', {
  awsCdkTypeScriptAppOptions: {
    requireApproval: awscdk.ApprovalLevel.NEVER,
    deps: [
      'envalid',
      '@aws-sdk/client-lambda',
      '@aws-sdk/client-quicksight',
      '@aws-sdk/client-s3',
      'drizzle-orm',
      '@quicksight/database@workspace:*',
      '@quicksight/lambda-calls@workspace:*',
      'uuid',
      'luxon',
      '@vinejs/vine',
    ],
    devDeps: ['@types/aws-lambda', '@types/uuid', '@types/luxon'],
  },
});

childrens.addCdkTs('@quicksight/store-json-to-api-logs', 'store-json-to-api-logs', {
  awsCdkTypeScriptAppOptions: {
    requireApproval: awscdk.ApprovalLevel.NEVER,
    deps: ['envalid', 'drizzle-orm', '@quicksight/database@workspace:*', 'uuid'],
    devDeps: ['@types/aws-lambda', '@types/uuid'],
  },
});

/** End of subprojects configurations */

// Configure workspaces and monorepo similar
new PnpmWorkspace(root);
new VscodeSettings(root);
new VitestWorkspace(root);
new Nx(root);

root.synth();
