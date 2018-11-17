import * as ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';

export type NodeMatcher<TNode extends ts.Node> = (
  logger: Logger,
  sourceFile: ts.SourceFile,
  positionOrRange: number | ts.TextRange
) => TNode | null;

export type NodeRefactoring<TInputNode extends ts.Node, TResultNode extends ts.Node> = (
  expression: TInputNode
) => TResultNode | null;

export interface RefactoringResult<TMatchedNode extends ts.Node, TResultNode extends ts.Node> {
  matched: TMatchedNode;
  result: TResultNode;
  appliedRefactoringAction: RefactoringAction<TMatchedNode, TResultNode>;
}

export type AttemptRefactoring<TMatchedNode extends ts.Node, TResultNode extends ts.Node> = (
  logger: Logger,
  sourceFile: ts.SourceFile,
  positionOrRange: number | ts.TextRange
) => RefactoringResult<TMatchedNode, TResultNode> | null;

export class RefactoringAction<TMatchedNode extends ts.Node, TResultNode extends ts.Node> {
  public name: string;
  public description: string;
  public nodeMatcher: NodeMatcher<TMatchedNode>;
  public nodeRefactoring: NodeRefactoring<TMatchedNode, TResultNode>;

  constructor(
    name: string,
    description: string,
    nodeMatcher: NodeMatcher<TMatchedNode>,
    nodeRefactoring: NodeRefactoring<TMatchedNode, TResultNode>
  ) {
    this.name = name;
    this.description = description;
    this.nodeMatcher = nodeMatcher;
    this.nodeRefactoring = nodeRefactoring;
  }

  public attemptRefactoring: AttemptRefactoring<TMatchedNode, TResultNode> = (
    logger: Logger,
    sourceFile: ts.SourceFile,
    positionOrRange: number | ts.TextRange
  ) => {
    const matchedNode = this.nodeMatcher(logger, sourceFile, positionOrRange);
    if (matchedNode !== null) {
      const resultNode = this.nodeRefactoring(matchedNode);
      return resultNode !== null
        ? { matched: matchedNode, result: resultNode, appliedRefactoringAction: this }
        : null;
    }
    return null;
  };

  public getInfo = (): ts.RefactorActionInfo => {
    return {
      name: this.name,
      description: this.description
    };
  };
}
