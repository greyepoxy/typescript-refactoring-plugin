import { Macro, test, TestContext } from 'ava';
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

const validateNodeSelectionMacro: Macro<TestContext> = (
  t,
  inputFileContentsWithSelection: string,
  expectedNodeText: string
) => {
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
  t.deepEqual(node.getText(), expectedNodeText);
};

validateNodeSelectionMacro.title = (
  providedTitle = '',
  inputFileContentsWithSelection: string,
  expectedNodeText: string
) =>
  `should select '${expectedNodeText}' from ${inputFileContentsWithSelection} ${providedTitle}`.trim();

test(validateNodeSelectionMacro, `const some = [||]b && true;`, 'b && true');
