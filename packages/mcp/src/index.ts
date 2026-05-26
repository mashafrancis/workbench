/**
 * Workbench MCP server (stdio).
 *
 * stdio is the right transport here for two reasons:
 *
 *   1. Every MCP client in active use today — Cursor, Claude Desktop, Zed,
 *      Continue.dev, VS Code w/ Copilot, Goose — talks stdio. They spawn the
 *      MCP as a subprocess and pipe JSON-RPC over stdin/stdout. Wiring up
 *      streamable HTTP would buy us nothing on the agent side and add a port
 *      to manage for users.
 *   2. The dashboard itself is the network endpoint. The MCP is a local
 *      proxy that already speaks HTTP to the dashboard, so the agent-side
 *      doesn't need to. This keeps the local install entirely
 *      `npx workbench-mcp` — no `--port`, no firewall config, no auth at
 *      this layer (the dashboard's auth covers it).
 *
 * Logging rule: stdio MCP servers MUST NOT write to stdout — that channel
 * is the JSON-RPC stream and any stray bytes corrupt the protocol. All logs
 * and startup messages go to stderr.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { clientFromEnv } from "./client.js";
import { registerAllTools } from "./tools.js";

const SERVER_NAME = "workbench-mcp-server";
const SERVER_VERSION = "0.5.1";

async function main(): Promise<void> {
  let client: ReturnType<typeof clientFromEnv>;
  try {
    client = clientFromEnv();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[workbench-mcp] startup error: ${message}\n`);
    process.exit(2);
  }

  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerAllTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write(
    `[workbench-mcp] connected via stdio → ${client.apiBase} ` +
      `(${SERVER_NAME}@${SERVER_VERSION})\n`,
  );
}

main().catch((err) => {
  const message =
    err instanceof Error ? (err.stack ?? err.message) : String(err);
  process.stderr.write(`[workbench-mcp] fatal: ${message}\n`);
  process.exit(1);
});
