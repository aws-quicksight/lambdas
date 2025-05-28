import path from 'node:path';
import { Component, JsonFile, Project } from 'projen';

export class VscodeSettings extends Component {
  public constructor(rootProject: Project) {
    super(rootProject);

    new JsonFile(rootProject, '.vscode/settings.json', {
      obj: {
        'eslint.workingDirectories': rootProject.subprojects.map((project) => ({
          pattern: path.relative(rootProject.outdir, project.outdir),
        })),
      },
    });
  }
}
