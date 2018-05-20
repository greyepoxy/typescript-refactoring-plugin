import { Logger } from '../logger';
import { getApplicableRefactors as getApplicableSimplifyConditionalRefactors } from './simplifyConditional';

export function getApplicableRefactors(
  languageService: ts.LanguageService,
  logger: Logger,
  fileName: string,
  positionOrRange: number | ts.TextRange
): ts.ApplicableRefactorInfo[] {
  logger.info('test');

  const refactoringInfo = ([] as ts.ApplicableRefactorInfo[]).concat(
    getApplicableSimplifyConditionalRefactors(languageService, logger, fileName, positionOrRange)
  );

  return refactoringInfo;
}
