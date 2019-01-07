import { Macro, test, TestContext } from 'ava';
import * as ts from 'typescript/lib/tsserverlibrary';
import { getNodeText } from '../../src/refactorings/printNode';
import { RefactoringAction } from '../../src/refactorings/refactoring';
import {
  removeRedundentFalseKeywordInOrExpressionRefactoring,
  removeRedundentTrueKeywordInAndExpressionRefactoring
} from '../../src/refactorings/simplifyBinaryExpression';

function getValidateSingleNodeRefactoringMacro<
  TInputNode extends ts.Node,
  TResultNode extends ts.Node
>(refactoringAction: RefactoringAction<TInputNode, TResultNode>): Macro<TestContext> {
  const macro: Macro<TestContext> = (
    t,
    inputNode: TInputNode,
    expectedResult: TResultNode | null
  ) => {
    const actual = refactoringAction.nodeRefactoring(inputNode);

    t.deepEqual(actual, expectedResult);
  };

  macro.title = (providedTitle: '', inputNode: TInputNode, expectedResult: TResultNode | null) => {
    const expectedResultText = expectedResult === null ? 'null' : getNodeText(expectedResult);
    return `refactoring action ${refactoringAction.name} should refactor ${getNodeText(
      inputNode
    )} to ${expectedResultText}' ${providedTitle}`.trim();
  };

  return macro;
}

const validateRedundentTrueKeywordInAndExpressionRefactoringMacro = getValidateSingleNodeRefactoringMacro(
  removeRedundentTrueKeywordInAndExpressionRefactoring
);

test(
  validateRedundentTrueKeywordInAndExpressionRefactoringMacro,
  ts.createBinary(ts.createTrue(), ts.SyntaxKind.AmpersandAmpersandToken, ts.createFalse()),
  ts.createFalse()
);

test(
  validateRedundentTrueKeywordInAndExpressionRefactoringMacro,
  ts.createBinary(ts.createTrue(), ts.SyntaxKind.AmpersandAmpersandToken, ts.createTrue()),
  ts.createTrue()
);

test(
  validateRedundentTrueKeywordInAndExpressionRefactoringMacro,
  ts.createBinary(ts.createTrue(), ts.SyntaxKind.AmpersandAmpersandToken, ts.createIdentifier('a')),
  ts.createIdentifier('a')
);

test(
  validateRedundentTrueKeywordInAndExpressionRefactoringMacro,
  ts.createBinary(ts.createIdentifier('a'), ts.SyntaxKind.AmpersandAmpersandToken, ts.createTrue()),
  ts.createIdentifier('a')
);

const validateRemoveRedundentFalseKeywordInOrExpressionRefactoringMacro = getValidateSingleNodeRefactoringMacro(
  removeRedundentFalseKeywordInOrExpressionRefactoring
);

test(
  validateRemoveRedundentFalseKeywordInOrExpressionRefactoringMacro,
  ts.createBinary(ts.createIdentifier('a'), ts.SyntaxKind.BarBarToken, ts.createFalse()),
  ts.createIdentifier('a')
);

test(
  validateRemoveRedundentFalseKeywordInOrExpressionRefactoringMacro,
  ts.createBinary(ts.createFalse(), ts.SyntaxKind.BarBarToken, ts.createIdentifier('a')),
  ts.createIdentifier('a')
);

test(
  validateRemoveRedundentFalseKeywordInOrExpressionRefactoringMacro,
  ts.createBinary(ts.createFalse(), ts.SyntaxKind.BarBarToken, ts.createFalse()),
  ts.createFalse()
);

test(
  validateRemoveRedundentFalseKeywordInOrExpressionRefactoringMacro,
  ts.createBinary(ts.createTrue(), ts.SyntaxKind.BarBarToken, ts.createFalse()),
  ts.createTrue()
);

test(
  validateRemoveRedundentFalseKeywordInOrExpressionRefactoringMacro,
  ts.createBinary(ts.createFalse(), ts.SyntaxKind.BarBarToken, ts.createTrue()),
  ts.createTrue()
);

test(
  validateRemoveRedundentFalseKeywordInOrExpressionRefactoringMacro,
  ts.createBinary(
    ts.createBinary(
      ts.createLiteral(5),
      ts.SyntaxKind.LessThanLessThanToken,
      ts.createIdentifier('a')
    ),
    ts.SyntaxKind.BarBarToken,
    ts.createFalse()
  ),
  ts.createBinary(
    ts.createLiteral(5),
    ts.SyntaxKind.LessThanLessThanToken,
    ts.createIdentifier('a')
  )
);
