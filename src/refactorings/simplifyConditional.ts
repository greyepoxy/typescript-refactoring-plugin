import * as tsutils from 'tsutils';
import * as ts from 'typescript';
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

function formatLineAndChar(lineAndChar: ts.LineAndCharacter): string {
  return `(${lineAndChar.line}, ${lineAndChar.character})`;
}

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

  const token = tsutils.getTokenAtPosition(sourceFile, startPos);

  if (token === undefined || token.parent === undefined) {
    logger.error(`No token at given position ${startPos}`);
    return [];
  }

  const node = token.parent;

  if (ts.isBinaryExpression(node)) {
    if (
      node.left.kind === ts.SyntaxKind.TrueKeyword &&
      node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
      node.right.kind === ts.SyntaxKind.TrueKeyword
    ) {
      const start = formatLineAndChar(sourceFile.getLineAndCharacterOfPosition(node.pos));
      const end = formatLineAndChar(sourceFile.getLineAndCharacterOfPosition(node.end));
      logger.info(`Can simplify tautology '${node.getText()}' at [${start}, ${end}]`);

      return [conditionalAlwaysTrueRefactoring];
    }
  }

  return [];
}
