import { TestContext } from 'ava';
import {
  GetApplicableRefactors,
  GetEditsForRefactor
} from '../../src/refactorings/refactoringFunctions';
import { GetMockLogger, GetProgram } from './mockLanguageService';

interface TextSelection {
  pos: number;
  end: number;
}

interface Refactoring {
  name: string;
  actionName: string;
}

function parseInputFileForSelection(fileContents: string): TextSelection | null {
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

function removeSelectionFromFile(fileContents: string): string {
  return fileContents.replace('[|', '').replace('|]', '');
}

function validateRefactoringIsPresent(
  refactorings: ts.ApplicableRefactorInfo[],
  expected: Refactoring,
  t: TestContext
) {
  const expectedRefactoring = refactorings.find(refactoring => refactoring.name === expected.name);

  if (expectedRefactoring === undefined) {
    t.log(refactorings);
    t.fail(`Expected refactoring '${expected.name}' to be an option but it was not.`);
    return;
  }

  const expectedAction = expectedRefactoring.actions.find(
    action => action.name === expected.actionName
  );

  if (expectedAction === undefined) {
    t.log(expectedRefactoring);
    t.fail(
      `Expected refactoring '${expected.name}' with action name '${
        expected.actionName
      }' to be an option but it was not.`
    );
    return;
  }
}

function applyTextEdits(text: string, edits: ts.TextChange[]): string {
  // Apply edits in reverse on the existing text
  let result = text;
  for (let i = edits.length - 1; i >= 0; i--) {
    const change = edits[i];
    const head = result.slice(0, change.span.start);
    const tail = result.slice(change.span.start + change.span.length);
    result = head + change.newText + tail;
  }
  return result;
}

export function validateRefactoring(
  inputFileContentsWithSelection: string,
  getApplicableRefactorings: GetApplicableRefactors,
  getEditsForRefactoring: GetEditsForRefactor,
  refactoringActionToPerform: { name: string; actionName: string },
  expectedResultContents: string,
  t: TestContext
): void {
  const textSelelection = parseInputFileForSelection(inputFileContentsWithSelection);

  if (textSelelection == null) {
    throw new Error(`Expected input file to have some text selected (using '[|...|]')'`);
  }

  const fileName = 'main.ts';
  const inputFileContents = removeSelectionFromFile(inputFileContentsWithSelection);

  const program = GetProgram({
    contents: inputFileContents,
    path: fileName,
    scriptKindName: 'TS'
  });

  const logger = GetMockLogger();

  const inputTextRange =
    textSelelection.pos === textSelelection.end ? textSelelection.pos : textSelelection;

  const refactorings = getApplicableRefactorings(program, logger, fileName, inputTextRange);

  validateRefactoringIsPresent(refactorings, refactoringActionToPerform, t);

  const result = getEditsForRefactoring(
    program,
    logger,
    fileName,
    {},
    inputTextRange,
    refactoringActionToPerform.name,
    refactoringActionToPerform.actionName
  );

  t.not(result, undefined);
  if (result !== undefined) {
    t.deepEqual(result.edits[0].fileName, fileName);

    const resultingFileContents = applyTextEdits(inputFileContents, result.edits[0].textChanges);

    t.deepEqual(resultingFileContents, expectedResultContents);
  }
}
