// TODO: put something real here for now just the example here
// https://github.com/Microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin

import * as ts_module from '../node_modules/typescript/lib/tsserverlibrary';
import { GetLogger } from './logger';

// tslint:disable-next-line:variable-name
function init(_modules: { typescript: typeof ts_module }) {
  function create(info: ts.server.PluginCreateInfo) {
    const logger = GetLogger(info);
    logger.info(`I'm getting set up now!`);

    // Set up decorator
    const proxy: ts.LanguageService = Object.create(null);
    for (const k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
      const x = info.languageService[k];
      proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
    }

    proxy.getApplicableRefactors = (fileName, positionOrRange) => {
      const prior = info.languageService.getApplicableRefactors(fileName, positionOrRange);

      // TODO: add some amazing refactoring here

      return prior;
    };

    proxy.getEditsForRefactor = (
      fileName,
      formatOptions,
      positionOrRange,
      refactorName,
      actionName
    ) => {
      const prior = info.languageService.getEditsForRefactor(
        fileName,
        formatOptions,
        positionOrRange,
        refactorName,
        actionName
      );

      if (prior === undefined) {
        // TODO: handle the refactorings that I have added here
      }

      return prior;
    };

    logger.info('setup!');

    return proxy;
  }

  return { create };
}

export = init;
