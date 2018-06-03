import { test } from 'ava';
import {
  getApplicableRefactors,
  getEditsForRefactor,
  simplifyConditionalRefactoring
} from '../../src/refactorings/simplifyConditional';
import { validateRefactoring } from './validateRefactoring';

test(`should be able to simplify 'true && true' Tautology`, t => {
  validateRefactoring(
    `const some = [||]true && true;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyConditionalRefactoring.name,
      actionName: simplifyConditionalRefactoring.actions[0].name
    },
    `const some = true;`,
    t
  );
});

test(`should be able to simplify 'true && a' Tautology`, t => {
  validateRefactoring(
    `const some = [||]true && a;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyConditionalRefactoring.name,
      actionName: simplifyConditionalRefactoring.actions[0].name
    },
    `const some = a;`,
    t
  );
});

test(`should be able to simplify 'a && true' Tautology`, t => {
  validateRefactoring(
    `const some = [||]a && true;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyConditionalRefactoring.name,
      actionName: simplifyConditionalRefactoring.actions[0].name
    },
    `const some = a;`,
    t
  );
});

// TODO: implement the rest of the simplifications described here
// http://www.chrisstead.com/archives/820/refactoring-with-boolean-algebra-and-de-morgans-laws/
