import * as tsutils from 'tsutils';
import * as ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';

function findParentBinaryExpression(startNode: ts.Node): ts.BinaryExpression | null {
  if (ts.isBinaryExpression(startNode)) {
    return startNode;
  }

  return getNextParentBinaryExpression(startNode);
}

function getNextParentBinaryExpression(node: ts.Node): ts.BinaryExpression | null {
  if (ts.isSourceFile(node)) {
    return null;
  }

  if (ts.isBinaryExpression(node.parent)) {
    return node.parent;
  }

  return getNextParentBinaryExpression(node.parent);
}

export function tryGetClosestBinaryExpression(
  logger: Logger,
  sourceFile: ts.SourceFile,
  positionOrRange: number | ts.TextRange
): ts.BinaryExpression | null {
  const startPos = typeof positionOrRange === 'number' ? positionOrRange : positionOrRange.pos;

  const token = tsutils.getTokenAtPosition(sourceFile, startPos);

  if (token === undefined) {
    logger.error(`No token at given position ${startPos}`);
    return null;
  }

  return findParentBinaryExpression(token);
}
