import * as ts from 'typescript/lib/tsserverlibrary';
import { GetLogger } from './logger';
import { getApplicableRefactors, getEditsForRefactor } from './refactorings/refactorings';

export function create(info: ts.server.PluginCreateInfo): ts.LanguageService {
  const logger = GetLogger(info.project);
  logger.info(`loaded`);

  logger.info(info.project.projectName);

  // Set up language service decorator
  const proxy: ts.LanguageService = Object.create(null);
  const oldLS = info.languageService;
  // tslint:disable-next-line:forin
  for (const k in oldLS) {
    (proxy as any)[k] = (...args: Array<{}>) => {
      return (oldLS as any)[k].apply(oldLS, args);
    };
  }

  // Decorate the refactoring commands with extra capabilities
  proxy.getApplicableRefactors = (fileName, positionOrRange, preferences) => {
    const prior = oldLS.getApplicableRefactors(fileName, positionOrRange, preferences);

    return prior.concat(
      getApplicableRefactors(oldLS, logger, fileName, positionOrRange, preferences)
    );
  };

  proxy.getEditsForRefactor = (
    fileName,
    formatOptions,
    positionOrRange,
    refactorName,
    actionName,
    preferences
  ) => {
    const prior = oldLS.getEditsForRefactor(
      fileName,
      formatOptions,
      positionOrRange,
      refactorName,
      actionName,
      preferences
    );

    if (prior !== undefined) {
      return prior;
    }

    return getEditsForRefactor(
      oldLS,
      logger,
      fileName,
      formatOptions,
      positionOrRange,
      refactorName,
      actionName,
      preferences
    );
  };

  return proxy;
}
