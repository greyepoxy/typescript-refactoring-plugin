import { test } from 'ava';
import { create as createServer } from './fixtures/server/index';

const mockFileName = 'main.ts';

test('[e2e] built in extract function/constant should still work', t => {
  const server = createServer();
  server.openMockFile(mockFileName, `const q = 5;`);
  server.send({
    command: 'getApplicableRefactors',
    arguments: { file: mockFileName, startLine: 1, startOffset: 11, endLine: 1, endOffset: 12 }
  });

  return server.close().then(() => {
    const completionsResponse = server.getFirstResponseOfType('getApplicableRefactors');
    t.not(completionsResponse, undefined);
    t.is(completionsResponse.body.length, 2);
    t.is(completionsResponse.body[0].name, 'Extract Symbol');
    t.is(completionsResponse.body[0].actions[0].name, 'function_scope_0');
    t.is(completionsResponse.body[1].name, 'Extract Symbol');
    t.is(completionsResponse.body[1].actions[0].name, 'constant_scope_0');
  });
});

test('[e2e] should return plugin defined refactorings', t => {
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
    t.deepEqual(completionsResponse.body[0].name, 'simplify_expression');
  });
});
