import * as ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';
import { RefactoringAction, RefactoringResult } from './refactoring';
import { tryGetClosestBinaryExpression } from './tryGetTargetExpression';

export const simplifyExpressionRefactoringName = 'simplify_expression';

export const tryGetSimplifyConditionalRefactoring = (
  actions: ts.RefactorActionInfo[]
): ts.ApplicableRefactorInfo[] => {
  return actions.length !== 0
    ? [
        {
          name: simplifyExpressionRefactoringName,
          description: 'Simplify Expression',
          actions
        }
      ]
    : [];
};

function formatLineAndChar(lineAndChar: ts.LineAndCharacter): string {
  return `(${lineAndChar.line}, ${lineAndChar.character})`;
}

export const removeRedundentTrueKeywordInAndExpressionRefactoring = new RefactoringAction(
  'remove_redundant_true_keyword_in_and_expression',
  'remove redundant true keyword from expression',
  tryGetClosestBinaryExpression,
  (expression: ts.BinaryExpression): ts.Expression | null => {
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
);

export const removeRedundentFalseKeywordInOrExpressionRefactoring = new RefactoringAction(
  'remove_redundant_false_keyword_in_or_expression',
  'remove redundant false keyword from or expression',
  tryGetClosestBinaryExpression,
  (expression: ts.BinaryExpression): ts.Expression | null => {
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
);

export const andExpressionIsAlwaysFalseRefactoring = new RefactoringAction(
  'and_expression_is_always_false',
  'expression is always false',
  tryGetClosestBinaryExpression,
  (expression: ts.BinaryExpression): ts.Expression | null => {
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
);

export const orExpressionIsAlwaysTrueRefactoring = new RefactoringAction(
  'or_expression_is_always_true',
  'expression is always true',
  tryGetClosestBinaryExpression,
  (expression: ts.BinaryExpression): ts.Expression | null => {
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
);

export const equalityExpressionIsAlwaysTrueRefactoring = new RefactoringAction(
  'equality_expression_is_always_true',
  'expression is always true',
  tryGetClosestBinaryExpression,
  (expression: ts.BinaryExpression): ts.Expression | null => {
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
);

export const equalityExpressionIsAlwaysFalseRefactoring = new RefactoringAction(
  'equality_expression_is_always_false',
  'expression is always false',
  tryGetClosestBinaryExpression,
  (expression: ts.BinaryExpression): ts.Expression | null => {
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
);

const simplifyBinaryExpressionRefactorings = [
  removeRedundentTrueKeywordInAndExpressionRefactoring,
  removeRedundentFalseKeywordInOrExpressionRefactoring,
  andExpressionIsAlwaysFalseRefactoring,
  orExpressionIsAlwaysTrueRefactoring,
  equalityExpressionIsAlwaysTrueRefactoring,
  equalityExpressionIsAlwaysFalseRefactoring
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

  const refactoringActions = simplifyBinaryExpressionRefactorings
    .map(refactoring => refactoring.attemptRefactoring(logger, sourceFile, positionOrRange))
    .filter(
      (
        result: RefactoringResult<ts.BinaryExpression, ts.Expression> | null
      ): result is RefactoringResult<ts.BinaryExpression, ts.Expression> => result !== null
    )
    .map(refactoringResult => {
      const start = formatLineAndChar(
        sourceFile.getLineAndCharacterOfPosition(refactoringResult.matched.pos)
      );
      const end = formatLineAndChar(
        sourceFile.getLineAndCharacterOfPosition(refactoringResult.matched.end)
      );
      logger.info(
        `Can simplify binary expression '${refactoringResult.matched.getText()}' at [${start}, ${end}]`
      );

      return refactoringResult.appliedRefactoringAction.getInfo();
    });

  return tryGetSimplifyConditionalRefactoring(refactoringActions);
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
  if (refactorName !== simplifyExpressionRefactoringName) {
    return undefined;
  }

  const matchingRefactoring = simplifyBinaryExpressionRefactorings.find(
    refactoring => refactoring.name === actionName
  );

  if (matchingRefactoring === undefined) {
    logger.error(`Cannot find ${refactorName} action ${actionName}`);
    return undefined;
  }

  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) {
    logger.error(`cannot load source file ${fileName}`);
    return undefined;
  }

  const refactoringResult = matchingRefactoring.attemptRefactoring(
    logger,
    sourceFile,
    positionOrRange
  );

  if (refactoringResult === null) {
    logger.error(`Unable to perform requested ${refactorName} action ${actionName}`);
    return undefined;
  }

  const newText = ` ${getNodeText(refactoringResult.result, sourceFile)}`;

  return {
    edits: [
      {
        fileName: sourceFile.fileName,
        textChanges: [
          {
            span: {
              start: refactoringResult.matched.pos,
              length: refactoringResult.matched.end - refactoringResult.matched.pos
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

function getNodeText(node: ts.Node, sourceFile: ts.SourceFile): string {
  const nodePrinter = ts.createPrinter();

  const newText = nodePrinter.printNode(ts.EmitHint.Unspecified, node, sourceFile);

  return newText;
}
