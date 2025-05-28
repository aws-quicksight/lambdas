import path from 'node:path';
import { Component, JsonFile, Project } from 'projen';

export class VitestWorkspace extends Component {
  public constructor(rootProject: Project) {
    super(rootProject);

    new JsonFile(rootProject, './vitest.workspace.json', {
      obj: rootProject.subprojects.map((project) => path.relative(rootProject.outdir, project.outdir)),
    });
  }
}
