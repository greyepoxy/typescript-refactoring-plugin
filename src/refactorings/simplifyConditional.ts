import { Logger } from '../logger';

export const name = 'Simplify Conditional';
export const conditionalAlwaysTrueAction = 'conditional_always_true';

export const conditionalAlwaysTrueRefactoring: ts.ApplicableRefactorInfo = {
  name,
  description: 'Simplify this conditional',
  actions: [
    {
      name: conditionalAlwaysTrueAction,
      description: 'Simplify always true conditional'
    }
  ]
};

export function getApplicableRefactors(
  languageService: ts.LanguageService,
  logger: Logger,
  fileName: string,
  positionOrRange: number | ts.TextRange
): ts.ApplicableRefactorInfo[] {
  const startPos = typeof positionOrRange === 'number' ? positionOrRange : positionOrRange.pos;

  const program = languageService.getProgram();

  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) {
    logger.error(`cannot load source file ${fileName}`);
    return [];
  }

  const result = sourceFile.getChildAt(startPos);

  logger.info(result.getText());

  return [];
}
