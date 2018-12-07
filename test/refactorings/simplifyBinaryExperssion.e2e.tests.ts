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

test(`should be able to simplify 'a && true'`, t => {
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

test(`should be able to simplify 'a && false'`, t => {
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

test(`should be able to simplify 'false && a'`, t => {
  validateRefactoring(
    `const some = [||]false && a;`,
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

test(`should be able to simplify 'a || false'`, t => {
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

test(`should be able to simplify 'false || a'`, t => {
  validateRefactoring(
    `const some = [||]false || a;`,
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

test(`should be able to simplify '<something> || false'`, t => {
  validateRefactoring(
    `const some = [||](5 < a) || false;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyExpressionRefactoringName,
      actionName: removeRedundentFalseKeywordInOrExpressionRefactoring.getInfo().name
    },
    `const some = (5 < a);`,
    t
  );
});

test(`should be able to simplify 'a || true'`, t => {
  validateRefactoring(
    `const some = [||]a || true;`,
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

test(`should be able to simplify '(true && false) || true'`, t => {
  validateRefactoring(
    `const some = [||](true && false) || true;`,
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

test(`should be able to simplify 'true || a'`, t => {
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

test(`should be able to simplify 'a == a' tautology`, t => {
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
