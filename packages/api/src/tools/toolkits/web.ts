import { Tools, replaceSpecialVars } from 'librechat-data-provider';

/**
 * Builds citation format instructions for MCP tools that return structured
 * citation data via the citations:// resource URI protocol.
 * The tool must return a resource with uri "citations://..." containing
 * SearchResultData-compatible JSON so callbacks.js streams it as an attachment.
 */
export function buildMCPCitationContext(toolKey: string): string {
  return `# \`${toolKey}\` — Citation Format:
After receiving results from this tool, cite every legal source you reference.

**CITATION FORMAT - UNICODE ESCAPE SEQUENCES ONLY:**
Use these EXACT escape sequences (copy verbatim): \\ue202 (before each anchor), \\ue200 (group start), \\ue201 (group end), \\ue203 (highlight start), \\ue204 (highlight end)

Anchor pattern: \\ue202turn{N}search{index}
- N = the tool call number (0 for the first call, 1 for the second, etc.)
- index = the 0-based position of the source in that call's results (acts listed first, then cases, in the order they appear)

**Examples (copy these exactly):**
- First tool call, source 0: "The court held that...\\ue202turn0search0"
- First tool call, multiple: "This principle...\\ue202turn0search1\\ue202turn0search3"
- Second tool call, source 2: "The statute provides...\\ue202turn1search2"
- Group: "The defendant argued... \\ue200\\ue202turn0search0\\ue202turn0search2\\ue201"
- Highlighted quote: "\\ue203The right to fair hearing is fundamental.\\ue204\\ue202turn0search1"

**CRITICAL:** Output escape sequences EXACTLY as shown. Do NOT substitute with brackets, numbers, or markdown links. Place anchors AFTER punctuation. Cite every source you reference. Track which tool call returned each source to use the correct turn number.`.trim();
}

/** Builds the web search tool context with citation format instructions. */
export function buildWebSearchContext(): string {
  return `# \`${Tools.web_search}\`:
Current Date & Time: ${replaceSpecialVars({ text: '{{iso_datetime}}' })}

**Execute immediately without preface.** After search, provide a brief summary addressing the query directly, then structure your response with clear Markdown formatting (## headers, lists, tables). Cite sources properly, tailor tone to query type, and provide comprehensive details.

**CITATION FORMAT - UNICODE ESCAPE SEQUENCES ONLY:**
Use these EXACT escape sequences (copy verbatim): \\ue202 (before each anchor), \\ue200 (group start), \\ue201 (group end), \\ue203 (highlight start), \\ue204 (highlight end)

Anchor pattern: \\ue202turn{N}{type}{index} where N=turn number, type=search|news|image|ref, index=0,1,2...

**Examples (copy these exactly):**
- Single: "Statement.\\ue202turn0search0"
- Multiple: "Statement.\\ue202turn0search0\\ue202turn0news1"
- Group: "Statement. \\ue200\\ue202turn0search0\\ue202turn0news1\\ue201"
- Highlight: "\\ue203Cited text.\\ue204\\ue202turn0search0"
- Image: "See photo\\ue202turn0image0."

**CRITICAL:** Output escape sequences EXACTLY as shown. Do NOT substitute with † or other symbols. Place anchors AFTER punctuation. Cite every non-obvious fact/quote. NEVER use markdown links, [1], footnotes, or HTML tags.`.trim();
}
