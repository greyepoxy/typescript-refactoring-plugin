export interface Logger {
  info(message: string): void;
}

export function GetLogger(prjInfo: ts.server.PluginCreateInfo): Logger {
  return {
    info: (message: string) =>
      prjInfo.project.projectService.logger.info(`[typescript-refactoring-plugin]: ${message}`)
  };
}
