# typescript-refactoring-plugin

WIP: An investigation into how hard it would be to write typescript automated refactorings

## Goal

> Refactoring (noun): a change made to the internal structure of software to make it easier to understand and cheaper to modify without changing its observable behavior.

> Refactoring (verb): to restructure software by applying a series of refactorings without changing its observable behavior.

-- [Martian Fowler](https://martinfowler.com/bliki/DefinitionOfRefactoring.html)

While typescript supports "rename" and in some cases "Extract Function." It seems unlikely that they will add any more automated refactorings in the near term. This project is intended to be an investigation into adding more.

## TODO
1. ~~Setup tests (something like this? https://github.com/Microsoft/typescript-styled-plugin/tree/master/e2e)~~
2. ~~Change plugin code to be a real refactoring plugin (that just passes through). Use https://github.com/Microsoft/TypeScript/blob/master/lib/tsserverlibrary.d.ts#L5421 for figuring out tests~~
3. Figure out what refactoring to work on...
4. Implement some tests!!!
5. Implement the refactoring!!!
