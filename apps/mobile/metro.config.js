// Metro config for using Expo inside a pnpm monorepo.
// Watches the workspace root and resolves modules from both local and root node_modules.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// With node-linker=hoisted this is usually unnecessary, but harmless & explicit.
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
