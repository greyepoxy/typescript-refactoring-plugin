import * as ts from 'typescript/lib/tsserverlibrary';

export function getNodeText(
  node: ts.Node,
  sourceFile: ts.SourceFile = ts.createSourceFile('file.ts', '', ts.ScriptTarget.ES5)
): string {
  const nodePrinter = ts.createPrinter();

  const newText = nodePrinter.printNode(ts.EmitHint.Unspecified, node, sourceFile);

  return newText;
}
