import { test } from 'ava';
import * as ts from 'typescript/lib/tsserverlibrary';
import { tryGetTargetExpression } from '../../src/refactorings/tryGetTargetExpression';
import { GetMockLogger, GetProgram, parseInputFileForSelection } from './mockLanguageService';

test(`should return binary expression at cursor`, t => {
  const inputFileContentsWithSelection = `const some = [||]b && true;`;

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

  const logger = GetMockLogger();

  if (sourceFile === undefined) {
    t.fail(`cannot load source file ${fileName}`);
    return;
  }

  const node: ts.BinaryExpression = tryGetTargetExpression(logger, sourceFile, textSelection)!;

  t.notDeepEqual(node, null);

  t.deepEqual(node.kind, ts.SyntaxKind.BinaryExpression);
  t.deepEqual(node.getText(), 'b && true');
});
