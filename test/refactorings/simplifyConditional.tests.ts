import { test } from 'ava';
import {
  conditionalAlwaysTrueRefactoring,
  getApplicableRefactors
} from '../../src/refactorings/simplifyConditional';
import { GetMockLogger, GetProgram } from './mockLanguageService';

const mockFileName = 'main.ts';

test('should be able to simplify a Tautology', t => {
  const program = GetProgram({
    path: mockFileName,
    contents: `const some = true && true;`,
    scriptKindName: 'TS'
  });

  const result = getApplicableRefactors(program, GetMockLogger(), mockFileName, 14);

  t.not(result[0], undefined);
  t.deepEqual(result[0], conditionalAlwaysTrueRefactoring);
});

// TODO: implement the rest of the simplifications described here
// http://www.chrisstead.com/archives/820/refactoring-with-boolean-algebra-and-de-morgans-laws/
