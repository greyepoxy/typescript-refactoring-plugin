import { posix as path } from 'path';
import * as ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../../src/logger';

export interface MockFile {
  path: string;
  contents: string;
  scriptKindName: ts.server.protocol.ScriptKindName;
}

export function GetProgram(rootFile: MockFile, referencedFiles?: MockFile[]) {
  const documentRegistry = ts.createDocumentRegistry();
  const mockHost = new MockLanguageService(rootFile, referencedFiles);
  const service = ts.createLanguageService(mockHost, documentRegistry);
  const program = service.getProgram();

  if (program === undefined) {
    throw new Error('Unable to get program from Mock Language Service');
  }

  return program;
}

export function GetMockLogger(): Logger {
  return {
    info: () => {
      // do nothing
    },
    error: (msg: string) => console.error(msg)
  };
}

export class MockLanguageService implements ts.LanguageServiceHost {
  private rootFile: MockFile;
  private allFiles: MockFile[];

  constructor(rootFile: MockFile, referencedFiles?: MockFile[]) {
    this.rootFile = rootFile;
    this.allFiles = (referencedFiles || []).concat(rootFile);
  }

  public getCompilationSettings(): ts.CompilerOptions {
    return {
      target: ts.ScriptTarget.ES2015,
      module: ts.ModuleKind.CommonJS,
      types: [],
      strict: true
    };
  }
  public getScriptFileNames(): string[] {
    return this.allFiles.map(file => file.path);
  }
  public getScriptVersion(_fileName: string): string {
    return '0';
  }
  public getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
    const maybeFile = this.allFiles.find(file => file.path === fileName);
    if (maybeFile !== undefined) {
      return ts.ScriptSnapshot.fromString(maybeFile.contents);
    }
    return undefined;
  }
  public getCurrentDirectory(): string {
    return path.dirname(this.rootFile.path);
  }
  public getDefaultLibFileName(_options: ts.CompilerOptions): string {
    return 'lib.d.ts';
  }
}

export interface TextSelection {
  pos: number;
  end: number;
}

function tryParseInputFileForSelection(fileContents: string): TextSelection | null {
  const selectionRegex = /\[\|.*\|\]/s;

  const match = selectionRegex.exec(fileContents);
  if (match == null) {
    return null;
  }

  return {
    pos: match.index,
    end: selectionRegex.lastIndex
  };
}

export function parseInputFileForSelection(
  fileContentsWithTextSelection: string
): { textSelection: TextSelection | number; fileContents: string } {
  const textSelection = tryParseInputFileForSelection(fileContentsWithTextSelection);

  if (textSelection == null) {
    throw new Error(`Expected input file to have some text selected (using '[|...|]')'`);
  }

  return {
    textSelection: textSelection.pos === textSelection.end ? textSelection.pos : textSelection,
    fileContents: removeSelectionFromFile(fileContentsWithTextSelection)
  };
}

function removeSelectionFromFile(fileContents: string): string {
  return fileContents.replace('[|', '').replace('|]', '');
}
