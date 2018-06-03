import * as path from 'path';

export const appPath = path.resolve(__dirname, '../../');
const libPath = path.resolve(appPath, 'lib');
const fixtureRelativePath = './test/fixtures';
export const fixturesSrcDirPath = path.resolve(appPath, fixtureRelativePath);
export const fixturesLibDirPath = path.resolve(libPath, fixtureRelativePath);
