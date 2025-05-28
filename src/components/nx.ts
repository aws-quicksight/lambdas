import { Component, JsonFile, typescript } from 'projen';

export class Nx extends Component {
  constructor(rootProject: typescript.TypeScriptProject) {
    super(rootProject);

    rootProject.addDevDeps('nx', '@nx/devkit', '@nx/workspace');
    rootProject.gitignore.addPatterns('.nx/cache', '.nx/workspace-data');

    new JsonFile(rootProject, 'nx.json', {
      obj: {
        extends: 'nx/presets/npm.json',
        targetDefaults: {
          build: {
            // Specifies the build target of a project is dependent on the
            // build target of dependant projects (via the caret)
            dependsOn: ['^build'],

            // Inputs tell nx which files can invalidate the cache should they updated.
            // We only want the build target cache to be invalidated if there
            // are changes to source files so the config below ignores output files.
            inputs: [
              '!{projectRoot}/test-reports/**/*',
              '!{projectRoot}/coverage/**/*',
              '!{projectRoot}/build/**/*',
              '!{projectRoot}/dist/**/*',
              '!{projectRoot}/lib/**/*',
              '!{projectRoot}/cdk.out/**/*',
            ],

            // Outputs tell nx where artifacts can be found for caching purposes.
            // The need for this will become more obvious when we configure

            // github action workflows and need to restore the nx cache for

            // subsequent job to fetch artifacts
            outputs: ['{projectRoot}/dist', '{projectRoot}/lib', '{projectRoot}/cdk.out'],
            cache: true,
          },
          deploy: { dependsOn: ['build'] },
        },
        affected: { defaultBase: 'origin/main' },
      },
    });
  }
}
