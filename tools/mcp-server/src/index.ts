#!/usr/bin/env node

/**
 * Entry point for the ng-diagram MCP server
 * Initializes and starts the MCP server with documentation search capabilities
 */

import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { NgDiagramMCPServer } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));

/**
 * Main function to start the MCP server
 */
async function main(): Promise<void> {
  try {
    // Bundled data (npm package) takes priority over monorepo paths (local dev)
    const bundledDocsPath = resolve(__dirname, 'data/docs');
    const bundledApiReportPath = resolve(__dirname, 'data/ng-diagram.api.md');

    const docsPath = existsSync(bundledDocsPath)
      ? bundledDocsPath
      : resolve(__dirname, '../../../apps/docs/src/content/docs');

    const apiReportPath = existsSync(bundledApiReportPath)
      ? bundledApiReportPath
      : resolve(__dirname, '../../../packages/ng-diagram/api-report/ng-diagram.api.md');

    const server = new NgDiagramMCPServer({
      name: 'ng-diagram-docs',
      version: pkg.version,
      docsPath,
      baseUrl: 'https://www.ngdiagram.dev',
      apiReportPath,
    });

    // Handle signals at the entry point level
    const handleExit = async () => {
      await server.shutdown();
      process.exit(0);
    };
    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);

    await server.start();
  } catch (error) {
    console.error('[MCP Server] Fatal error during startup:');
    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
      if (error.stack) {
        console.error(`  Stack: ${error.stack}`);
      }
    } else {
      console.error(`  Unknown error: ${error}`);
    }

    process.exit(1);
  }
}

main();
