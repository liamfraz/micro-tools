"use client";

import { useState, useCallback } from "react";

// ── JSON Schema Validator (Draft-07 subset) ──

interface ValidationError {
  path: string;
  message: string;
  keyword: string;
}

type Schema = Record<string, unknown>;

const resolveRef = (ref: string, rootSchema: Schema): Schema | null => {
  if (!ref.startsWith("#/")) return null;
  const parts = ref.slice(2).split("/");
  let current: unknown = rootSchema;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  return current as Schema;
};

const validate = (
  data: unknown,
  schema: Schema,
  rootSchema: Schema,
  path: string = ""
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const currentPath = path || "#";

  // Handle $ref
  if (schema.$ref && typeof schema.$ref === "string") {
    const resolved = resolveRef(schema.$ref, rootSchema);
    if (!resolved) {
      errors.push({ path: currentPath, message: `Cannot resolve $ref: ${schema.$ref}`, keyword: "$ref" });
      return errors;
    }
    return validate(data, resolved, rootSchema, path);
  }

  // Handle boolean schemas
  if (typeof schema === "boolean") {
    if (!schema) errors.push({ path: currentPath, message: "Schema is false — no value is valid", keyword: "false" });
    return errors;
  }

  // enum
  if (schema.enum && Array.isArray(schema.enum)) {
    const vals = schema.enum;
    if (!vals.some((v: unknown) => JSON.stringify(v) === JSON.stringify(data))) {
      errors.push({ path: currentPath, message: `Value must be one of: ${vals.map((v: unknown) => JSON.stringify(v)).join(", ")}`, keyword: "enum" });
    }
  }

  // const
  if ("const" in schema) {
    if (JSON.stringify(data) !== JSON.stringify(schema.const)) {
      errors.push({ path: currentPath, message: `Value must be ${JSON.stringify(schema.const)}`, keyword: "const" });
    }
  }

  // type
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = data === null ? "null" : Array.isArray(data) ? "array" : typeof data;
    const integerMatch = types.includes("integer") && typeof data === "number" && Number.isInteger(data);
    if (!types.includes(actualType) && !integerMatch) {
      errors.push({ path: currentPath, message: `Expected type ${types.join(" | ")}, got ${actualType}`, keyword: "type" });
      return errors; // type mismatch — skip further checks
    }
  }

  // ── String validations ──
  if (typeof data === "string") {
    if (typeof schema.minLength === "number" && data.length < schema.minLength) {
      errors.push({ path: currentPath, message: `String must be at least ${schema.minLength} characters (got ${data.length})`, keyword: "minLength" });
    }
    if (typeof schema.maxLength === "number" && data.length > schema.maxLength) {
      errors.push({ path: currentPath, message: `String must be at most ${schema.maxLength} characters (got ${data.length})`, keyword: "maxLength" });
    }
    if (typeof schema.pattern === "string") {
      try {
        if (!new RegExp(schema.pattern).test(data)) {
          errors.push({ path: currentPath, message: `String does not match pattern: ${schema.pattern}`, keyword: "pattern" });
        }
      } catch {
        errors.push({ path: currentPath, message: `Invalid regex pattern: ${schema.pattern}`, keyword: "pattern" });
      }
    }
    if (typeof schema.format === "string") {
      const fmt = schema.format;
      const formatChecks: Record<string, (v: string) => boolean> = {
        email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        uri: (v) => /^https?:\/\//.test(v),
        "date-time": (v) => !isNaN(Date.parse(v)) && /\d{4}-\d{2}-\d{2}T/.test(v),
        date: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
        time: (v) => /^\d{2}:\d{2}:\d{2}/.test(v),
        ipv4: (v) => /^(\d{1,3}\.){3}\d{1,3}$/.test(v) && v.split(".").every((o) => parseInt(o) <= 255),
        ipv6: (v) => /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(v),
        uuid: (v) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v),
      };
      if (formatChecks[fmt] && !formatChecks[fmt](data)) {
        errors.push({ path: currentPath, message: `Invalid ${fmt} format`, keyword: "format" });
      }
    }
  }

  // ── Number validations ──
  if (typeof data === "number") {
    if (typeof schema.minimum === "number" && data < schema.minimum) {
      errors.push({ path: currentPath, message: `Value must be >= ${schema.minimum}`, keyword: "minimum" });
    }
    if (typeof schema.maximum === "number" && data > schema.maximum) {
      errors.push({ path: currentPath, message: `Value must be <= ${schema.maximum}`, keyword: "maximum" });
    }
    if (typeof schema.exclusiveMinimum === "number" && data <= schema.exclusiveMinimum) {
      errors.push({ path: currentPath, message: `Value must be > ${schema.exclusiveMinimum}`, keyword: "exclusiveMinimum" });
    }
    if (typeof schema.exclusiveMaximum === "number" && data >= schema.exclusiveMaximum) {
      errors.push({ path: currentPath, message: `Value must be < ${schema.exclusiveMaximum}`, keyword: "exclusiveMaximum" });
    }
    if (typeof schema.multipleOf === "number" && data % schema.multipleOf !== 0) {
      errors.push({ path: currentPath, message: `Value must be a multiple of ${schema.multipleOf}`, keyword: "multipleOf" });
    }
  }

  // ── Array validations ──
  if (Array.isArray(data)) {
    if (typeof schema.minItems === "number" && data.length < schema.minItems) {
      errors.push({ path: currentPath, message: `Array must have at least ${schema.minItems} items (got ${data.length})`, keyword: "minItems" });
    }
    if (typeof schema.maxItems === "number" && data.length > schema.maxItems) {
      errors.push({ path: currentPath, message: `Array must have at most ${schema.maxItems} items (got ${data.length})`, keyword: "maxItems" });
    }
    if (schema.uniqueItems === true) {
      const seen = new Set(data.map((v) => JSON.stringify(v)));
      if (seen.size !== data.length) {
        errors.push({ path: currentPath, message: "Array items must be unique", keyword: "uniqueItems" });
      }
    }
    if (schema.items && typeof schema.items === "object" && !Array.isArray(schema.items)) {
      data.forEach((item, idx) => {
        errors.push(...validate(item, schema.items as Schema, rootSchema, `${currentPath}/${idx}`));
      });
    }
    if (schema.contains && typeof schema.contains === "object") {
      const hasMatch = data.some((item) => validate(item, schema.contains as Schema, rootSchema, currentPath).length === 0);
      if (!hasMatch) {
        errors.push({ path: currentPath, message: "Array must contain at least one matching item", keyword: "contains" });
      }
    }
  }

  // ── Object validations ──
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj);

    if (typeof schema.minProperties === "number" && keys.length < schema.minProperties) {
      errors.push({ path: currentPath, message: `Object must have at least ${schema.minProperties} properties (got ${keys.length})`, keyword: "minProperties" });
    }
    if (typeof schema.maxProperties === "number" && keys.length > schema.maxProperties) {
      errors.push({ path: currentPath, message: `Object must have at most ${schema.maxProperties} properties (got ${keys.length})`, keyword: "maxProperties" });
    }

    // required
    if (Array.isArray(schema.required)) {
      for (const req of schema.required as string[]) {
        if (!(req in obj)) {
          errors.push({ path: `${currentPath}/${req}`, message: `Missing required property: ${req}`, keyword: "required" });
        }
      }
    }

    // properties
    if (schema.properties && typeof schema.properties === "object") {
      const props = schema.properties as Record<string, Schema>;
      for (const [key, propSchema] of Object.entries(props)) {
        if (key in obj) {
          errors.push(...validate(obj[key], propSchema, rootSchema, `${currentPath}/${key}`));
        }
      }
    }

    // additionalProperties
    if ("additionalProperties" in schema && schema.properties) {
      const defined = Object.keys(schema.properties as Record<string, unknown>);
      const patternKeys = schema.patternProperties ? Object.keys(schema.patternProperties as Record<string, unknown>) : [];
      for (const key of keys) {
        if (!defined.includes(key)) {
          let matchedPattern = false;
          for (const pat of patternKeys) {
            try { if (new RegExp(pat).test(key)) { matchedPattern = true; break; } } catch { /* skip */ }
          }
          if (!matchedPattern) {
            if (schema.additionalProperties === false) {
              errors.push({ path: `${currentPath}/${key}`, message: `Additional property not allowed: ${key}`, keyword: "additionalProperties" });
            } else if (typeof schema.additionalProperties === "object") {
              errors.push(...validate(obj[key], schema.additionalProperties as Schema, rootSchema, `${currentPath}/${key}`));
            }
          }
        }
      }
    }

    // patternProperties
    if (schema.patternProperties && typeof schema.patternProperties === "object") {
      const pp = schema.patternProperties as Record<string, Schema>;
      for (const [pattern, pSchema] of Object.entries(pp)) {
        try {
          const re = new RegExp(pattern);
          for (const key of keys) {
            if (re.test(key)) {
              errors.push(...validate(obj[key], pSchema, rootSchema, `${currentPath}/${key}`));
            }
          }
        } catch { /* skip invalid patterns */ }
      }
    }

    // dependencies
    if (schema.dependencies && typeof schema.dependencies === "object") {
      const deps = schema.dependencies as Record<string, unknown>;
      for (const [key, dep] of Object.entries(deps)) {
        if (key in obj) {
          if (Array.isArray(dep)) {
            for (const req of dep as string[]) {
              if (!(req in obj)) {
                errors.push({ path: currentPath, message: `Property "${key}" requires "${req}" to be present`, keyword: "dependencies" });
              }
            }
          } else if (typeof dep === "object") {
            errors.push(...validate(data, dep as Schema, rootSchema, currentPath));
          }
        }
      }
    }
  }

  // ── Combinators ──
  if (schema.allOf && Array.isArray(schema.allOf)) {
    for (const sub of schema.allOf as Schema[]) {
      errors.push(...validate(data, sub, rootSchema, path));
    }
  }
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const subs = schema.anyOf as Schema[];
    const anyValid = subs.some((s) => validate(data, s, rootSchema, path).length === 0);
    if (!anyValid) {
      errors.push({ path: currentPath, message: "Value does not match any of the anyOf schemas", keyword: "anyOf" });
    }
  }
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    const subs = schema.oneOf as Schema[];
    const matchCount = subs.filter((s) => validate(data, s, rootSchema, path).length === 0).length;
    if (matchCount !== 1) {
      errors.push({ path: currentPath, message: `Value must match exactly one oneOf schema (matched ${matchCount})`, keyword: "oneOf" });
    }
  }
  if (schema.not && typeof schema.not === "object") {
    if (validate(data, schema.not as Schema, rootSchema, path).length === 0) {
      errors.push({ path: currentPath, message: "Value must NOT match the given schema", keyword: "not" });
    }
  }

  // if / then / else
  if (schema.if && typeof schema.if === "object") {
    const ifValid = validate(data, schema.if as Schema, rootSchema, path).length === 0;
    if (ifValid && schema.then && typeof schema.then === "object") {
      errors.push(...validate(data, schema.then as Schema, rootSchema, path));
    }
    if (!ifValid && schema.else && typeof schema.else === "object") {
      errors.push(...validate(data, schema.else as Schema, rootSchema, path));
    }
  }

  return errors;
};

const EXAMPLE_SCHEMA = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "type": "object",
  "required": ["name", "email", "age"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "role": {
      "type": "string",
      "enum": ["admin", "user", "editor"]
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "uniqueItems": true,
      "minItems": 1
    },
    "address": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" },
        "zip": {
          "type": "string",
          "pattern": "^[0-9]{5}(-[0-9]{4})?$"
        }
      },
      "required": ["street", "city"]
    }
  },
  "additionalProperties": false
}`;

const EXAMPLE_VALID = `{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "age": 30,
  "role": "admin",
  "tags": ["developer", "lead"],
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "zip": "62704"
  }
}`;

const EXAMPLE_INVALID = `{
  "name": "",
  "email": "not-an-email",
  "age": -5,
  "role": "superadmin",
  "tags": ["a", "a"],
  "address": {
    "zip": "abc"
  },
  "extra": true
}`;

export default function JsonSchemaValidatorPage() {
  const [schemaInput, setSchemaInput] = useState("");
  const [dataInput, setDataInput] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [parseError, setParseError] = useState("");
  const [validated, setValidated] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleValidate = useCallback(() => {
    setParseError("");
    setErrors([]);
    setValidated(false);

    if (!schemaInput.trim() || !dataInput.trim()) {
      setParseError("Both schema and data are required.");
      return;
    }

    let schema: Schema;
    try {
      schema = JSON.parse(schemaInput);
    } catch (e) {
      setParseError(`Invalid schema JSON: ${e instanceof Error ? e.message : "Parse error"}`);
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(dataInput);
    } catch (e) {
      setParseError(`Invalid data JSON: ${e instanceof Error ? e.message : "Parse error"}`);
      return;
    }

    const result = validate(data, schema, schema);
    setErrors(result);
    setValidated(true);
  }, [schemaInput, dataInput]);

  const handleCopy = useCallback(async () => {
    const text = errors.length === 0
      ? "Validation passed — no errors."
      : errors.map((e) => `${e.path}: [${e.keyword}] ${e.message}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [errors]);

  const handleClear = useCallback(() => {
    setSchemaInput("");
    setDataInput("");
    setErrors([]);
    setParseError("");
    setValidated(false);
  }, []);

  const loadExample = useCallback((type: "valid" | "invalid") => {
    setSchemaInput(EXAMPLE_SCHEMA);
    setDataInput(type === "valid" ? EXAMPLE_VALID : EXAMPLE_INVALID);
    setErrors([]);
    setParseError("");
    setValidated(false);
  }, []);

  return (
    <>
      <title>JSON Schema Validator - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Validate JSON data against JSON Schema (Draft-07) online for free. Check required fields, types, formats, patterns, and constraints — all in your browser."
      />

      <main className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><span className="mx-1">/</span></li>
              <li><a href="/tools" className="hover:text-white transition-colors">Developer Tools</a></li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">JSON Schema Validator</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              JSON Schema Validator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Validate JSON data against a JSON Schema (Draft-07). Check types, required fields, formats, patterns, enums, and nested constraints — entirely in your browser.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={handleValidate}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Validate
            </button>
            <button
              onClick={handleCopy}
              disabled={!validated}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy Results"}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => loadExample("valid")}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
              >
                Valid Example
              </button>
              <button
                onClick={() => loadExample("invalid")}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
              >
                Invalid Example
              </button>
            </div>
          </div>

          {/* Editor panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Schema */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">JSON Schema</label>
                <span className="text-xs text-slate-500">{schemaInput.length} chars</span>
              </div>
              <textarea
                value={schemaInput}
                onChange={(e) => { setSchemaInput(e.target.value); setValidated(false); }}
                placeholder='Paste your JSON Schema here...'
                className="w-full h-80 bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Data */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">JSON Data</label>
                <span className="text-xs text-slate-500">{dataInput.length} chars</span>
              </div>
              <textarea
                value={dataInput}
                onChange={(e) => { setDataInput(e.target.value); setValidated(false); }}
                placeholder='Paste the JSON to validate...'
                className="w-full h-80 bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="mb-6 p-4 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
              {parseError}
            </div>
          )}

          {/* Validation result */}
          {validated && (
            <div className="mb-6">
              {errors.length === 0 ? (
                <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg flex items-center gap-3">
                  <span className="inline-block w-4 h-4 rounded-full bg-green-500" />
                  <span className="text-green-300 font-medium">Valid — JSON data matches the schema.</span>
                </div>
              ) : (
                <div className="bg-slate-800 rounded-lg border border-red-700/50 overflow-hidden">
                  <div className="p-4 bg-red-900/30 border-b border-red-700/50 flex items-center gap-3">
                    <span className="inline-block w-4 h-4 rounded-full bg-red-500" />
                    <span className="text-red-300 font-medium">
                      Invalid — {errors.length} error{errors.length !== 1 ? "s" : ""} found
                    </span>
                  </div>
                  <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
                    {errors.map((err, i) => (
                      <div key={i} className="px-4 py-3 flex items-start gap-3">
                        <span className="text-xs font-mono bg-red-900/50 text-red-400 px-2 py-0.5 rounded whitespace-nowrap mt-0.5">
                          {err.keyword}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-mono text-blue-400 break-all">{err.path}</div>
                          <div className="text-sm text-slate-300 mt-0.5">{err.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Supported keywords */}
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Supported Schema Keywords</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400 font-medium">Category</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Keywords</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ["General", "type, enum, const, $ref"],
                    ["String", "minLength, maxLength, pattern, format (email, uri, date-time, date, time, ipv4, ipv6, uuid)"],
                    ["Number", "minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf"],
                    ["Array", "items, minItems, maxItems, uniqueItems, contains"],
                    ["Object", "properties, required, additionalProperties, patternProperties, minProperties, maxProperties, dependencies"],
                    ["Combinators", "allOf, anyOf, oneOf, not, if/then/else"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-slate-700/50">
                      <td className="py-2 font-medium text-white whitespace-nowrap">{row[0]}</td>
                      <td className="py-2 font-mono text-xs text-blue-400">{row[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Related Tools */}
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Related Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: "JSON Formatter", slug: "json-formatter", desc: "Format and validate JSON data" },
                { name: "JSON to YAML", slug: "json-to-yaml", desc: "Convert between JSON and YAML" },
                { name: "JSON to CSV", slug: "json-to-csv", desc: "Convert JSON arrays to CSV" },
              ].map((tool) => (
                <a
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="bg-slate-700/50 hover:bg-slate-700 rounded p-3 transition-colors block"
                >
                  <div className="font-medium text-blue-400 text-sm">{tool.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{tool.desc}</div>
                </a>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "What is JSON Schema?",
                  a: "JSON Schema is a vocabulary that allows you to annotate and validate JSON documents. It defines the shape of your data — types, required fields, string patterns, number ranges, and more. It's widely used for API request/response validation, configuration files, and form generation."
                },
                {
                  q: "Which JSON Schema draft does this support?",
                  a: "This validator implements a practical subset of JSON Schema Draft-07, covering the most commonly used keywords: type, properties, required, enum, const, format validations, array constraints, combinators (allOf, anyOf, oneOf, not), conditionals (if/then/else), $ref, and more."
                },
                {
                  q: "What formats are validated?",
                  a: "When format validation is enabled, this tool checks: email, uri, date-time (ISO 8601), date, time, ipv4, ipv6, and uuid. Format validation follows the specification's recommendation of basic structural checks."
                },
                {
                  q: "Is my data safe?",
                  a: "Yes. All validation happens entirely in your browser using JavaScript. No data is sent to any server. Your schemas and data never leave your machine."
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
