import { create as createServer } from './fixtures/server/index';

const mockFileName = 'main.ts';

describe('test server', () => {
  it('should work', () => {
    const server = createServer();
    server.openMockFile(mockFileName, 'const q = Array.');
    server.send({
      command: 'completions',
      arguments: { file: mockFileName, offset: 16, line: 1 }
    });

    return server.close().then(() => {
      const completionsResponse = server.getFirstResponseOfType('completions');
      expect(completionsResponse).toBeDefined();
    });
  });
});
