# typescript-refactoring-plugin

WIP: An investigation into writing typescript automated refactorings

## Goal

> Refactoring (noun): a change made to the internal structure of software to make it easier to understand and cheaper to modify without changing its observable behavior.

> Refactoring (verb): to restructure software by applying a series of refactorings without changing its observable behavior.

-- [Martian Fowler](https://martinfowler.com/bliki/DefinitionOfRefactoring.html)

If a refactoring ever results in a compiler error or an observable behavior change then that is a bug, please open an issue or feel free to add a failing test (using `test.failing`).

### What is not considered an observable behavior change?

1. Performance profile changes. While it is absolutely true that extracting a function or introducing a variable can have a performance impact it is unfortunately to difficult to reason about the impact of such changes in an automated fashion (at least for the moment). I have found that in almost all of my coding well designed code has always lead to better performance profiles then trying to optimize every bit (usually because the code complexity leads to redundant actions).

### Why?

While typescript already supports "rename" and in some cases "Extract Function." It seems unlikely that they will add any more automated refactorings in the near term. This project is intended to fill in the gaps. Also while the TS team is very responsive with fixing issues that are reported with their automated refactorings they seem to be okay with labeling automated code changes that do have behavioral changes also as refactorings. I intend this project to be an opinionated look at pure guaranteed bug for bug and feature for feature refactorings.

## In Progress

Currently working on boolean expression related refactorings. Things like simplifying always true/false expressions and applying De Morgans law to an expression.

## TODO

Create a vs-code plugin that bundles this language service plugin so that it can be installed directly as an extension. An example of how to do this is [here](https://github.com/Microsoft/typescript-styled-plugin/issues/10).
