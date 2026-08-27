# Logo sources

All marks are the property of their respective owners, used nominatively to indicate
supported integrations. Downloaded 2026-08-27. No shapes were modified; the only edit
anywhere is a fill color change noted below.

| File | Brand | Source URL | License / permission basis | Edits |
|---|---|---|---|---|
| n8n.svg | n8n | https://raw.githubusercontent.com/n8n-io/n8n/master/packages/frontend/@n8n/design-system/src/components/N8nLogo/logo-icon.svg | Asset in n8n's official repo (n8n-io/n8n, Sustainable Use License); nominative use of the mark | none (brand pink #EA4B71, legible on dark) |
| zapier.svg | Zapier | https://firebasestorage.googleapis.com/v0/b/standards-site-beta.appspot.com/o/documents%2F279072ea39f%2F8fc2c38ae5f%2Fzapier-logo_frost.svg?alt=media&token=dc5441c3-0ee3-4d26-b085-e08590b5697c | Downloadable logo asset provided on Zapier's official brand page (zapier.com/brand), "frost" (light) variant for dark backgrounds | none |
| make.svg | Make (make.com) | https://www.make.com/make-app-icon.zip (file: App Icon/Make-IconColor-transparent.svg) | "Make app icon" kit downloadable from Make's official press page (make.com/en/press) | none |
| claude.svg | Claude (Anthropic) | https://claude.ai/favicon.svg (identical file served at https://www.claude.com/favicon.svg) | Anthropic's own site asset (the Claude mark as served by claude.ai/claude.com); nominative use | none (terracotta #D97757, legible on dark) |
| openai.svg | OpenAI / ChatGPT | https://raw.githubusercontent.com/openai/openai-realtime-console/main/client/assets/openai-logomark.svg | Asset shipped in OpenAI's official openai-realtime-console repo (MIT) | added fill="currentColor" on the svg element (mark had no fill = default black); single-path monochrome mark, style with CSS color |
| cursor.svg | Cursor | https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/brand/cursor-brand-assets.zip (file: General Logos/Cube/SVG/CUBE_2D_DARK.svg) | Official brand asset zip linked from cursor.com/brand; dark-mode (light-colored #edecec) cube icon | none |
| langchain.svg | LangChain | https://raw.githubusercontent.com/langchain-ai/docs/main/src/images/providers/dark/langchain.svg | Asset in LangChain's official docs repo (langchain-ai/docs, MIT) | none (dark-teal tile + white chain mark, designed for dark UIs) |
| rapidapi.svg | RapidAPI | https://rapidapi.com/static-assets/default/logo-white.svg | RapidAPI's own site static asset (all-white logo variant); nominative use | none |
| apify.svg | Apify | https://raw.githubusercontent.com/apify/apify-docs/master/apify-docs-theme/static/img/apify_logo.svg | Asset in Apify's official docs repo (apify/apify-docs, Apache-2.0) | none (brand blue #246DFF, legible on dark) |
| mcp.svg | Model Context Protocol | https://raw.githubusercontent.com/modelcontextprotocol/python-sdk/main/docs/.overrides/.icons/mcp.svg | Official modelcontextprotocol GitHub org asset (python-sdk repo, MIT) | none (upstream file already uses stroke="currentColor") |
| github.svg | GitHub | https://brand.github.com/GitHub_Logos.zip (file: GitHub Logos/SVG/GitHub_Invertocat_White.svg), linked from https://github.com/logos | Official GitHub logos download page; usage per the terms stated on github.com/logos | none (white Invertocat for dark backgrounds) |
| npm.svg | npm | https://raw.githubusercontent.com/npm/logos/master/npm%20logo/npm-logo-red.svg | npm's official logos repo (github.com/npm/logos) | none (red #C12127 wordmark — the npm logo IS the wordmark; legible on dark) |

Notes:
- Icon-only variants were used where the brand publishes one (n8n, Make, Claude, OpenAI,
  Cursor, LangChain, Apify, MCP, GitHub). Zapier, RapidAPI and npm are wordmark logos
  because those are the primary marks the vendors publish (Zapier's brand-page "App Icon"
  SVG is a composite guidelines graphic, not a standalone icon).
- openai.svg and mcp.svg render via currentColor — set `color: #fff` (or similar) on the
  container.
- All files verified standalone SVG with viewBox, no scripts, no external references,
  each under 10 KB.
