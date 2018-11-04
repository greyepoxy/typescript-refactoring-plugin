import * as ts from 'typescript/lib/tsserverlibrary';
import { create } from './languageServicePlugin';

function init(_mod: { typescript: typeof ts }): ts.server.PluginModule {
  return { create };
}

const pluginModuleFactory: ts.server.PluginModuleFactory = init;

export = pluginModuleFactory;
