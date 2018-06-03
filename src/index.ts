import * as ts from 'typescript/lib/tsserverlibrary';
import { create } from './languageServicePlugin';

// tslint:disable-next-line:variable-name
function init(_mod: { typescript: typeof ts }): ts.server.PluginModule {
  return { create };
}

const pluginModuleFactory: ts.server.PluginModuleFactory = init;

export = pluginModuleFactory;
