import * as tsutils from 'tsutils';
import * as ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';

function getChildrenSatisfyingPredicate<T extends ts.Node>(
  predicate: (node: ts.Node) => node is T,
  parentNode: ts.Node
): T[] {
  const childrenOfType: T[] = [];

  ts.forEachChild(parentNode, node => {
    if (predicate(node)) {
      childrenOfType.push(node);
    }
  });

  return childrenOfType;
}

function tryGetNextParentBinaryExpression(node: ts.Node): ts.BinaryExpression | null {
  if (ts.isSourceFile(node)) {
    return null;
  }

  if (ts.isBinaryExpression(node)) {
    return node;
  }

  return tryGetNextParentBinaryExpression(node.parent);
}

function getParentTraceForNode(startNode: ts.Node): ts.Node[] {
  const startNodeParentTrace = [startNode];

  let currentNode = startNode;
  while (!ts.isSourceFile(currentNode)) {
    currentNode = currentNode.parent;
    startNodeParentTrace.push(currentNode);
  }

  return startNodeParentTrace;
}

function tryGetCommonParentForStartAndEndNode(startNode: ts.Node, endNode: ts.Node): ts.Node {
  const startNodeParentTrace = getParentTraceForNode(startNode);
  const endNodeParentTrace = getParentTraceForNode(endNode);

  const commonParent = endNodeParentTrace.find(node => startNodeParentTrace.indexOf(node) > -1);

  if (commonParent === undefined) {
    throw new Error(
      `No common parent between startNode ${startNode.getText()} and endNode ${endNode.getText()}`
    );
  }

  return commonParent;
}

export function tryGetClosestBinaryExpression(
  logger: Logger,
  sourceFile: ts.SourceFile,
  positionOrRange: number | ts.TextRange
): ts.BinaryExpression | null {
  const [startSelectionPosition, endSelectionPosition] =
    typeof positionOrRange === 'number'
      ? [positionOrRange, positionOrRange]
      : [positionOrRange.pos, positionOrRange.end];

  const startPositionNode = tsutils.getTokenAtPosition(sourceFile, startSelectionPosition);
  if (startPositionNode === undefined) {
    logger.error(`No token at given position ${startSelectionPosition}`);
    return null;
  }

  if (startSelectionPosition === endSelectionPosition) {
    const startPositionBinaryExpression = tryGetNextParentBinaryExpression(startPositionNode);
    if (startPositionBinaryExpression === null) {
      logger.info(`No binary expression found from given position ${startSelectionPosition}`);
    }

    return startPositionBinaryExpression;
  }

  const endPositionNode = tsutils.getTokenAtPosition(sourceFile, endSelectionPosition - 1);
  if (endPositionNode === undefined) {
    logger.error(`No token at given position ${startSelectionPosition}`);
    return null;
  }

  const commonParent = tryGetCommonParentForStartAndEndNode(startPositionNode, endPositionNode);

  const childBinaryExpressions = getChildrenSatisfyingPredicate(
    ts.isBinaryExpression,
    commonParent
  );
  if (childBinaryExpressions.length === 1) {
    return childBinaryExpressions[0] as ts.BinaryExpression;
  }

  const commonParentBinaryExpression = tryGetNextParentBinaryExpression(commonParent);
  if (commonParentBinaryExpression === null) {
    logger.info(
      `No binary expression found for selection ${startSelectionPosition}, ${endSelectionPosition}`
    );
  }

  return commonParentBinaryExpression;
}
