import * as tsutils from 'tsutils';
import * as ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';

export const name = 'Simplify Conditional';
export const simplifyConstantBooleanExpression = 'simplify_constant_boolean_expression';

export const simplifyConditionalRefactoring: ts.ApplicableRefactorInfo = {
  name,
  description: 'Simplify this conditional',
  actions: [
    {
      name: simplifyConstantBooleanExpression,
      description: 'Remove extra constants from boolean expression'
    }
  ]
};

function formatLineAndChar(lineAndChar: ts.LineAndCharacter): string {
  return `(${lineAndChar.line}, ${lineAndChar.character})`;
}

interface Variable {
  _: 'variable';
  token: string;
}
interface TrueValue {
  _: 'true';
}
interface FalseValue {
  _: 'false';
}

type BooleanExpression = BooleanConjunction | Variable | TrueValue | FalseValue;
type BooleanOperator = 'and' | 'or' | 'equal';

interface BooleanConjunction {
  _: 'conjunction';
  left: BooleanExpression;
  right: BooleanExpression;
  operator: BooleanOperator;
}

function parseOutBooleanExpression(expression: ts.Expression): BooleanExpression | null {
  if (expression.kind === ts.SyntaxKind.TrueKeyword) {
    return { _: 'true' };
  }

  if (expression.kind === ts.SyntaxKind.FalseKeyword) {
    return { _: 'false' };
  }

  if (ts.isBinaryExpression(expression)) {
    return parseTsBinaryExpressionIntoBooleanExpression(expression);
  }

  if (ts.isParenthesizedExpression(expression)) {
    return parseOutBooleanExpression(expression.expression);
  }

  if (ts.isIdentifier(expression)) {
    return {
      _: 'variable',
      token: expression.text
    };
  }

  return null;
}

function parseTsBinaryExpressionIntoBooleanExpression(
  expression: ts.BinaryExpression
): BooleanConjunction | null {
  let operator: BooleanOperator = 'and';
  if (expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    operator = 'and';
  } else if (
    expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken ||
    expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
  ) {
    operator = 'equal';
  } else if (expression.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    operator = 'or';
  }

  const leftExpression = parseOutBooleanExpression(expression.left);
  const rightExpression = parseOutBooleanExpression(expression.right);

  if (leftExpression === null || rightExpression === null) {
    return null;
  }

  return {
    _: 'conjunction',
    left: leftExpression,
    right: rightExpression,
    operator
  };
}

function simplifyBooleanExpression(expression: BooleanExpression): BooleanExpression {
  if (expression._ === 'true' || expression._ === 'false' || expression._ === 'variable') {
    return expression;
  }

  const simplifiedLeft = simplifyBooleanExpression(expression.left);
  const simplifiedRight = simplifyBooleanExpression(expression.right);
  if (expression.operator === 'and') {
    if (simplifiedLeft._ === 'true' && simplifiedRight._ === 'true') {
      return { _: 'true' };
    }

    if (simplifiedLeft._ === 'false' || simplifiedRight._ === 'false') {
      return { _: 'false' };
    }

    if (simplifiedLeft._ === 'true' && simplifiedRight._ !== 'true') {
      return simplifiedRight;
    }

    if (simplifiedRight._ === 'true' && simplifiedLeft._ !== 'true') {
      return simplifiedLeft;
    }
  }

  if (expression.operator === 'or') {
    if (simplifiedLeft._ === 'true' || simplifiedRight._ === 'true') {
      return { _: 'true' };
    }

    if (simplifiedLeft._ === 'false' && simplifiedRight._ === 'false') {
      return { _: 'false' };
    }
  }

  // equals case
  if (
    (simplifiedLeft._ === 'true' && simplifiedRight._ === 'true') ||
    (simplifiedLeft._ === 'false' && simplifiedRight._ === 'false') ||
    (simplifiedLeft._ === 'variable' &&
      simplifiedRight._ === 'variable' &&
      simplifiedLeft.token === simplifiedRight.token)
  ) {
    return { _: 'true' };
  }

  if (
    (simplifiedLeft._ === 'true' && simplifiedRight._ === 'false') ||
    (simplifiedLeft._ === 'false' && simplifiedRight._ === 'true')
  ) {
    return { _: 'false' };
  }

  return expression;
}

function getTextForBooleanExpressionWithParenthesisIfConjuction(
  expression: BooleanExpression
): string {
  const expressionText = getTextForBooleanExpression(expression);

  return expression._ === 'conjunction' ? `(${expressionText})` : expressionText;
}

function getTextForBooleanExpression(expression: BooleanExpression): string {
  if (expression._ === 'true' || expression._ === 'false') {
    return expression._;
  }

  if (expression._ === 'variable') {
    return expression.token;
  }

  const leftText = getTextForBooleanExpressionWithParenthesisIfConjuction(expression.left);
  const opText = expression.operator === 'and' ? '&&' : expression.operator === 'or' ? '||' : '===';
  const rightText = getTextForBooleanExpressionWithParenthesisIfConjuction(expression.right);

  return `${leftText} ${opText} ${rightText}`;
}

function tryGetTargetExpression(
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

function findLargestPossibleBinaryExpressionParentNode(
  startNode: ts.Node
): ts.BinaryExpression | null {
  const firstBinaryExpression = getNextParentBinaryExpression(startNode);
  if (firstBinaryExpression === null) {
    return null;
  }

  let mostExpandedBinaryExpressionSelectionSoFar = firstBinaryExpression;
  let nextBinaryExpressionSelection: ts.BinaryExpression | null = null;
  while (nextBinaryExpressionSelection !== null) {
    mostExpandedBinaryExpressionSelectionSoFar = nextBinaryExpressionSelection;
    nextBinaryExpressionSelection = getNextParentBinaryExpression(nextBinaryExpressionSelection);
  }

  return mostExpandedBinaryExpressionSelectionSoFar;
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

export function getApplicableRefactors(
  program: ts.Program,
  logger: Logger,
  fileName: string,
  positionOrRange: number | ts.TextRange,
  _preferences: ts.UserPreferences | undefined
): ts.ApplicableRefactorInfo[] {
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) {
    logger.error(`cannot load source file ${fileName}`);
    return [];
  }

  const booleanExpression = tryGetTargetExpression(logger, sourceFile, positionOrRange);

  if (booleanExpression == null) {
    return [];
  }

  const parsedBooleanExpression = parseTsBinaryExpressionIntoBooleanExpression(booleanExpression);

  if (parsedBooleanExpression === null) {
    logger.error(`Failed to parse boolean expression, ${booleanExpression.getText()}`);
    return [];
  }

  const maybeSimplifiedBooleanExpression = simplifyBooleanExpression(parsedBooleanExpression);

  if (parsedBooleanExpression !== maybeSimplifiedBooleanExpression) {
    const start = formatLineAndChar(
      sourceFile.getLineAndCharacterOfPosition(booleanExpression.pos)
    );
    const end = formatLineAndChar(sourceFile.getLineAndCharacterOfPosition(booleanExpression.end));
    logger.info(`Can simplify tautology '${booleanExpression.getText()}' at [${start}, ${end}]`);

    return [simplifyConditionalRefactoring];
  }

  return [];
}

export function getEditsForRefactor(
  program: ts.Program,
  logger: Logger,
  fileName: string,
  _formatOptions: ts.FormatCodeSettings,
  positionOrRange: number | ts.TextRange,
  refactorName: string,
  actionName: string,
  _preferences: ts.UserPreferences | undefined
): ts.RefactorEditInfo | undefined {
  if (refactorName !== name) {
    return undefined;
  }

  if (actionName === simplifyConstantBooleanExpression) {
    const sourceFile = program.getSourceFile(fileName);
    if (sourceFile === undefined) {
      logger.error(`cannot load source file ${fileName}`);
      return undefined;
    }

    const booleanExpression = tryGetTargetExpression(logger, sourceFile, positionOrRange);

    if (booleanExpression == null) {
      return undefined;
    }

    const parsedBooleanExpression = parseTsBinaryExpressionIntoBooleanExpression(booleanExpression);

    if (parsedBooleanExpression === null) {
      logger.error(`Failed to parse boolean expression, ${booleanExpression.getText()}`);
      return undefined;
    }

    const maybeSimplifiedBooleanExpression = simplifyBooleanExpression(parsedBooleanExpression);

    if (parsedBooleanExpression !== maybeSimplifiedBooleanExpression) {
      const newText = ` ${getTextForBooleanExpression(maybeSimplifiedBooleanExpression)}`;

      return {
        edits: [
          {
            fileName: sourceFile.fileName,
            textChanges: [
              {
                span: {
                  start: booleanExpression.left.pos,
                  length: booleanExpression.right.end - booleanExpression.left.pos
                },
                newText
              }
            ]
          }
        ],
        renameFilename: undefined,
        renameLocation: undefined
      };
    }

    logger.error(`Unable to perform requested ${refactorName} action ${actionName}`);
    return undefined;
  }

  logger.error(`Recieved request to perform unknown ${refactorName} action ${actionName}`);
  return undefined;
}
