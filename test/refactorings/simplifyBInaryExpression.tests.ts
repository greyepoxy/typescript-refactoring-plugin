import { Macro, test, TestContext } from 'ava';
import * as ts from 'typescript/lib/tsserverlibrary';
import { getNodeText } from '../../src/refactorings/printNode';
import { RefactoringAction } from '../../src/refactorings/refactoring';
import { removeRedundentTrueKeywordInAndExpressionRefactoring } from '../../src/refactorings/simplifyBinaryExpression';

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
