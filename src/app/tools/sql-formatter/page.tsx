"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type KeywordCase = "upper" | "lower" | "preserve";

const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "IS", "NULL",
  "LIKE", "BETWEEN", "EXISTS", "JOIN", "INNER", "LEFT", "RIGHT", "FULL",
  "OUTER", "CROSS", "ON", "AS", "ORDER", "BY", "GROUP", "HAVING",
  "LIMIT", "OFFSET", "UNION", "ALL", "INTERSECT", "EXCEPT", "INSERT",
  "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "DROP",
  "ALTER", "ADD", "COLUMN", "INDEX", "VIEW", "DATABASE", "IF", "ELSE",
  "THEN", "WHEN", "CASE", "END", "BEGIN", "COMMIT", "ROLLBACK",
  "TRANSACTION", "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "UNIQUE",
  "CHECK", "DEFAULT", "CONSTRAINT", "CASCADE", "DISTINCT", "TOP",
  "ASC", "DESC", "WITH", "RECURSIVE", "OVER", "PARTITION", "ROW",
  "ROWS", "RANGE", "UNBOUNDED", "PRECEDING", "FOLLOWING", "CURRENT",
  "FETCH", "NEXT", "ONLY", "GRANT", "REVOKE", "TRUNCATE", "REPLACE",
  "MERGE", "USING", "MATCHED", "COALESCE", "CAST", "CONVERT",
  "COUNT", "SUM", "AVG", "MIN", "MAX", "HAVING", "NATURAL",
]);

const CLAUSE_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN",
  "FULL JOIN", "FULL OUTER JOIN", "CROSS JOIN", "LEFT OUTER JOIN",
  "RIGHT OUTER JOIN", "NATURAL JOIN", "ON", "ORDER BY", "GROUP BY",
  "HAVING", "LIMIT", "OFFSET", "UNION", "UNION ALL", "INTERSECT",
  "EXCEPT", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
  "CREATE TABLE", "DROP TABLE", "ALTER TABLE", "WITH",
]);

const EXAMPLE_SQL = `SELECT u.id, u.name, u.email, COUNT(o.id) AS order_count, SUM(o.total) AS total_spent FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE u.active = 1 AND o.created_at >= '2024-01-01' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 5 ORDER BY total_spent DESC LIMIT 50;`;

export default function SqlFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper");
  const [indentSize, setIndentSize] = useState(2);
  const [copied, setCopied] = useState(false);

  const formatSQL = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const indent = " ".repeat(indentSize);
    const tokens = tokenize(input);
    const lines: string[] = [];
    let currentLine = "";
    let depth = 0;
    let i = 0;

    const applyCase = (word: string): string => {
      if (keywordCase === "upper") return word.toUpperCase();
      if (keywordCase === "lower") return word.toLowerCase();
      return word;
    };

    const pushLine = (line: string) => {
      if (line.trim()) {
        lines.push(indent.repeat(depth) + line.trim());
      }
    };

    while (i < tokens.length) {
      const token = tokens[i];
      const upper = token.toUpperCase();

      // Check for two-word clause keywords
      const nextToken = i + 1 < tokens.length ? tokens[i + 1] : "";
      const twoWord = (upper + " " + nextToken.toUpperCase()).trim();

      if (CLAUSE_KEYWORDS.has(twoWord) && nextToken) {
        pushLine(currentLine);
        currentLine = applyCase(twoWord);
        i += 2;
        continue;
      }

      if (CLAUSE_KEYWORDS.has(upper)) {
        pushLine(currentLine);
        currentLine = applyCase(upper);
        i++;
        continue;
      }

      if (upper === "AND" || upper === "OR") {
        pushLine(currentLine);
        currentLine = indent + applyCase(upper);
        i++;
        continue;
      }

      if (token === "(") {
        currentLine += " (";
        // Check if it's a subquery
        const nextNonSpace = findNextNonSpace(tokens, i + 1);
        if (nextNonSpace && ["SELECT", "WITH"].includes(nextNonSpace.toUpperCase())) {
          pushLine(currentLine);
          currentLine = "";
          depth++;
        }
        i++;
        continue;
      }

      if (token === ")") {
        if (depth > 0) {
          pushLine(currentLine);
          depth--;
          currentLine = ")";
        } else {
          currentLine += ")";
        }
        i++;
        continue;
      }

      if (token === ",") {
        currentLine += ",";
        // For SELECT fields, break after comma
        const lastClause = findLastClause(lines, currentLine);
        if (lastClause === "SELECT" || lastClause === "GROUP BY" || lastClause === "ORDER BY") {
          pushLine(currentLine);
          currentLine = indent;
        }
        i++;
        continue;
      }

      if (token === ";") {
        currentLine += ";";
        pushLine(currentLine);
        currentLine = "";
        lines.push("");
        i++;
        continue;
      }

      // Regular token
      if (SQL_KEYWORDS.has(upper)) {
        currentLine += (currentLine.trim() ? " " : "") + applyCase(upper);
      } else {
        currentLine += (currentLine.trim() ? " " : "") + token;
      }
      i++;
    }

    pushLine(currentLine);
    setOutput(lines.join("\n").replace(/\n{3,}/g, "\n\n").trim());
  }, [input, keywordCase, indentSize]);

  const minifySQL = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      return;
    }
    // Remove extra whitespace, keep single spaces
    const minified = input
      .replace(/--.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .trim();
    setOutput(minified);
  }, [input]);

  const copyOutput = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const clearAll = useCallback(() => {
    setInput("");
    setOutput("");
  }, []);

  const loadExample = useCallback(() => {
    setInput(EXAMPLE_SQL);
    setOutput("");
  }, []);

  return (
    <>
      <title>SQL Formatter & Beautifier - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Format and beautify SQL queries online for free. Pretty-print SQL with keyword casing, custom indentation, and minification. Supports SELECT, INSERT, UPDATE, DELETE, and more."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "sql-formatter",
            name: "SQL Formatter",
            description: "Format and beautify SQL queries with proper indentation and keyword highlighting",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "sql-formatter",
            name: "SQL Formatter",
            description: "Format and beautify SQL queries with proper indentation and keyword highlighting",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What SQL dialects does this formatter support?", answer: "This formatter works with standard SQL (ANSI SQL) and is compatible with most dialects including MySQL, PostgreSQL, SQLite, SQL Server, and Oracle. It formats based on keyword recognition rather than dialect-specific parsing, so it handles common statements across all major databases." },
            { question: "Does formatting change the meaning of my SQL?", answer: "No. Formatting only changes whitespace and optionally the case of SQL keywords. The logical structure and execution plan of your query remain identical. Minification similarly only removes unnecessary whitespace and comments." },
            { question: "Why should I format my SQL queries?", answer: "Formatted SQL is easier to read, review, and debug. Consistent formatting helps teams maintain code quality, makes complex queries with multiple JOINs and subqueries more understandable, and is considered a best practice in professional development." },
            { question: "Is my SQL data safe?", answer: "Yes. All formatting happens entirely in your browser using JavaScript. No SQL queries are sent to any server. Your data never leaves your machine." },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li>
                <a href="/tools" className="hover:text-white transition-colors">
                  Developer Tools
                </a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">SQL Formatter</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              SQL Formatter & Beautifier
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Format, beautify, and minify SQL queries instantly. Supports keyword
              casing, custom indentation, and handles SELECT, INSERT, UPDATE,
              DELETE, JOIN, subqueries, and more.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={formatSQL}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Format
            </button>
            <button
              onClick={minifySQL}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Minify
            </button>
            <button
              onClick={copyOutput}
              disabled={!output}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={loadExample}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Example
            </button>

            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Keywords:</label>
                <select
                  value={keywordCase}
                  onChange={(e) => setKeywordCase(e.target.value as KeywordCase)}
                  className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm"
                >
                  <option value="upper">UPPERCASE</option>
                  <option value="lower">lowercase</option>
                  <option value="preserve">Preserve</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Indent:</label>
                <select
                  value={indentSize}
                  onChange={(e) => setIndentSize(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm"
                >
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                </select>
              </div>
            </div>
          </div>

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Input SQL
                </label>
                <span className="text-xs text-slate-500">
                  {input.length} chars
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setOutput("");
                }}
                placeholder={"Paste your SQL query here...\n\nSELECT * FROM users WHERE active = 1"}
                className="w-full h-96 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Formatted SQL
                </label>
                <span className="text-xs text-slate-500">
                  {output ? `${output.length} chars | ${output.split("\n").length} lines` : ""}
                </span>
              </div>
              <textarea
                value={output}
                readOnly
                placeholder="Formatted SQL will appear here..."
                className="w-full h-96 bg-slate-800 border border-slate-600 rounded-lg p-4 font-mono text-sm text-green-300 placeholder-slate-500 resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>
          </div>

          <RelatedTools currentSlug="sql-formatter" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What SQL dialects does this formatter support?
                </h3>
                <p className="text-slate-400">
                  This formatter works with standard SQL (ANSI SQL) and is
                  compatible with most dialects including MySQL, PostgreSQL,
                  SQLite, SQL Server, and Oracle. It formats based on keyword
                  recognition rather than dialect-specific parsing, so it handles
                  common statements across all major databases.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Does formatting change the meaning of my SQL?
                </h3>
                <p className="text-slate-400">
                  No. Formatting only changes whitespace and optionally the case
                  of SQL keywords. The logical structure and execution plan of
                  your query remain identical. Minification similarly only removes
                  unnecessary whitespace and comments.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Why should I format my SQL queries?
                </h3>
                <p className="text-slate-400">
                  Formatted SQL is easier to read, review, and debug. Consistent
                  formatting helps teams maintain code quality, makes complex
                  queries with multiple JOINs and subqueries more understandable,
                  and is considered a best practice in professional development.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my SQL data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All formatting happens entirely in your browser using
                  JavaScript. No SQL queries are sent to any server. Your data
                  never leaves your machine.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// --- Helper functions ---

function tokenize(sql: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < sql.length) {
    // Skip whitespace
    if (/\s/.test(sql[i])) {
      i++;
      continue;
    }

    // Single-line comment
    if (sql[i] === "-" && sql[i + 1] === "-") {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end + 1;
      continue;
    }

    // Multi-line comment
    if (sql[i] === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      continue;
    }

    // String literal (single quotes)
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === "'" && sql[j + 1] === "'") {
          j += 2; // escaped quote
        } else if (sql[j] === "'") {
          break;
        } else {
          j++;
        }
      }
      tokens.push(sql.slice(i, j + 1));
      i = j + 1;
      continue;
    }

    // String literal (double quotes / identifiers)
    if (sql[i] === '"') {
      let j = i + 1;
      while (j < sql.length && sql[j] !== '"') j++;
      tokens.push(sql.slice(i, j + 1));
      i = j + 1;
      continue;
    }

    // Backtick identifiers
    if (sql[i] === "`") {
      let j = i + 1;
      while (j < sql.length && sql[j] !== "`") j++;
      tokens.push(sql.slice(i, j + 1));
      i = j + 1;
      continue;
    }

    // Special single characters
    if ("(),;".includes(sql[i])) {
      tokens.push(sql[i]);
      i++;
      continue;
    }

    // Operators
    if ("=<>!+-*/%".includes(sql[i])) {
      let op = sql[i];
      if (i + 1 < sql.length && "=<>".includes(sql[i + 1])) {
        op += sql[i + 1];
        i++;
      }
      tokens.push(op);
      i++;
      continue;
    }

    // Dot
    if (sql[i] === ".") {
      // Attach to previous and next token (table.column)
      if (tokens.length > 0) {
        let j = i + 1;
        while (j < sql.length && /[a-zA-Z0-9_]/.test(sql[j])) j++;
        const prev = tokens.pop()!;
        tokens.push(prev + "." + sql.slice(i + 1, j));
        i = j;
        continue;
      }
      tokens.push(".");
      i++;
      continue;
    }

    // Words and numbers
    if (/[a-zA-Z0-9_@#$]/.test(sql[i])) {
      let j = i;
      while (j < sql.length && /[a-zA-Z0-9_@#$.]/.test(sql[j])) j++;
      tokens.push(sql.slice(i, j));
      i = j;
      continue;
    }

    // Anything else
    tokens.push(sql[i]);
    i++;
  }

  return tokens;
}

function findNextNonSpace(tokens: string[], start: number): string | null {
  for (let i = start; i < tokens.length; i++) {
    if (tokens[i].trim()) return tokens[i];
  }
  return null;
}

function findLastClause(lines: string[], currentLine: string): string | null {
  const allLines = [...lines, currentLine];
  for (let i = allLines.length - 1; i >= 0; i--) {
    const trimmed = allLines[i].trim().toUpperCase();
    const keywords = Array.from(CLAUSE_KEYWORDS);
    for (let k = 0; k < keywords.length; k++) {
      if (trimmed.startsWith(keywords[k])) return keywords[k];
    }
  }
  return null;
}
