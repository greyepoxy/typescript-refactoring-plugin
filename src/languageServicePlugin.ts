// TODO: put something real here for now just the example here
// https://github.com/Microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin

import * as ts from 'typescript/lib/tsserverlibrary';
import { GetLogger } from './logger';
import { getApplicableRefactors, getEditsForRefactor } from './refactorings/refactorings';

export function create(info: ts.server.PluginCreateInfo): ts.LanguageService {
  const logger = GetLogger(info.project);
  logger.info(`loaded`);

  logger.info(info.project.projectName);

  // Set up decorator
  const proxy: ts.LanguageService = Object.create(null);
  const oldLS = info.languageService;
  // tslint:disable-next-line:forin
  for (const k in oldLS) {
    (proxy as any)[k] = () => {
      return (oldLS as any)[k].apply(oldLS);
    };
  }

  proxy.getApplicableRefactors = (fileName, positionOrRange) => {
    const prior = oldLS.getApplicableRefactors(fileName, positionOrRange);

    return prior.concat(getApplicableRefactors(oldLS, logger, fileName, positionOrRange));
  };

  proxy.getEditsForRefactor = (
    fileName,
    formatOptions,
    positionOrRange,
    refactorName,
    actionName
  ) => {
    const prior = oldLS.getEditsForRefactor(
      fileName,
      formatOptions,
      positionOrRange,
      refactorName,
      actionName
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
      actionName
    );
  };

  return proxy;
}
