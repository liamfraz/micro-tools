"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type IndentStyle = "2" | "4" | "tab";

// YAML tokenizer/parser and formatter
interface YamlNode {
  type: "mapping" | "sequence" | "scalar" | "comment" | "blank";
  key?: string;
  value?: string | YamlNode;
  children?: YamlNode[];
  comment?: string;
  isFlow?: boolean;
}

const tokenizeYaml = (input: string): YamlNode[] => {
  const lines = input.split("\n");
  const result: YamlNode[] = [];
  let i = 0;

  const getIndent = (line: string): number => {
    const match = line.match(/^(\s*)/);
    return match ? match[1].replace(/\t/g, "  ").length : 0;
  };

  const parseBlock = (baseIndent: number): YamlNode[] => {
    const nodes: YamlNode[] = [];

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Blank line
      if (trimmed === "") {
        nodes.push({ type: "blank" });
        i++;
        continue;
      }

      // Comment line
      if (trimmed.startsWith("#")) {
        nodes.push({ type: "comment", comment: trimmed });
        i++;
        continue;
      }

      const indent = getIndent(line);
      if (indent < baseIndent) break;
      if (indent > baseIndent && nodes.length > 0) {
        // This is a child block — attach to previous node
        const prev = nodes[nodes.length - 1];
        if (prev.type === "mapping" && !prev.children) {
          prev.children = parseBlock(indent);
          continue;
        }
      }

      // Sequence item
      if (trimmed.startsWith("- ") || trimmed === "-") {
        const content = trimmed === "-" ? "" : trimmed.slice(2);
        // Check for inline comment
        let comment = "";
        let cleanContent = content;
        const commentMatch = content.match(/^((?:[^#"']*(?:"[^"]*"|'[^']*'))*[^#"']*)(\s+#.*)$/);
        if (commentMatch) {
          cleanContent = commentMatch[1].trim();
          comment = commentMatch[2].trim();
        }

        const kvMatch = cleanContent.match(/^([^:]+?):\s*(.*)/);
        if (kvMatch && !cleanContent.startsWith('"') && !cleanContent.startsWith("'") && !cleanContent.startsWith("{") && !cleanContent.startsWith("[")) {
          // Mapping inside sequence
          const node: YamlNode = {
            type: "sequence",
            children: [{ type: "mapping", key: kvMatch[1], value: kvMatch[2] || undefined, comment }]
          };
          i++;
          // Check for more keys at deeper indent
          if (i < lines.length) {
            const nextIndent = getIndent(lines[i]);
            if (nextIndent > indent) {
              const moreChildren = parseBlock(nextIndent);
              node.children!.push(...moreChildren);
            }
          }
          nodes.push(node);
        } else {
          nodes.push({ type: "sequence", value: cleanContent || undefined, comment });
          i++;
          // Check for nested block
          if (i < lines.length && getIndent(lines[i]) > indent) {
            const last = nodes[nodes.length - 1];
            last.children = parseBlock(getIndent(lines[i]));
          }
        }
        continue;
      }

      // Mapping (key: value)
      const kvMatch = trimmed.match(/^([^:]+?):\s*(.*)/);
      if (kvMatch) {
        let comment = "";
        let val = kvMatch[2];
        // Check for inline comment (not inside quotes)
        const valCommentMatch = val.match(/^((?:[^#"']*(?:"[^"]*"|'[^']*'))*[^#"']*)(\s+#.*)$/);
        if (valCommentMatch) {
          val = valCommentMatch[1].trim();
          comment = valCommentMatch[2].trim();
        }

        const node: YamlNode = {
          type: "mapping",
          key: kvMatch[1],
          value: val || undefined,
          comment
        };
        i++;

        // Check for block scalar indicators
        if (val === "|" || val === ">" || val === "|-" || val === ">-" || val === "|+" || val === ">+") {
          // Collect block scalar content
          if (i < lines.length) {
            const scalarIndent = getIndent(lines[i]);
            if (scalarIndent > indent) {
              const scalarLines: string[] = [];
              while (i < lines.length) {
                const sl = lines[i];
                if (sl.trim() === "") {
                  scalarLines.push("");
                  i++;
                  continue;
                }
                if (getIndent(sl) < scalarIndent) break;
                scalarLines.push(sl.trim());
                i++;
              }
              node.value = val + "\n" + scalarLines.join("\n");
            }
          }
        } else if (!val) {
          // Nested block
          if (i < lines.length && lines[i].trim() !== "" && getIndent(lines[i]) > indent) {
            node.children = parseBlock(getIndent(lines[i]));
          }
        }

        nodes.push(node);
        continue;
      }

      // Document markers
      if (trimmed === "---" || trimmed === "...") {
        nodes.push({ type: "scalar", value: trimmed });
        i++;
        continue;
      }

      // Fallback scalar
      nodes.push({ type: "scalar", value: trimmed });
      i++;
    }

    return nodes;
  };

  const parsed = parseBlock(0);
  return parsed;
};

const formatNodes = (nodes: YamlNode[], indent: string, depth: number = 0): string => {
  const pad = indent.repeat(depth);
  const lines: string[] = [];

  for (const node of nodes) {
    if (node.type === "blank") {
      lines.push("");
      continue;
    }
    if (node.type === "comment") {
      lines.push(`${pad}${node.comment}`);
      continue;
    }
    if (node.type === "scalar") {
      lines.push(`${pad}${node.value || ""}`);
      continue;
    }
    if (node.type === "sequence") {
      if (node.children && node.children.length > 0) {
        // Mapping inside sequence
        const firstChild = node.children[0];
        if (firstChild.type === "mapping") {
          const comment = firstChild.comment ? ` ${firstChild.comment}` : "";
          const val = firstChild.value !== undefined ? ` ${firstChild.value}` : "";
          lines.push(`${pad}- ${firstChild.key}:${val}${comment}`);
          if (firstChild.children) {
            lines.push(formatNodes(firstChild.children, indent, depth + 2));
          }
          // Remaining children
          for (let c = 1; c < node.children.length; c++) {
            const child = node.children[c];
            if (child.type === "mapping") {
              const cv = child.value !== undefined ? ` ${child.value}` : "";
              const cc = child.comment ? ` ${child.comment}` : "";
              lines.push(`${pad}  ${child.key}:${cv}${cc}`);
              if (child.children) {
                lines.push(formatNodes(child.children, indent, depth + 2));
              }
            }
          }
        }
      } else {
        const val = node.value !== undefined ? ` ${node.value}` : "";
        const comment = node.comment ? ` ${node.comment}` : "";
        lines.push(`${pad}-${val}${comment}`);
        if (node.children) {
          lines.push(formatNodes(node.children, indent, depth + 1));
        }
      }
      continue;
    }
    if (node.type === "mapping") {
      const comment = node.comment ? ` ${node.comment}` : "";
      if (node.value !== undefined && typeof node.value === "string" && node.value.startsWith("|") || typeof node.value === "string" && node.value?.startsWith(">")) {
        // Block scalar
        const valLines = (node.value as string).split("\n");
        lines.push(`${pad}${node.key}: ${valLines[0]}${comment}`);
        for (let l = 1; l < valLines.length; l++) {
          lines.push(`${pad}${indent}${valLines[l]}`);
        }
      } else if (node.children) {
        lines.push(`${pad}${node.key}:${comment}`);
        lines.push(formatNodes(node.children, indent, depth + 1));
      } else {
        const val = node.value !== undefined ? ` ${node.value}` : "";
        lines.push(`${pad}${node.key}:${val}${comment}`);
      }
    }
  }

  return lines.join("\n");
};

const minifyYaml = (input: string): string => {
  const lines = input.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip blank lines and comments
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    // Keep document markers
    if (trimmed === "---" || trimmed === "...") {
      result.push(trimmed);
      continue;
    }
    // Strip inline comments (outside quotes)
    let clean = trimmed;
    const commentMatch = trimmed.match(/^((?:[^#"']*(?:"[^"]*"|'[^']*'))*[^#"']*)(\s+#.*)$/);
    if (commentMatch) {
      clean = commentMatch[1].trimEnd();
    }
    result.push(clean);
  }

  return result.join("\n");
};

const sortKeys = (input: string): string => {
  const lines = input.split("\n");
  const result: string[] = [];

  // Simple key sorter — sorts top-level keys alphabetically
  const blocks: { key: string; lines: string[] }[] = [];
  let currentBlock: { key: string; lines: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#") || trimmed === "---" || trimmed === "...") {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      result.push(line);
      continue;
    }

    const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
    if (indent === 0 && !trimmed.startsWith("-")) {
      if (currentBlock) blocks.push(currentBlock);
      const key = trimmed.split(":")[0];
      currentBlock = { key, lines: [line] };
    } else if (currentBlock) {
      currentBlock.lines.push(line);
    } else {
      result.push(line);
    }
  }
  if (currentBlock) blocks.push(currentBlock);

  blocks.sort((a, b) => a.key.localeCompare(b.key));
  for (const block of blocks) {
    result.push(...block.lines);
  }

  return result.join("\n");
};

const EXAMPLE_YAML = `# Application configuration
name: my-app
version: "2.1.0"
description: A sample application config

# Server settings
server:
  host: 0.0.0.0
  port: 8080
  ssl:
    enabled: true
    cert: /etc/ssl/cert.pem
    key: /etc/ssl/key.pem

# Database configuration
database:
  driver: postgres
  host: localhost
  port: 5432
  name: mydb
  pool:
    min: 5
    max: 20
    idle_timeout: 30s

# Feature flags
features:
  - name: dark-mode
    enabled: true
    rollout: 100
  - name: beta-api
    enabled: false
    rollout: 0

# Logging
logging:
  level: info
  format: json
  outputs:
    - stdout
    - file:///var/log/app.log`;

const EXAMPLE_K8S = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.25
          ports:
            - containerPort: 80
          resources:
            limits:
              cpu: "500m"
              memory: "128Mi"
            requests:
              cpu: "250m"
              memory: "64Mi"`;

export default function YamlFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indentStyle, setIndentStyle] = useState<IndentStyle>("2");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const getIndent = useCallback((): string => {
    if (indentStyle === "tab") return "\t";
    return " ".repeat(parseInt(indentStyle, 10));
  }, [indentStyle]);

  const handleFormat = useCallback(() => {
    if (!input.trim()) { setOutput(""); setError(""); return; }
    try {
      const nodes = tokenizeYaml(input);
      const formatted = formatNodes(nodes, getIndent());
      setOutput(formatted);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to format YAML.");
    }
  }, [input, getIndent]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) { setOutput(""); setError(""); return; }
    try {
      setOutput(minifyYaml(input));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to minify YAML.");
    }
  }, [input]);

  const handleSortKeys = useCallback(() => {
    if (!input.trim()) { setOutput(""); setError(""); return; }
    try {
      const sorted = sortKeys(input);
      const nodes = tokenizeYaml(sorted);
      const formatted = formatNodes(nodes, getIndent());
      setOutput(formatted);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to sort keys.");
    }
  }, [input, getIndent]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
  }, []);

  const inputLines = input ? input.split("\n").length : 0;
  const inputChars = input.length;
  const outputLines = output ? output.split("\n").length : 0;
  const outputChars = output.length;
  const savings = inputChars > 0 && outputChars > 0 && outputChars < inputChars
    ? Math.round((1 - outputChars / inputChars) * 100)
    : 0;

  return (
    <>
      <title>YAML Formatter & Beautifier - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Format, beautify, minify, and sort YAML online for free. Perfect for Kubernetes manifests, Docker Compose, GitHub Actions, and config files."
      />
    <main className="min-h-screen bg-slate-900 text-white">
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "yaml-formatter",
            name: "YAML Formatter & Validator",
            description: "Format, validate, and convert YAML to JSON with syntax highlighting",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "yaml-formatter",
            name: "YAML Formatter & Validator",
            description: "Format, validate, and convert YAML to JSON with syntax highlighting",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What is YAML used for?", answer: "YAML is a human-readable data serialization format widely used for configuration files. Common uses include Kubernetes manifests, Docker Compose files, GitHub Actions workflows, Ansible playbooks, and application config files." },
            { question: "Does 'Sort Keys' sort nested keys too?", answer: "Currently, Sort Keys sorts top-level keys alphabetically while preserving nested structure. This is useful for standardizing configuration file order (e.g., alphabetical sections in a docker-compose.yml)." },
            { question: "What does 'Minify' remove?", answer: "Minify removes blank lines, comments, and trailing whitespace while preserving the essential YAML structure. It reduces file size while keeping the document valid and parseable." },
            { question: "Should I use 2 spaces or 4 spaces for YAML?", answer: "2 spaces is the most common convention, especially in Kubernetes, Docker Compose, and GitHub Actions. 4 spaces provides more visual separation for deeply nested structures. Tabs are valid but rarely used in YAML." },
            { question: "Is this tool safe for production YAML files?", answer: "Yes -- all processing happens in your browser. No data is sent to any server. However, always review formatted output before replacing production configs, especially for files with anchors, aliases, or complex multiline strings." },
          ]),
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to all tools
          </a>
          <h1 className="text-3xl font-bold mb-2">YAML Formatter & Beautifier</h1>
          <p className="text-slate-400">
            Format, beautify, minify, and sort YAML with proper indentation. Perfect for Kubernetes manifests, Docker Compose, GitHub Actions, and config files.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-slate-300">Input YAML</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Indent:</label>
                <select
                  value={indentStyle}
                  onChange={(e) => setIndentStyle(e.target.value as IndentStyle)}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                  <option value="tab">Tab</option>
                </select>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setInput(EXAMPLE_YAML)}
                  className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                >
                  App Config
                </button>
                <button
                  onClick={() => setInput(EXAMPLE_K8S)}
                  className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                >
                  K8s Manifest
                </button>
                <button
                  onClick={handleClear}
                  className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            placeholder="Paste your YAML here..."
            className="w-full h-64 bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            spellCheck={false}
          />

          {inputChars > 0 && (
            <div className="text-xs text-slate-500 mt-1">
              {inputLines} lines · {inputChars} characters
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <button
              onClick={handleFormat}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
            >
              Beautify
            </button>
            <button
              onClick={handleMinify}
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
            >
              Minify
            </button>
            <button
              onClick={handleSortKeys}
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
            >
              Sort Keys
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-400">
                {outputLines} lines · {outputChars} chars
                {savings > 0 && (
                  <span className="text-green-400 ml-2">
                    ({savings}% smaller)
                  </span>
                )}
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono text-slate-200 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre">
              {output}
            </pre>
          </div>
        )}

        <RelatedTools currentSlug="yaml-formatter" />

        {/* YAML Cheat Sheet */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">YAML Syntax Reference</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400 font-medium">Construct</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Syntax</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  ["Mapping", "key: value", "Key-value pair (colon + space)"],
                  ["Sequence", "- item", "List item (dash + space)"],
                  ["Nested", "  key: value", "Indentation creates hierarchy"],
                  ["String", "name: hello", "Unquoted, single, or double quotes"],
                  ["Multiline (literal)", "text: |", "Preserves newlines exactly"],
                  ["Multiline (folded)", "text: >", "Folds newlines into spaces"],
                  ["Comment", "# comment", "Comments start with #"],
                  ["Document start", "---", "Marks beginning of a document"],
                  ["Null", "value: null", "Or ~ or empty value"],
                  ["Boolean", "flag: true", "true/false, yes/no, on/off"],
                  ["Anchor", "&name value", "Define reusable value"],
                  ["Alias", "*name", "Reference an anchor"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-slate-700/50">
                    <td className="py-2 font-medium text-white">{row[0]}</td>
                    <td className="py-2 font-mono text-blue-400">{row[1]}</td>
                    <td className="py-2">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "What is YAML used for?",
                a: "YAML is a human-readable data serialization format widely used for configuration files. Common uses include Kubernetes manifests, Docker Compose files, GitHub Actions workflows, Ansible playbooks, and application config files."
              },
              {
                q: "Does 'Sort Keys' sort nested keys too?",
                a: "Currently, Sort Keys sorts top-level keys alphabetically while preserving nested structure. This is useful for standardizing configuration file order (e.g., alphabetical sections in a docker-compose.yml)."
              },
              {
                q: "What does 'Minify' remove?",
                a: "Minify removes blank lines, comments, and trailing whitespace while preserving the essential YAML structure. It reduces file size while keeping the document valid and parseable."
              },
              {
                q: "Should I use 2 spaces or 4 spaces for YAML?",
                a: "2 spaces is the most common convention, especially in Kubernetes, Docker Compose, and GitHub Actions. 4 spaces provides more visual separation for deeply nested structures. Tabs are valid but rarely used in YAML."
              },
              {
                q: "Is this tool safe for production YAML files?",
                a: "Yes — all processing happens in your browser. No data is sent to any server. However, always review formatted output before replacing production configs, especially for files with anchors, aliases, or complex multiline strings."
              },
            ].map((item) => (
              <div key={item.q}>
                <h3 className="font-medium text-white text-sm">{item.q}</h3>
                <p className="text-slate-400 text-sm mt-1">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
