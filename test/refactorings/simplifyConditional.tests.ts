import { test } from 'ava';
import { conditionalAlwaysTrueRefactoring } from '../../src/refactorings/simplifyConditional';
import { create as createServer } from '../fixtures/server/index';

const mockFileName = 'main.ts';

test('should be able to simplify a Tautology', t => {
  const server = createServer();
  server.openMockFile(mockFileName, `const some = true && true;`);
  server.send({
    command: 'getApplicableRefactors',
    arguments: { file: mockFileName, line: 1, offset: 14 }
  });

  return server.close().then(() => {
    const completionsResponse = server.getFirstResponseOfType('getApplicableRefactors');
    t.not(completionsResponse, undefined);
    t.is(completionsResponse.body.length, 1);
    t.deepEqual(completionsResponse.body[0], conditionalAlwaysTrueRefactoring);
  });
});

// TODO: implement the rest of the simplifications described here
// http://www.chrisstead.com/archives/820/refactoring-with-boolean-algebra-and-de-morgans-laws/
