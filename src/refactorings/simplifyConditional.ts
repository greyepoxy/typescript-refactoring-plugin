import * as tsutils from 'tsutils';
import * as ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';

export const name = 'Simplify Conditional';
export const removeAlwaysTrueFromConjuctionExpression =
  'remove_always_true_proposition_from_and_boolean_expression';

export const simplifyConditionalRefactoring: ts.ApplicableRefactorInfo = {
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

function tryGetTargetExpression(
  logger: Logger,
  sourceFile: ts.SourceFile,
  positionOrRange: number | ts.TextRange
): ts.BinaryExpression | null {
  const startPos = typeof positionOrRange === 'number' ? positionOrRange : positionOrRange.pos;

  const token = tsutils.getTokenAtPosition(sourceFile, startPos);

  if (token === undefined || token.parent === undefined) {
    logger.error(`No token at given position ${startPos}`);
    return null;
  }

  const node = token.parent;

  if (ts.isBinaryExpression(node)) {
    return node;
  }

  return null;
}

export function getApplicableRefactors(
  program: ts.Program,
  logger: Logger,
  fileName: string,
  positionOrRange: number | ts.TextRange
): ts.ApplicableRefactorInfo[] {
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) {
    logger.error(`cannot load source file ${fileName}`);
    return [];
  }

  const maybeBinaryExpression = tryGetTargetExpression(logger, sourceFile, positionOrRange);

  if (maybeBinaryExpression == null) {
    return [];
  }

  if (
    maybeBinaryExpression.left.kind === ts.SyntaxKind.TrueKeyword &&
    maybeBinaryExpression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
  ) {
    const start = formatLineAndChar(
      sourceFile.getLineAndCharacterOfPosition(maybeBinaryExpression.pos)
    );
    const end = formatLineAndChar(
      sourceFile.getLineAndCharacterOfPosition(maybeBinaryExpression.end)
    );
    logger.info(
      `Can simplify tautology '${maybeBinaryExpression.getText()}' at [${start}, ${end}]`
    );

    return [simplifyConditionalRefactoring];
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
    const sourceFile = program.getSourceFile(fileName);
    if (sourceFile === undefined) {
      logger.error(`cannot load source file ${fileName}`);
      return undefined;
    }

    const maybeBinaryExpression = tryGetTargetExpression(logger, sourceFile, positionOrRange);

    if (maybeBinaryExpression == null) {
      return undefined;
    }

    if (
      maybeBinaryExpression.left.kind === ts.SyntaxKind.TrueKeyword &&
      maybeBinaryExpression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
    ) {
      return {
        edits: [
          {
            fileName: sourceFile.fileName,
            textChanges: [
              {
                span: {
                  start: maybeBinaryExpression.left.pos,
                  length: maybeBinaryExpression.right.end - maybeBinaryExpression.left.pos
                },
                newText: maybeBinaryExpression.right.getFullText()
              }
            ]
          }
        ],
        renameFilename: undefined,
        renameLocation: undefined
      };
    }

    logger.error(`Unable to perform requested ${refactorName} action ${actionName}`);
    return undefined;
  }

  logger.error(`Recieved request to perform unknown ${refactorName} action ${actionName}`);
  return undefined;
}
