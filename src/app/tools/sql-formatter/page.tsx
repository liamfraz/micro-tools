"use client";

import { useState, useCallback } from "react";
import { format as formatSql } from "sql-formatter";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type SqlDialect = "sql" | "mysql" | "postgresql" | "sqlite" | "transactsql" | "plsql" | "mariadb" | "bigquery";
type KeywordCase = "upper" | "lower" | "preserve";

const DIALECTS: { value: SqlDialect; label: string }[] = [
  { value: "sql", label: "Standard SQL" },
  { value: "mysql", label: "MySQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "transactsql", label: "SQL Server (T-SQL)" },
  { value: "plsql", label: "Oracle (PL/SQL)" },
  { value: "mariadb", label: "MariaDB" },
  { value: "bigquery", label: "BigQuery" },
];

const EXAMPLE_SQL = `SELECT u.id, u.name, u.email, COUNT(o.id) AS order_count, SUM(o.total) AS total_spent FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE u.active = 1 AND o.created_at >= '2024-01-01' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 5 ORDER BY total_spent DESC LIMIT 50;`;

export default function SqlFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [dialect, setDialect] = useState<SqlDialect>("sql");
  const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper");
  const [indentSize, setIndentSize] = useState(2);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError("");
      return;
    }
    try {
      const result = formatSql(input, {
        language: dialect,
        keywordCase,
        tabWidth: indentSize,
        useTabs: false,
      });
      setOutput(result);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to format SQL");
      setOutput("");
    }
  }, [input, dialect, keywordCase, indentSize]);

  const minifySQL = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError("");
      return;
    }
    const minified = input
      .replace(/--.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .trim();
    setOutput(minified);
    setError("");
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
    setError("");
  }, []);

  const loadExample = useCallback(() => {
    setInput(EXAMPLE_SQL);
    setOutput("");
    setError("");
  }, []);

  return (
    <>
      <title>SQL Formatter Online — Format & Beautify SQL Queries Free | DevTools Hub</title>
      <meta
        name="description"
        content="Free online SQL formatter and beautifier. Format SQL queries with dialect support for MySQL, PostgreSQL, SQLite, SQL Server, and Oracle. Configurable indentation, keyword casing, copy output instantly."
      />
      <meta
        name="keywords"
        content="sql formatter online, sql beautifier, format sql query, sql pretty print, mysql formatter, postgresql formatter, sqlite formatter, sql indent, sql minifier"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "sql-formatter",
            name: "SQL Formatter",
            description:
              "Format and beautify SQL queries online with dialect support for MySQL, PostgreSQL, SQLite, SQL Server, and Oracle.",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "sql-formatter",
            name: "SQL Formatter",
            description:
              "Format and beautify SQL queries online with dialect support for MySQL, PostgreSQL, SQLite, SQL Server, and Oracle.",
            category: "developer",
          }),
          generateFAQSchema([
            {
              question: "What SQL dialects does this formatter support?",
              answer:
                "This formatter supports Standard SQL, MySQL, PostgreSQL, SQLite, SQL Server (T-SQL), Oracle (PL/SQL), MariaDB, and BigQuery. Each dialect uses dialect-specific parsing for accurate formatting of vendor-specific syntax like backtick identifiers (MySQL), double-quoted identifiers (PostgreSQL), and square bracket identifiers (SQL Server).",
            },
            {
              question: "Does formatting change the meaning of my SQL?",
              answer:
                "No. Formatting only changes whitespace and optionally the case of SQL keywords. The logical structure and execution plan of your query remain identical. Minification similarly only removes unnecessary whitespace and comments.",
            },
            {
              question: "Why should I format my SQL queries?",
              answer:
                "Formatted SQL is easier to read, review, and debug. Consistent formatting helps teams maintain code quality, makes complex queries with multiple JOINs and subqueries more understandable, and is considered a best practice in professional development.",
            },
            {
              question: "Is my SQL data safe?",
              answer:
                "Yes. All formatting happens entirely in your browser using JavaScript. No SQL queries are sent to any server. Your data never leaves your machine.",
            },
            {
              question: "Can I format stored procedures and DDL statements?",
              answer:
                "Yes. The formatter handles SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, ALTER TABLE, DROP, and other DDL/DML statements. When using dialect-specific modes like PL/SQL or T-SQL, stored procedure syntax is also supported.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="sql-formatter" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              SQL Formatter & Beautifier
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Format, beautify, and minify SQL queries instantly. Supports
              MySQL, PostgreSQL, SQLite, SQL Server, Oracle, and more with
              configurable indentation and keyword casing.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={handleFormat}
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

            <div className="ml-auto flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Dialect:</label>
                <select
                  value={dialect}
                  onChange={(e) => setDialect(e.target.value as SqlDialect)}
                  className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm"
                >
                  {DIALECTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
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

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

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
                  setError("");
                }}
                placeholder={
                  "Paste your SQL query here...\n\nSELECT * FROM users WHERE active = 1"
                }
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
                  {output
                    ? `${output.length} chars | ${output.split("\n").length} lines`
                    : ""}
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
                  This formatter supports Standard SQL, MySQL, PostgreSQL,
                  SQLite, SQL Server (T-SQL), Oracle (PL/SQL), MariaDB, and
                  BigQuery. Each dialect uses dialect-specific parsing for
                  accurate formatting of vendor-specific syntax like backtick
                  identifiers (MySQL), double-quoted identifiers (PostgreSQL),
                  and square bracket identifiers (SQL Server).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Does formatting change the meaning of my SQL?
                </h3>
                <p className="text-slate-400">
                  No. Formatting only changes whitespace and optionally the case
                  of SQL keywords. The logical structure and execution plan of
                  your query remain identical. Minification similarly only
                  removes unnecessary whitespace and comments.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Why should I format my SQL queries?
                </h3>
                <p className="text-slate-400">
                  Formatted SQL is easier to read, review, and debug. Consistent
                  formatting helps teams maintain code quality, makes complex
                  queries with multiple JOINs and subqueries more
                  understandable, and is considered a best practice in
                  professional development.
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

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I format stored procedures and DDL statements?
                </h3>
                <p className="text-slate-400">
                  Yes. The formatter handles SELECT, INSERT, UPDATE, DELETE,
                  CREATE TABLE, ALTER TABLE, DROP, and other DDL/DML statements.
                  When using dialect-specific modes like PL/SQL or T-SQL, stored
                  procedure syntax is also supported.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
