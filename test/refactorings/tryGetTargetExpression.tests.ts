import { test } from 'ava';
import * as ts from 'typescript/lib/tsserverlibrary';
import { tryGetClosestBinaryExpression } from '../../src/refactorings/tryGetTargetExpression';
import {
  GetMockLogger,
  GetProgram,
  parseInputFileForSelection,
  TextSelection
} from './mockLanguageService';

function getProgramForSourceFileWithSelectionText(
  inputFileContentsWithSelection: string
): { textSelection: number | TextSelection; sourceFile: ts.SourceFile } {
  const { textSelection, fileContents } = parseInputFileForSelection(
    inputFileContentsWithSelection
  );

  const fileName = 'main.ts';
  const program = GetProgram({
    contents: fileContents,
    path: fileName,
    scriptKindName: 'TS'
  });
  const sourceFile = program.getSourceFile(fileName);

  if (sourceFile === undefined) {
    throw new Error(`Cannot load source file ${fileName}`);
  }

  return {
    textSelection,
    sourceFile
  };
}

test(`should return binary expression at cursor`, t => {
  const inputFileContentsWithSelection = `const some = [||]b && true;`;

  const { sourceFile, textSelection } = getProgramForSourceFileWithSelectionText(
    inputFileContentsWithSelection
  );

  const node: ts.BinaryExpression = tryGetClosestBinaryExpression(
    GetMockLogger(),
    sourceFile,
    textSelection
  )!;

  t.notDeepEqual(node, null);
  t.deepEqual(node.kind, ts.SyntaxKind.BinaryExpression);
  t.deepEqual(node.getText(), 'b && true');
});
