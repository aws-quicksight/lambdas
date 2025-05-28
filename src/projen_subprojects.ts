import { awscdk, SampleFile, typescript } from 'projen';
import { Vitest } from '@nikovirtala/projen-vitest';
import string from '@poppinss/string';
import { NodeCfdiEslint, NodeCfdiEslintOptions } from './components/nodecfdi_eslint.js';
import { configureESM, defaultTsConfig } from './esm.js';
import { readFileSync } from 'node:fs';

export class ProjenSubprojects {
  private readonly mainCdkStub: string;

  private readonly stackCdkStub: string;

  private readonly subprojects: typescript.TypeScriptProject[] = [];

  public constructor(private readonly rootProject: typescript.TypeScriptProject) {
    this.mainCdkStub = readFileSync(new URL('./stubs/main_cdk.stub', import.meta.url), 'utf-8');
    this.stackCdkStub = readFileSync(new URL('./stubs/stack_cdk.stub', import.meta.url), 'utf-8');
  }

  public addLibTs(
    name: string,
    outdir: string,
    options: {
      typescriptProjectOptions: Omit<
        typescript.TypeScriptProjectOptions,
        'name' | 'outdir' | 'parent' | 'defaultReleaseBranch'
      >;
      eslintOptions?: NodeCfdiEslintOptions;
    } = {
      typescriptProjectOptions: {},
    },
  ) {
    const tsProject = new typescript.TypeScriptProject({
      parent: this.rootProject,
      name,
      outdir: `./packages/${outdir}`,
      ...this.getCommonOptions(),
      ...options.typescriptProjectOptions,
      devDeps: [...this.getCommonOptions().devDeps, ...(options.typescriptProjectOptions.devDeps ?? [])],
    });

    configureESM(tsProject);
    new NodeCfdiEslint(tsProject, options.eslintOptions);
    new Vitest(tsProject);

    this.subprojects.push(tsProject);

    return tsProject;
  }

  public addCdkTs(
    name: string,
    outdir: string,
    options: {
      awsCdkTypeScriptAppOptions: Omit<
        awscdk.AwsCdkTypeScriptAppOptions,
        'name' | 'outdir' | 'parent' | 'defaultReleaseBranch' | 'cdkVersion'
      >;
      eslintOptions?: NodeCfdiEslintOptions;
    } = {
      awsCdkTypeScriptAppOptions: {},
    },
    cdkVersion = '2.179.0',
  ) {
    const cdkTsProject = new awscdk.AwsCdkTypeScriptApp({
      parent: this.rootProject,
      name,
      outdir: `./projects/${outdir}`,
      cdkVersion,
      requireApproval: awscdk.ApprovalLevel.NEVER,
      ...this.getCommonOptions(),
      ...options.awsCdkTypeScriptAppOptions,
      devDeps: [...this.getCommonOptions().devDeps, ...(options.awsCdkTypeScriptAppOptions.devDeps ?? [])],
    });

    const nameWithOutOrg = name.split('/').pop()!;
    const nameSnakeCase = string.snakeCase(nameWithOutOrg);
    const nameStack = `${string.pascalCase(nameWithOutOrg)}Stack`;

    configureESM(cdkTsProject);
    new NodeCfdiEslint(cdkTsProject, options.eslintOptions);
    new Vitest(cdkTsProject);
    new SampleFile(cdkTsProject, './src/main.ts', {
      contents: string.interpolate(this.mainCdkStub, {
        name: nameWithOutOrg,
        stack: nameStack,
        file: nameSnakeCase,
      }),
    });
    new SampleFile(cdkTsProject, `./src/${nameSnakeCase}.stack.ts`, {
      contents: string.interpolate(this.stackCdkStub, {
        stack: nameStack,
      }),
    });

    this.subprojects.push(cdkTsProject);

    return cdkTsProject;
  }

  public getByName<T extends typescript.TypeScriptProject>(name: string): T | undefined {
    return this.subprojects.find((subproject) => subproject.name === name) as T | undefined;
  }

  public getAll() {
    return this.subprojects;
  }

  protected getCommonOptions() {
    return {
      defaultReleaseBranch: 'main',
      sampleCode: false,
      licensed: false,

      eslint: false,
      jest: false,

      packageManager: this.rootProject.package.packageManager,
      projenCommand: this.rootProject.projenCommand,
      minNodeVersion: this.rootProject.minNodeVersion,
      tsconfig: {
        compilerOptions: {
          ...defaultTsConfig.compilerOptions,
        },
      },

      devDeps: ['@nikovirtala/projen-vitest@^2'],
    };
  }
}
