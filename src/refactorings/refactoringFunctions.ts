import * as ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';

export type GetApplicableRefactors = (
  program: ts.Program,
  logger: Logger,
  fileName: string,
  positionOrRange: number | ts.TextRange,
  preferences: ts.UserPreferences | undefined
) => ts.ApplicableRefactorInfo[];

export type GetEditsForRefactor = (
  program: ts.Program,
  logger: Logger,
  fileName: string,
  formatOptions: ts.FormatCodeSettings,
  positionOrRange: number | ts.TextRange,
  refactorName: string,
  actionName: string,
  preferences: ts.UserPreferences | undefined
) => ts.RefactorEditInfo | undefined;
