import { ChildProcess, fork } from 'child_process';
import * as path from 'path';
import * as readline from 'readline';
import * as ts from 'typescript/lib/tsserverlibrary';
import { appPath, fixturesLibDirPath } from '../../paths';

class TSServer {
  public responses: any[];
  private exitPromise: Promise<number>;
  private isClosed: boolean;
  private server: ChildProcess;
  private seq: number;

  constructor() {
    const projectRoot = path.join(fixturesLibDirPath, 'server');
    const logFile = path.join(projectRoot, 'log.txt');
    const tsserverPath = path.join(appPath, 'node_modules', 'typescript', 'lib', 'tsserver');
    const server = fork(
      tsserverPath,
      [
        '--logVerbosity',
        'verbose',
        '--logFile',
        logFile,
        '--globalPlugins',
        path.resolve(__dirname, '../../../../')
      ],
      {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
      }
    );
    this.exitPromise = new Promise((resolve, reject) => {
      server.on('exit', code => resolve(code));
      server.on('error', reason => reject(reason));
    });
    server.stdout.setEncoding('utf-8');
    readline
      .createInterface({
        input: server.stdout
      })
      .on('line', line => {
        if (line[0] === '{') {
          this.responses.push(JSON.parse(line));
        }
      });

    this.isClosed = false;
    this.server = server;
    this.seq = 0;
    this.responses = [];

    this.send({
      command: 'compilerOptionsForInferredProjects',
      arguments: {
        options: {
          target: ts.server.protocol.ScriptTarget.ES2015,
          module: ts.server.protocol.ModuleKind.CommonJS,
          types: [],
          strict: true
        }
      }
    });
  }

  public send(command: { command: string; arguments: object }) {
    const seq = ++this.seq;
    const req = JSON.stringify(Object.assign({ seq, type: 'request' }, command)) + '\n';
    this.server.stdin.write(req);
  }

  public close() {
    if (!this.isClosed) {
      this.isClosed = true;
      this.server.stdin.end();
    }
    return this.exitPromise;
  }

  public openMockFile(filePathFromPrjCwd: string, fileContent: string): TSServer {
    this.send({
      arguments: {
        file: filePathFromPrjCwd,
        fileContent,
        scriptKindName: 'TS'
      },
      command: 'open'
    });
    return this;
  }

  public getFirstResponseOfType(command: string): any {
    const response = this.responses.find(serverResponse => serverResponse.command === command);

    if (response === undefined) {
      throw new Error(`No response for command ${command} given`);
    }

    return response;
  }

  public getResponsesOfType(command: string): any[] {
    return this.responses.filter(responseFromServer => responseFromServer.command === command);
  }
}

export function create() {
  return new TSServer();
}
