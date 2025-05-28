import path from 'node:path';
import { awscdk, javascript, typescript } from 'projen';

export const defaultTsConfig = {
  compilerOptions: {
    allowSyntheticDefaultImports: true,
    alwaysStrict: true,
    declaration: true,
    esModuleInterop: true,
    experimentalDecorators: true,
    inlineSourceMap: true,
    inlineSources: true,
    isolatedModules: true,
    lib: ['esnext'],
    module: 'nodenext',
    moduleResolution: javascript.TypeScriptModuleResolution.NODE_NEXT,
    noEmitOnError: false,
    noFallthroughCasesInSwitch: true,
    noImplicitAny: true,
    noImplicitOverride: true,
    noImplicitReturns: true,
    noImplicitThis: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    resolveJsonModule: true,
    strict: true,
    strictNullChecks: true,
    strictPropertyInitialization: true,
    stripInternal: true,
    target: 'esnext',
    skipLibCheck: true,
  },
};

export const configureESM = (project: typescript.TypeScriptProject | awscdk.AwsCdkTypeScriptApp) => {
  project.package.addField('type', 'module');
  project.deps.removeDependency('ts-node');
  project.addDevDeps('tsx');
  project.defaultTask?.reset();
  project.defaultTask?.exec(`tsx --tsconfig ${project.tsconfigDev.file.path} .projenrc.ts`);

  if (project instanceof awscdk.AwsCdkTypeScriptApp) {
    project.cdkConfig.json.addOverride(
      'app',
      `tsx --tsconfig ${project.tsconfig?.file.path} ${path.posix.join(project.srcdir, project.appEntrypoint)}`,
    );
  }
};
