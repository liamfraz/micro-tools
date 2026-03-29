You are performing a comprehensive QA audit of the devtools.page website (source at /Users/liamfrazer/projects/micro-tools).

## Scope
Test every tool listed on the homepage for functional correctness. The site is live at https://devtools.page.

## Process

### Phase 1: Inventory
1. Read the source code to build a complete list of all tools (every route under /tools/)
2. Categorize them: text utilities, converters, generators, formatters, image tools, etc.

### Phase 2: Functional Testing
For EACH tool, use Playwright browser automation to:
1. Navigate to the tool page
2. Verify the page loads without errors (check console for JS errors)
3. Enter realistic test input appropriate for that tool
4. Trigger the tool's action (click convert/format/generate button)
5. Verify the output is correct and makes sense
6. Take a screenshot as evidence
7. Record pass/fail with notes

### Test inputs to use:
- JSON tools: `{"name": "test", "items": [1, 2, 3], "nested": {"key": "value"}}`
- Text tools: "Hello World! This is a TEST string with 123 numbers."
- URL tools: `https://example.com/path?query=hello world&foo=bar`
- Base64: `SGVsbG8gV29ybGQ=` (decode) / `Hello World` (encode)
- Regex: pattern `\d+` against `abc 123 def 456`
- Hash: `Hello World`
- Color tools: `#3B82F6`
- CSS/HTML tools: use realistic multi-line samples
- Image tools: test with a sample image from the public folder or generate a placeholder
- Markdown: `# Hello\n\n**Bold** and *italic* with a [link](https://example.com)`

### Phase 3: Cross-cutting checks
- [ ] All pages have correct meta titles and descriptions
- [ ] No broken links on any page
- [ ] Footer and header render correctly on every page
- [ ] Privacy policy page loads
- [ ] Sitemap.xml is valid and lists all tools
- [ ] robots.txt is valid
- [ ] Mobile responsive — test at 375px width on 3 random tool pages
- [ ] Dark mode renders correctly (no white-on-white or invisible elements)
- [ ] No console errors or warnings on any page

### Phase 4: Report
Create a markdown report at `/Users/liamfrazer/projects/micro-tools/docs/qa-audit.md` with:
- Date of audit
- Summary: total tools tested, pass rate
- Table: Tool name | URL | Status (✅/❌) | Notes
- Cross-cutting results
- List of bugs found with severity (critical/major/minor)
- Screenshots saved to `/Users/liamfrazer/projects/micro-tools/docs/qa-screenshots/`

Use parallel sub-agents to test tools in batches of 5 for speed. Each agent tests its batch and returns results.
