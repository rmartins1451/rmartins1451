#!/usr/bin/env node
/**
 * losbeto-mcp — Losbeto x402 tools inside Claude/Cursor.
 * Config: env LOSBETO_PRIVATE_KEY (EVM key with USDC on Base) enables paid tools.
 * Free tools work without any key.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = process.env.LOSBETO_URL || "https://losbeto-production-dd7c.up.railway.app";
const PK = process.env.LOSBETO_PRIVATE_KEY || "";

let payFetch = fetch; // fallback: free endpoints only
if (PK) {
  try {
    const { wrapFetchWithPayment } = await import("x402-fetch");
    const { privateKeyToAccount } = await import("viem/accounts");
    const account = privateKeyToAccount(PK.startsWith("0x") ? PK : `0x${PK}`);
    payFetch = wrapFetchWithPayment(fetch, account);
    console.error(`[losbeto-mcp] x402 payments enabled (Base) for ${account.address}`);
  } catch (e) {
    console.error(`[losbeto-mcp] payment setup failed, free tools only: ${e.message}`);
  }
}

const TOOLS = [
  { name: "launch_risk_preview", paid: false, path: "/launch-risk-preview",
    description: "FREE: latest Solana token launches + what the full risk brief includes.",
    inputSchema: { type: "object", properties: {} } },
  { name: "launch_risk_brief", paid: true, path: "/launch-risk",
    description: "PAID (~$0.35 USDC via x402): full launch risk brief — on-chain checks (mint authority, holder concentration), DEX liquidity/socials, risk score 0-100, AI verdict (AVOID/WATCH/SMALL-SIZE-ONLY). Optional token arg = Solana mint; omit to analyze the freshest launch.",
    inputSchema: { type: "object", properties: { token: { type: "string", description: "Solana mint address (optional)" } } } },
  { name: "fear_greed", paid: true, path: "/fear-greed",
    description: "PAID ($0.01): live crypto Fear & Greed index with interpretation.",
    inputSchema: { type: "object", properties: {} } },
  { name: "sol_price", paid: true, path: "/pyth-price",
    description: "PAID ($0.01): SOL/USD from Pyth Network oracle.",
    inputSchema: { type: "object", properties: {} } },
  { name: "receipts", paid: false, path: "/receipts",
    description: "FREE: audit Losbeto's on-chain sales receipts (radical transparency).",
    inputSchema: { type: "object", properties: {} } },
];

const server = new Server({ name: "losbeto", version: "1.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = TOOLS.find(t => t.name === req.params.name);
  if (!tool) return { content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }], isError: true };
  if (tool.paid && payFetch === fetch)
    return { content: [{ type: "text", text: "This tool is paid via x402. Set LOSBETO_PRIVATE_KEY (EVM key holding USDC on Base) to enable automatic micropayments." }], isError: true };
  const qs = req.params.arguments?.token ? `?token=${encodeURIComponent(req.params.arguments.token)}` : "";
  try {
    const r = await (tool.paid ? payFetch : fetch)(`${BASE_URL}${tool.path}${qs}`);
    const text = await r.text();
    return { content: [{ type: "text", text }], isError: !r.ok };
  } catch (e) {
    return { content: [{ type: "text", text: `Request failed: ${e.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[losbeto-mcp] ready");
