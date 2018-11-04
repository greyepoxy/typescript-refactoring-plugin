import { Logger } from '../logger';
import {
  getApplicableRefactors as getApplicableSimplifyConditionalRefactors,
  getEditsForRefactor as getEditsForSimplifyConditionalRefactors
} from './simplifyConditional';

const noProgramError =
  'Cannot get the current Program this could be because tsc is running in syntaxOnly mode, unable to provide refactorings';

export function getApplicableRefactors(
  languageService: ts.LanguageService,
  logger: Logger,
  fileName: string,
  positionOrRange: number | ts.TextRange,
  preferences: ts.UserPreferences | undefined
): ts.ApplicableRefactorInfo[] {
  const program = languageService.getProgram();

  if (program === undefined) {
    logger.error(noProgramError);
    return [];
  }

  const refactoringInfo = ([] as ts.ApplicableRefactorInfo[]).concat(
    getApplicableSimplifyConditionalRefactors(
      program,
      logger,
      fileName,
      positionOrRange,
      preferences
    )
  );

  return refactoringInfo;
}

export function getEditsForRefactor(
  languageService: ts.LanguageService,
  logger: Logger,
  fileName: string,
  formatOptions: ts.FormatCodeSettings,
  positionOrRange: number | ts.TextRange,
  refactorName: string,
  actionName: string,
  preferences: ts.UserPreferences | undefined
): ts.RefactorEditInfo | undefined {
  const program = languageService.getProgram();

  if (program === undefined) {
    logger.error(noProgramError);
    return undefined;
  }

  return getEditsForSimplifyConditionalRefactors(
    program,
    logger,
    fileName,
    formatOptions,
    positionOrRange,
    refactorName,
    actionName,
    preferences
  );
}
