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

function removeRedundentTrueKeywordInAndExpression(
  expression: ts.BinaryExpression
): ts.Expression | null {
  if (expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    if (expression.left.kind === ts.SyntaxKind.TrueKeyword) {
      return expression.right;
    }

    if (expression.right.kind === ts.SyntaxKind.TrueKeyword) {
      return expression.left;
    }
  }

  return null;
}

function removeRedundentFalseKeywordInOrExpression(
  expression: ts.BinaryExpression
): ts.Expression | null {
  if (expression.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    if (expression.left.kind === ts.SyntaxKind.FalseKeyword) {
      return expression.right;
    }

    if (expression.right.kind === ts.SyntaxKind.FalseKeyword) {
      return expression.left;
    }
  }

  return null;
}

function andExpressionIsAlwaysFalse(expression: ts.BinaryExpression): ts.Expression | null {
  if (expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    if (
      expression.left.kind === ts.SyntaxKind.FalseKeyword ||
      expression.right.kind === ts.SyntaxKind.FalseKeyword
    ) {
      return ts.createFalse();
    }
  }

  return null;
}

function orExpressionIsAlwaysTrue(expression: ts.BinaryExpression): ts.Expression | null {
  if (expression.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    if (
      expression.left.kind === ts.SyntaxKind.TrueKeyword ||
      expression.right.kind === ts.SyntaxKind.TrueKeyword
    ) {
      return ts.createTrue();
    }
  }

  return null;
}

function equalityExpressionIsAlwaysTrue(expression: ts.BinaryExpression): ts.Expression | null {
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

  return null;
}

function equalityExpressionIsAlwaysFalse(expression: ts.BinaryExpression): ts.Expression | null {
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

  return null;
}

const simplifyBinaryExpressionRefactorings = [
  removeRedundentTrueKeywordInAndExpression,
  andExpressionIsAlwaysFalse,
  orExpressionIsAlwaysTrue,
  removeRedundentFalseKeywordInOrExpression,
  equalityExpressionIsAlwaysTrue,
  equalityExpressionIsAlwaysFalse
];

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

  return simplifyBinaryExpressionRefactorings
    .map(refactoringFunc => refactoringFunc(booleanExpression))
    .filter((result: ts.Expression | null): result is ts.Expression => result !== null)
    .map(_refactoringResult => {
      const start = formatLineAndChar(
        sourceFile.getLineAndCharacterOfPosition(booleanExpression.pos)
      );
      const end = formatLineAndChar(
        sourceFile.getLineAndCharacterOfPosition(booleanExpression.end)
      );
      logger.info(
        `Can simplify binary expression '${booleanExpression.getText()}' at [${start}, ${end}]`
      );

      return simplifyConditionalRefactoring;
    });
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

    const edits = simplifyBinaryExpressionRefactorings
      .map(refactoringFunc => refactoringFunc(booleanExpression))
      .filter((result: ts.Expression | null): result is ts.Expression => result !== null)
      .map(refactoringResult => {
        const newText = ` ${getNodeText(refactoringResult, sourceFile)}`;

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
      });

    if (edits.length !== 0) {
      return edits[0];
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
