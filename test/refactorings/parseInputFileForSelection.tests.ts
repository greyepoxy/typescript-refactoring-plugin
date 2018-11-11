import { test } from 'ava';
import { parseInputFileForSelection } from './mockLanguageService';

test(`should parse out special cursor position characters [|...|]`, t => {
  const { fileContents, textSelection } = parseInputFileForSelection(
    'Some random text [|blah|] foo'
  );

  t.deepEqual(fileContents, 'Some random text blah foo');
  t.deepEqual(textSelection, { pos: 17, end: 21 });
});

test(`should parse out special cursor position characters right next to each other as single position [||]`, t => {
  const { fileContents, textSelection } = parseInputFileForSelection(
    'Some random text [||]blah foo'
  );

  t.deepEqual(fileContents, 'Some random text blah foo');
  t.deepEqual(textSelection, 17);
});

test(`should fail if no special cursor position characters [|...|]`, t => {
  t.throws(() => parseInputFileForSelection('Some random text blah foo'));
});

test(`should fail if special cursor position characters are backwards |]...[|`, t => {
  t.throws(() => parseInputFileForSelection('Some random |]text[| blah foo'));
});

test(`should fail if only one special cursor position character [|...`, t => {
  t.throws(() => parseInputFileForSelection('Some random [|text blah foo'));
});

test(`should fail if only one special cursor position character ...|]`, t => {
  t.throws(() => parseInputFileForSelection('Some random text|] blah foo'));
});
