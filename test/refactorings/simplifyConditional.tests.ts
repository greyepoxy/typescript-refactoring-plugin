import { test } from 'ava';
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

test(`should be able to simplify a 'true && true' Tautology`, t => {
  const fileContents = `const some = [||]true && true;`;
  const textSelelection = parseInputFileForSelection(fileContents);

  if (textSelelection == null) {
    throw new Error(`Expected input file to have some text selected (using '[|...|]')'`);
  }

  const program = GetProgram({
    path: mockFileName,
    contents: removeSelectionFromFile(fileContents),
    scriptKindName: 'TS'
  });
  const logger = GetMockLogger();

  const inputTextRange =
    textSelelection.pos === textSelelection.end ? textSelelection.pos : textSelelection;

  const refactoring = getApplicableRefactors(program, logger, mockFileName, inputTextRange);

  t.not(refactoring[0], undefined);
  t.deepEqual(refactoring[0], simplifyConditionalRefactoring);

  const result = getEditsForRefactor(
    program,
    logger,
    mockFileName,
    {},
    14,
    refactoring[0].name,
    refactoring[0].actions[0].name
  );

  t.not(result, undefined);
  if (result !== undefined) {
    t.deepEqual(result.edits[0].fileName, mockFileName);
    t.deepEqual(result.edits[0].textChanges[0].span, { start: 12, length: 13 });
    t.deepEqual(result.edits[0].textChanges[0].newText, 'true');
  }
});

test(`should be able to simplify a 'true && a' Tautology`, t => {
  const fileContents = `const some = [||]true && a;`;
  const textSelelection = parseInputFileForSelection(fileContents);

  if (textSelelection == null) {
    throw new Error(`Expected input file to have some text selected (using '[|...|]')'`);
  }

  const program = GetProgram({
    path: mockFileName,
    contents: removeSelectionFromFile(fileContents),
    scriptKindName: 'TS'
  });
  const logger = GetMockLogger();

  const inputTextRange =
    textSelelection.pos === textSelelection.end ? textSelelection.pos : textSelelection;

  const refactoring = getApplicableRefactors(program, logger, mockFileName, inputTextRange);

  t.not(refactoring[0], undefined);
  t.deepEqual(refactoring[0], simplifyConditionalRefactoring);

  const result = getEditsForRefactor(
    program,
    logger,
    mockFileName,
    {},
    14,
    refactoring[0].name,
    refactoring[0].actions[0].name
  );

  t.not(result, undefined);
  if (result !== undefined) {
    t.deepEqual(result.edits[0].fileName, mockFileName);
    t.deepEqual(result.edits[0].textChanges[0].span, { start: 12, length: 10 });
    t.deepEqual(result.edits[0].textChanges[0].newText, 'a');
  }
});

// TODO: implement the rest of the simplifications described here
// http://www.chrisstead.com/archives/820/refactoring-with-boolean-algebra-and-de-morgans-laws/
