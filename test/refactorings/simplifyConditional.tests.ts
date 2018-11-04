import { test } from 'ava';
import {
  getApplicableRefactors,
  getEditsForRefactor,
  simplifyConditionalRefactoring,
  simplifyConstantBooleanExpression
} from '../../src/refactorings/simplifyConditional';
import { validateRefactoring } from './validateRefactoring';

test(`should be able to simplify 'true && true'`, t => {
  validateRefactoring(
    `const some = [||]true && true;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyConditionalRefactoring.name,
      actionName: simplifyConstantBooleanExpression
    },
    `const some = true;`,
    t
  );
});

test(`should be able to simplify 'false && true'`, t => {
  validateRefactoring(
    `const some = [||]false && true;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyConditionalRefactoring.name,
      actionName: simplifyConstantBooleanExpression
    },
    `const some = false;`,
    t
  );
});

test(`should be able to simplify 'true && a'`, t => {
  validateRefactoring(
    `const some = [||]true && a;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyConditionalRefactoring.name,
      actionName: simplifyConstantBooleanExpression
    },
    `const some = a;`,
    t
  );
});

test(`should be able to simplify 'a && true'`, t => {
  validateRefactoring(
    `const some = [||]a && true;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyConditionalRefactoring.name,
      actionName: simplifyConstantBooleanExpression
    },
    `const some = a;`,
    t
  );
});

// TODO: implement the rest of the simplifications described here
// http://www.chrisstead.com/archives/820/refactoring-with-boolean-algebra-and-de-morgans-laws/
