import * as ts from 'typescript/lib/tsserverlibrary';

export interface Logger {
  info(message: string): void;
  error(message: string): void;
}

const logPrefix = `[typescript-refactoring-plugin]`;

export function GetLogger(project: ts.server.Project): Logger {
  return {
    info: (message: string) => project.projectService.logger.info(`${logPrefix}: ${message}`),
    error: (message: string) =>
      project.projectService.logger.msg(`${logPrefix}: ${message}`, ts.server.Msg.Err)
  };
}
