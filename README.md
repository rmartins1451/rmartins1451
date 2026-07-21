# losbeto-mcp

Losbeto x402 crypto intelligence as native tools in Claude Desktop, Claude Code, or Cursor.
No signup. No API key. Paid tools settle automatically in USDC on Base via x402.

## Install (Claude Desktop / Cursor)
Add to your MCP config:
```json
{
  "mcpServers": {
    "losbeto": {
      "command": "npx",
      "args": ["-y", "losbeto-mcp"],
      "env": { "LOSBETO_PRIVATE_KEY": "0x..." }
    }
  }
}
```
`LOSBETO_PRIVATE_KEY` = an EVM private key holding a little USDC on Base (optional — free tools work without it).

## Tools
- `launch_risk_preview` (FREE) — fresh Solana launches + preview of the brief
- `launch_risk_brief` (~$0.35) — full risk brief: on-chain checks, liquidity, AI verdict
- `fear_greed` ($0.01) · `sol_price` ($0.01)
- `receipts` (FREE) — audit our on-chain sales, honestly labeled

Transparency: https://losbeto-production-dd7c.up.railway.app/receipts
