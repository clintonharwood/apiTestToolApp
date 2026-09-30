const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StreamableHTTPServerTransport,
} = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { version } = require("../../package.json");
const { tools, BASE_URL } = require("./tools");

// Hostnames the MCP endpoint will accept, to guard the local server against DNS
// rebinding attacks. Derived from where the app actually runs.
const allowedHosts = Array.from(
  new Set(
    [BASE_URL, process.env.CORS_ORIGIN, `http://localhost:${process.env.PORT || 3003}`]
      .filter(Boolean)
      .map((u) => {
        try {
          return new URL(u).host;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
  )
);

/**
 * Builds an MCP server instance with the mock-API tools registered. A fresh server
 * is created per request (stateless mode), so this stays free of shared state.
 * @returns {InstanceType<typeof McpServer>}
 */
function buildMcpServer() {
  const server = new McpServer({ name: "clintox-api-tools", version });

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      { title: tool.title, description: tool.description, inputSchema: tool.inputSchema },
      tool.handler
    );
  }

  return server;
}

/**
 * Express handler for the Streamable HTTP MCP endpoint (mounted at /mcp). Runs in
 * stateless mode: a new server + transport are created per request and torn down
 * when the response closes, so no session store is needed. Relies on express.json()
 * having already parsed the body.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function mcpHandler(req, res) {
  const server = buildMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableDnsRebindingProtection: allowedHosts.length > 0,
    allowedHosts,
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
}

module.exports = { buildMcpServer, mcpHandler };
