import * as tsutils from 'tsutils';
import * as ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';

export const name = 'Simplify Conditional';
export const removeAlwaysTrueFromConjuctionExpression =
  'remove_always_true_proposition_from_and_boolean_expression';

export const conditionalAlwaysTrueRefactoring: ts.ApplicableRefactorInfo = {
  name,
  description: 'Simplify this conditional',
  actions: [
    {
      name: removeAlwaysTrueFromConjuctionExpression,
      description: 'Remove always true proposition from boolean expression conjunction.'
    }
  ]
};

function formatLineAndChar(lineAndChar: ts.LineAndCharacter): string {
  return `(${lineAndChar.line}, ${lineAndChar.character})`;
}

export function getApplicableRefactors(
  program: ts.Program,
  logger: Logger,
  fileName: string,
  positionOrRange: number | ts.TextRange
): ts.ApplicableRefactorInfo[] {
  const startPos = typeof positionOrRange === 'number' ? positionOrRange : positionOrRange.pos;

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

export function getEditsForRefactor(
  program: ts.Program,
  logger: Logger,
  fileName: string,
  // tslint:disable-next-line:variable-name
  _formatOptions: ts.FormatCodeSettings,
  positionOrRange: number | ts.TextRange,
  refactorName: string,
  actionName: string
): ts.RefactorEditInfo | undefined {
  if (refactorName !== name) {
    return undefined;
  }

  if (actionName === removeAlwaysTrueFromConjuctionExpression) {
    const startPos = typeof positionOrRange === 'number' ? positionOrRange : positionOrRange.pos;

    const sourceFile = program.getSourceFile(fileName);
    if (sourceFile === undefined) {
      logger.error(`cannot load source file ${fileName}`);
      return undefined;
    }

    const token = tsutils.getTokenAtPosition(sourceFile, startPos);

    if (token === undefined || token.parent === undefined) {
      logger.error(`No token at given position ${startPos}`);
      return undefined;
    }

    const node = token.parent;

    if (ts.isBinaryExpression(node)) {
      if (
        node.left.kind === ts.SyntaxKind.TrueKeyword &&
        node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
        node.right.kind === ts.SyntaxKind.TrueKeyword
      ) {
        return {
          edits: [
            {
              fileName: sourceFile.fileName,
              textChanges: [
                {
                  span: { start: node.left.pos, length: node.right.end - node.left.pos },
                  newText: 'true'
                }
              ]
            }
          ],
          renameFilename: undefined,
          renameLocation: undefined
        };
      }
    }

    logger.error(`Unable to perform requested ${refactorName} action ${actionName}`);
  }

  logger.error(`Recieved request to perform unknown ${refactorName} action ${actionName}`);
  return undefined;
}
