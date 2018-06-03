import { test, TestContext } from 'ava';
import {
  GetApplicableRefactors,
  GetEditsForRefactor
} from '../../src/refactorings/refactoringFunctions';
import {
  getApplicableRefactors,
  getEditsForRefactor,
  simplifyConditionalRefactoring
} from '../../src/refactorings/simplifyConditional';
import { GetMockLogger, GetProgram } from './mockLanguageService';

const mockFileName = 'main.ts';

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
    t.fail(`Expected refactoring ${expected.name} to be an option but it was not.`);
    return;
  }

  const expectedAction = expectedRefactoring.actions.find(
    action => action.name === expected.actionName
  );

  if (expectedAction === undefined) {
    t.log(expectedRefactoring);
    t.fail(
      `Expected refactoring ${expected.name} with action name ${
        expected.actionName
      } to be an option but it was not.`
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

function validateRefactoring(
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

test(`should be able to simplify a 'true && true' Tautology`, t => {
  validateRefactoring(
    `const some = [||]true && true;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyConditionalRefactoring.name,
      actionName: simplifyConditionalRefactoring.actions[0].name
    },
    `const some = true;`,
    t
  );
});

test(`should be able to simplify a 'true && a' Tautology`, t => {
  validateRefactoring(
    `const some = [||]true && a;`,
    getApplicableRefactors,
    getEditsForRefactor,
    {
      name: simplifyConditionalRefactoring.name,
      actionName: simplifyConditionalRefactoring.actions[0].name
    },
    `const some = a;`,
    t
  );
});

// TODO: implement the rest of the simplifications described here
// http://www.chrisstead.com/archives/820/refactoring-with-boolean-algebra-and-de-morgans-laws/
