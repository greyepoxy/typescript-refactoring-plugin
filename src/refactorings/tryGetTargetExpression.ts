import * as tsutils from 'tsutils';
import { Logger } from '../logger';
import { findLargestPossibleBinaryExpressionParentNode } from './simplifyConditional';

export function tryGetTargetExpression(
  logger: Logger,
  sourceFile: ts.SourceFile,
  positionOrRange: number | ts.TextRange
): ts.BinaryExpression | null {
  const startPos = typeof positionOrRange === 'number' ? positionOrRange : positionOrRange.pos;

  const token = tsutils.getTokenAtPosition(sourceFile, startPos);

  if (token === undefined || token.parent === undefined) {
    logger.error(`No token at given position ${startPos}`);
    return null;
  }
  return findLargestPossibleBinaryExpressionParentNode(token);
}
