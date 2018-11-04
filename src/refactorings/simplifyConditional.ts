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
  positionOrRange: number | ts.TextRange,
  _preferences: ts.UserPreferences | undefined
): ts.ApplicableRefactorInfo[] {
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) {
    logger.error(`cannot load source file ${fileName}`);
    return [];
  }

  const booleanExpression = tryGetTargetExpression(logger, sourceFile, positionOrRange);

  if (booleanExpression == null) {
    return [];
  }

  if (
    (booleanExpression.left.kind === ts.SyntaxKind.TrueKeyword || booleanExpression.right.kind) &&
    booleanExpression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
  ) {
    const start = formatLineAndChar(
      sourceFile.getLineAndCharacterOfPosition(booleanExpression.pos)
    );
    const end = formatLineAndChar(sourceFile.getLineAndCharacterOfPosition(booleanExpression.end));
    logger.info(`Can simplify tautology '${booleanExpression.getText()}' at [${start}, ${end}]`);

    return [simplifyConditionalRefactoring];
  }

  return [];
}

export function getEditsForRefactor(
  program: ts.Program,
  logger: Logger,
  fileName: string,
  _formatOptions: ts.FormatCodeSettings,
  positionOrRange: number | ts.TextRange,
  refactorName: string,
  actionName: string,
  _preferences: ts.UserPreferences | undefined
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

    const booleanExpression = tryGetTargetExpression(logger, sourceFile, positionOrRange);

    if (booleanExpression == null) {
      return undefined;
    }

    if (
      (booleanExpression.left.kind === ts.SyntaxKind.TrueKeyword || booleanExpression.right.kind) &&
      booleanExpression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
    ) {
      const expressionToKeep =
        booleanExpression.left.kind === ts.SyntaxKind.TrueKeyword
          ? booleanExpression.right
          : booleanExpression.left;

      return {
        edits: [
          {
            fileName: sourceFile.fileName,
            textChanges: [
              {
                span: {
                  start: booleanExpression.left.pos,
                  length: booleanExpression.right.end - booleanExpression.left.pos
                },
                newText: expressionToKeep.getFullText()
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
