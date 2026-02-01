#!/usr/bin/env node

/**
 * Entry point for the ng-diagram MCP server
 * Initializes and starts the MCP server with documentation search capabilities
 */

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { NgDiagramMCPServer } from './server.js';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main function to start the MCP server
 */
async function main(): Promise<void> {
  try {
    // Resolve documentation path relative to the repository root
    // From tools/mcp-server/src -> ../../../apps/docs/src/content/docs
    const docsPath = resolve(__dirname, '../../../apps/docs/src/content/docs');

    // Create and configure the MCP server
    const server = new NgDiagramMCPServer({
      name: 'ng-diagram-docs',
      version: '0.1.0',
      docsPath,
    });

    // Start the server
    await server.start();
  } catch (error) {
    // Handle startup failures
    console.error('[MCP Server] Fatal error during startup:');
    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
      if (error.stack) {
        console.error(`  Stack: ${error.stack}`);
      }
    } else {
      console.error(`  Unknown error: ${error}`);
    }

    // Exit with error code
    process.exit(1);
  }
}

// Run the main function
main();
