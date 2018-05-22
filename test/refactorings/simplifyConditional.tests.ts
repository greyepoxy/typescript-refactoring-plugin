import { test } from 'ava';
import {
  conditionalAlwaysTrueRefactoring,
  getApplicableRefactors,
  getEditsForRefactor
} from '../../src/refactorings/simplifyConditional';
import { GetMockLogger, GetProgram } from './mockLanguageService';

const mockFileName = 'main.ts';

test(`should be able to simplify a 'true && true' Tautology`, t => {
  const program = GetProgram({
    path: mockFileName,
    contents: `const some = true && true;`,
    scriptKindName: 'TS'
  });
  const logger = GetMockLogger();

  const refactoring = getApplicableRefactors(program, logger, mockFileName, 14);

  t.not(refactoring[0], undefined);
  t.deepEqual(refactoring[0], conditionalAlwaysTrueRefactoring);

  const result = getEditsForRefactor(
    program,
    logger,
    mockFileName,
    {},
    14,
    refactoring[0].name,
    refactoring[0].actions[0].name
  );

  t.not(result, undefined);
  if (result !== undefined) {
    t.deepEqual(result.edits[0].fileName, mockFileName);
    t.deepEqual(result.edits[0].textChanges[0].span, { start: 12, length: 13 });
    t.deepEqual(result.edits[0].textChanges[0].newText, 'true');
  }
});

// TODO: implement the rest of the simplifications described here
// http://www.chrisstead.com/archives/820/refactoring-with-boolean-algebra-and-de-morgans-laws/
