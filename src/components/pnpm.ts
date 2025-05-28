import path from 'node:path';
import { Component, Project, YamlFile } from 'projen';

export class PnpmWorkspace extends Component {
  public constructor(rootProject: Project) {
    super(rootProject);

    new YamlFile(rootProject, 'pnpm-workspace.yaml', {
      obj: {
        packages: rootProject.subprojects.map((project) => path.relative(rootProject.outdir, project.outdir)),
      },
    });
  }
}
