import * as ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';
import { tryGetClosestBinaryExpression } from './tryGetTargetExpression';

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

function simplifyBinaryExpression(expression: ts.BinaryExpression): ts.Expression {
  if (expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    if (expression.left.kind === ts.SyntaxKind.TrueKeyword) {
      return expression.right;
    }
  }

  if (expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    if (expression.right.kind === ts.SyntaxKind.TrueKeyword) {
      return expression.left;
    }
  }

  if (expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    if (
      expression.left.kind === ts.SyntaxKind.FalseKeyword ||
      expression.right.kind === ts.SyntaxKind.FalseKeyword
    ) {
      return ts.createFalse();
    }
  }

  if (expression.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    if (
      expression.left.kind === ts.SyntaxKind.TrueKeyword ||
      expression.right.kind === ts.SyntaxKind.TrueKeyword
    ) {
      return ts.createTrue();
    }
  }

  if (expression.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    if (expression.left.kind === ts.SyntaxKind.FalseKeyword) {
      return expression.right;
    }
  }

  if (expression.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    if (expression.right.kind === ts.SyntaxKind.FalseKeyword) {
      return expression.left;
    }
  }

  if (
    expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
    expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken
  ) {
    if (
      (expression.left.kind === ts.SyntaxKind.TrueKeyword &&
        expression.right.kind === ts.SyntaxKind.TrueKeyword) ||
      (expression.left.kind === ts.SyntaxKind.FalseKeyword &&
        expression.right.kind === ts.SyntaxKind.FalseKeyword) ||
      (ts.isIdentifier(expression.left) &&
        ts.isIdentifier(expression.right) &&
        expression.left.text === expression.right.text)
    ) {
      return ts.createTrue();
    }
  }

  if (
    expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
    expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken
  ) {
    if (
      (expression.left.kind === ts.SyntaxKind.TrueKeyword &&
        expression.right.kind === ts.SyntaxKind.FalseKeyword) ||
      (expression.left.kind === ts.SyntaxKind.FalseKeyword &&
        expression.right.kind === ts.SyntaxKind.TrueKeyword)
    ) {
      return ts.createFalse();
    }
  }

  return ts.updateBinary(expression, expression.left, expression.right);
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

  const booleanExpression = tryGetClosestBinaryExpression(logger, sourceFile, positionOrRange);

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

    const booleanExpression = tryGetClosestBinaryExpression(logger, sourceFile, positionOrRange);

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

  logger.error(`Received request to perform unknown ${refactorName} action ${actionName}`);
  return undefined;
}

function getNodeText(node: ts.Node, sourceFile: ts.SourceFile): string {
  const nodePrinter = ts.createPrinter();

  const newText = nodePrinter.printNode(ts.EmitHint.Unspecified, node, sourceFile);

  return newText;
}
