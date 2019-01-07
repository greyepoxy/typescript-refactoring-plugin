import { test } from 'ava';
import {
  andExpressionIsAlwaysFalseRefactoring,
  equalityExpressionIsAlwaysTrueRefactoring,
  getApplicableRefactors,
  getEditsForRefactor,
  orExpressionIsAlwaysTrueRefactoring,
  removeRedundentFalseKeywordInOrExpressionRefactoring,
  removeRedundentTrueKeywordInAndExpressionRefactoring,
  simplifyExpressionRefactoringName
} from '../../src/refactorings/simplifyBinaryExpression';
import { validateNoRefactoringOptions, validateRefactoring } from './validateRefactoring';

test(`should be able to remove redundant true keyword in 'and' expression`, t => {
  validateRefactoring(
    `const some = [||]a && true;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyExpressionRefactoringName,
      actionName: removeRedundentTrueKeywordInAndExpressionRefactoring.getInfo().name
    },
    `const some = a;`,
    t
  );
});

test(`should be able to remove redundant false keyword in 'or' expression`, t => {
  validateRefactoring(
    `const some = [||]a || false;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyExpressionRefactoringName,
      actionName: removeRedundentFalseKeywordInOrExpressionRefactoring.getInfo().name
    },
    `const some = a;`,
    t
  );
});

test(`should be able to simplify always false expression to false`, t => {
  validateRefactoring(
    `const some = [||]a && false;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyExpressionRefactoringName,
      actionName: andExpressionIsAlwaysFalseRefactoring.getInfo().name
    },
    `const some = false;`,
    t
  );
});

test(`should be able to simplify always true expression to true`, t => {
  validateRefactoring(
    `const some = [||]true || a;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyExpressionRefactoringName,
      actionName: orExpressionIsAlwaysTrueRefactoring.getInfo().name
    },
    `const some = true;`,
    t
  );
});

test(`should be able to simplify always true tautology to true`, t => {
  validateRefactoring(
    `const some = [||]a == a;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyExpressionRefactoringName,
      actionName: equalityExpressionIsAlwaysTrueRefactoring.getInfo().name
    },
    `const some = true;`,
    t
  );
});

test(`should not attempt to simplify expressions`, t => {
  validateNoRefactoringOptions(`const some = [||]a < 32;`, getApplicableRefactors, t);
});

// TODO: implement the rest of the simplifications described here
// http://www.chrisstead.com/archives/820/refactoring-with-boolean-algebra-and-de-morgans-laws/
