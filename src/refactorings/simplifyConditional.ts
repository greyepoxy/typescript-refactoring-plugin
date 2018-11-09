import * as tsutils from 'tsutils';
import * as ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';

export const name = 'Simplify Conditional';
export const simplifyConstantBooleanExpression = 'simplify_constant_boolean_expression';

export const simplifyConditionalRefactoring: ts.ApplicableRefactorInfo = {
  name,
  description: 'Simplify this conditional',
  actions: [
    {
      name: simplifyConstantBooleanExpression,
      description: 'Remove extra constants from boolean expression'
    }
  ]
};

function formatLineAndChar(lineAndChar: ts.LineAndCharacter): string {
  return `(${lineAndChar.line}, ${lineAndChar.character})`;
}

function simplifyExpression(expression: ts.Expression): ts.Expression {
  if (ts.isBinaryExpression(expression)) {
    return simplifyBinaryExpression(expression);
  }

  return expression;
}

function simplifyBinaryExpression(expression: ts.BinaryExpression): ts.Expression {
  const simplifiedLeft = simplifyExpression(expression.left);
  const simplifiedRight = simplifyExpression(expression.right);

  if (expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    if (simplifiedLeft.kind === ts.SyntaxKind.TrueKeyword) {
      return simplifiedRight;
    }

    if (simplifiedRight.kind === ts.SyntaxKind.TrueKeyword) {
      return simplifiedLeft;
    }

    if (
      simplifiedLeft.kind === ts.SyntaxKind.FalseKeyword ||
      simplifiedRight.kind === ts.SyntaxKind.FalseKeyword
    ) {
      return ts.createFalse();
    }
  }

  if (expression.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    if (
      simplifiedLeft.kind === ts.SyntaxKind.TrueKeyword ||
      simplifiedRight.kind === ts.SyntaxKind.TrueKeyword
    ) {
      return ts.createTrue();
    }

    if (simplifiedLeft.kind === ts.SyntaxKind.FalseKeyword) {
      return simplifiedRight;
    }

    if (simplifiedRight.kind === ts.SyntaxKind.FalseKeyword) {
      return simplifiedLeft;
    }
  }

  if (
    expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
    expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken
  ) {
    if (
      (simplifiedLeft.kind === ts.SyntaxKind.TrueKeyword &&
        simplifiedRight.kind === ts.SyntaxKind.TrueKeyword) ||
      (simplifiedLeft.kind === ts.SyntaxKind.FalseKeyword &&
        simplifiedRight.kind === ts.SyntaxKind.FalseKeyword) ||
      (ts.isIdentifier(simplifiedLeft) &&
        ts.isIdentifier(simplifiedRight) &&
        simplifiedLeft.text === simplifiedRight.text)
    ) {
      return ts.createTrue();
    }

    if (
      (simplifiedLeft.kind === ts.SyntaxKind.TrueKeyword &&
        simplifiedRight.kind === ts.SyntaxKind.FalseKeyword) ||
      (simplifiedLeft.kind === ts.SyntaxKind.FalseKeyword &&
        simplifiedRight.kind === ts.SyntaxKind.TrueKeyword)
    ) {
      return ts.createFalse();
    }
  }

  return ts.updateBinary(expression, simplifiedLeft, simplifiedRight);
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

  return findLargestPossibleBinaryExpressionParentNode(token);
}

function findLargestPossibleBinaryExpressionParentNode(
  startNode: ts.Node
): ts.BinaryExpression | null {
  const firstBinaryExpression = getNextParentBinaryExpression(startNode);
  if (firstBinaryExpression === null) {
    return null;
  }

  let mostExpandedBinaryExpressionSelectionSoFar = firstBinaryExpression;
  let nextBinaryExpressionSelection: ts.BinaryExpression | null = null;
  while (nextBinaryExpressionSelection !== null) {
    mostExpandedBinaryExpressionSelectionSoFar = nextBinaryExpressionSelection;
    nextBinaryExpressionSelection = getNextParentBinaryExpression(nextBinaryExpressionSelection);
  }

  return mostExpandedBinaryExpressionSelectionSoFar;
}

function getNextParentBinaryExpression(node: ts.Node): ts.BinaryExpression | null {
  if (ts.isSourceFile(node)) {
    return null;
  }

  if (ts.isBinaryExpression(node.parent)) {
    return node.parent;
  }

  return getNextParentBinaryExpression(node.parent);
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

  const maybeSimplifiedBooleanExpression = simplifyBinaryExpression(booleanExpression);

  if (booleanExpression !== maybeSimplifiedBooleanExpression) {
    const start = formatLineAndChar(
      sourceFile.getLineAndCharacterOfPosition(booleanExpression.pos)
    );
    const end = formatLineAndChar(sourceFile.getLineAndCharacterOfPosition(booleanExpression.end));
    logger.info(
      `Can simplify binary expression '${booleanExpression.getText()}' at [${start}, ${end}]`
    );

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

  if (actionName === simplifyConstantBooleanExpression) {
    const sourceFile = program.getSourceFile(fileName);
    if (sourceFile === undefined) {
      logger.error(`cannot load source file ${fileName}`);
      return undefined;
    }

    const booleanExpression = tryGetTargetExpression(logger, sourceFile, positionOrRange);

    if (booleanExpression == null) {
      return undefined;
    }

    const maybeSimplifiedBooleanExpression = simplifyBinaryExpression(booleanExpression);

    if (booleanExpression !== maybeSimplifiedBooleanExpression) {
      const newText = ` ${getNodeText(maybeSimplifiedBooleanExpression, sourceFile)}`;

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
                newText
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

function getNodeText(node: ts.Node, sourceFile: ts.SourceFile): string {
  const nodePrinter = ts.createPrinter();

  const newText = nodePrinter.printNode(ts.EmitHint.Unspecified, node, sourceFile);

  return newText;
}
