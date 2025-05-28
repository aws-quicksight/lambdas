import { Component, IniFile, Project } from 'projen';

export class EditorConfig extends Component {
  public constructor(rootProject: Project) {
    super(rootProject);

    new IniFile(rootProject, '.editorconfig', {
      obj: {
        '*': {
          indent_style: 'space',
          indent_size: 2,
          end_of_line: 'lf',
          charset: 'utf-8',
          trim_trailing_whitespace: true,
          insert_final_newline: true,
          json: {
            insert_final_newline: 'unset',
          },
          md: {
            trim_trailing_whitespace: false,
          },
        },
        'MakeFile': {
          indent_style: 'space',
        },
      },
    });
  }
}
