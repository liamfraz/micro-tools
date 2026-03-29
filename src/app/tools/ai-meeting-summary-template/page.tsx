"use client";

import { useState, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import AdUnit from "@/components/AdUnit";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

type MeetingType =
  | "general"
  | "standup"
  | "planning"
  | "retrospective"
  | "brainstorm"
  | "client";

type OutputFormat = "structured" | "action-items" | "email" | "markdown";

interface ParsedNotes {
  actionItems: string[];
  decisions: string[];
  discussions: string[];
}

function parseRawNotes(raw: string): ParsedNotes {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const actionItems: string[] = [];
  const decisions: string[] = [];
  const discussions: string[] = [];

  const actionPatterns =
    /\b(todo|action:|action item:|@\w+|will\s|need(s)?\sto|should\s|must\s|assigned\sto|task:)/i;
  const decisionPatterns =
    /\b(decided|agreed|confirmed|approved|resolved|conclusion:|decision:|we('ll| will) go with)/i;

  for (const line of lines) {
    if (actionPatterns.test(line)) {
      actionItems.push(line);
    } else if (decisionPatterns.test(line)) {
      decisions.push(line);
    } else {
      discussions.push(line);
    }
  }

  return { actionItems, decisions, discussions };
}

function extractOwner(line: string): string | null {
  const atMatch = line.match(/@(\w+)/);
  if (atMatch) return atMatch[1];

  const assignedMatch = line.match(
    /assigned\s+to\s+(\w+)/i
  );
  if (assignedMatch) return assignedMatch[1];

  return null;
}

function formatStructured(
  parsed: ParsedNotes,
  meetingType: MeetingType,
  title: string,
  date: string,
  attendees: string
): string {
  const header = buildHeader(title, date, attendees);
  let body = "";

  switch (meetingType) {
    case "standup": {
      const done: string[] = [];
      const planned: string[] = [];
      const blockers: string[] = [];

      for (const line of parsed.discussions) {
        const lower = line.toLowerCase();
        if (
          lower.includes("blocker") ||
          lower.includes("blocked") ||
          lower.includes("stuck")
        ) {
          blockers.push(line);
        } else if (
          lower.includes("yesterday") ||
          lower.includes("completed") ||
          lower.includes("finished") ||
          lower.includes("done")
        ) {
          done.push(line);
        } else {
          planned.push(line);
        }
      }

      body += "WHAT WAS DONE\n";
      body +=
        done.length > 0
          ? done.map((l) => `  - ${l}`).join("\n")
          : "  - No items identified";
      body += "\n\nWHAT'S PLANNED\n";
      body +=
        planned.length > 0
          ? planned.map((l) => `  - ${l}`).join("\n")
          : "  - No items identified";
      body += "\n\nBLOCKERS\n";
      body +=
        blockers.length > 0
          ? blockers.map((l) => `  - ${l}`).join("\n")
          : "  - None";
      break;
    }

    case "planning": {
      const goals: string[] = [];
      const tasks: string[] = [];
      const timeline: string[] = [];
      const deps: string[] = [];

      for (const line of parsed.discussions) {
        const lower = line.toLowerCase();
        if (
          lower.includes("goal") ||
          lower.includes("objective") ||
          lower.includes("target")
        ) {
          goals.push(line);
        } else if (
          lower.includes("deadline") ||
          lower.includes("timeline") ||
          lower.includes("date") ||
          lower.includes("sprint")
        ) {
          timeline.push(line);
        } else if (
          lower.includes("depend") ||
          lower.includes("blocked by") ||
          lower.includes("requires")
        ) {
          deps.push(line);
        } else {
          tasks.push(line);
        }
      }

      body += "GOALS\n";
      body +=
        goals.length > 0
          ? goals.map((l) => `  - ${l}`).join("\n")
          : "  - No goals identified";
      body += "\n\nTASKS\n";
      body +=
        tasks.length > 0
          ? tasks.map((l) => `  - ${l}`).join("\n")
          : "  - No tasks identified";
      body += "\n\nTIMELINE\n";
      body +=
        timeline.length > 0
          ? timeline.map((l) => `  - ${l}`).join("\n")
          : "  - No timeline items identified";
      body += "\n\nDEPENDENCIES\n";
      body +=
        deps.length > 0
          ? deps.map((l) => `  - ${l}`).join("\n")
          : "  - None identified";
      break;
    }

    case "retrospective": {
      const wentWell: string[] = [];
      const toImprove: string[] = [];

      for (const line of parsed.discussions) {
        const lower = line.toLowerCase();
        if (
          lower.includes("good") ||
          lower.includes("well") ||
          lower.includes("great") ||
          lower.includes("positive") ||
          lower.includes("liked")
        ) {
          wentWell.push(line);
        } else {
          toImprove.push(line);
        }
      }

      body += "WHAT WENT WELL\n";
      body +=
        wentWell.length > 0
          ? wentWell.map((l) => `  - ${l}`).join("\n")
          : "  - No items identified";
      body += "\n\nWHAT TO IMPROVE\n";
      body +=
        toImprove.length > 0
          ? toImprove.map((l) => `  - ${l}`).join("\n")
          : "  - No items identified";
      break;
    }

    default: {
      body += "SUMMARY\n";
      body += `  ${parsed.discussions.slice(0, 3).join(". ") || "No discussion points captured."}\n`;
      body += "\nKEY DISCUSSION POINTS\n";
      body +=
        parsed.discussions.length > 0
          ? parsed.discussions.map((l) => `  - ${l}`).join("\n")
          : "  - No discussion points identified";
      break;
    }
  }

  if (parsed.decisions.length > 0) {
    body += "\n\nDECISIONS\n";
    body += parsed.decisions.map((l) => `  - ${l}`).join("\n");
  }

  body += "\n\nACTION ITEMS\n";
  if (parsed.actionItems.length > 0) {
    body += parsed.actionItems
      .map((l) => {
        const owner = extractOwner(l);
        return owner ? `  - [${owner}] ${l}` : `  - ${l}`;
      })
      .join("\n");
  } else {
    body += "  - No action items identified";
  }

  body += "\n\nNEXT STEPS\n";
  body +=
    parsed.actionItems.length > 0
      ? "  - Follow up on the action items listed above"
      : "  - No next steps identified";

  return header + body;
}

function formatActionItemsOnly(parsed: ParsedNotes): string {
  if (parsed.actionItems.length === 0) {
    return "No action items were identified in the meeting notes.\n\nTip: Use keywords like TODO, @name, \"will\", \"need to\", or \"action:\" to help the parser detect action items.";
  }

  let output = "ACTION ITEMS\n" + "=".repeat(40) + "\n\n";

  parsed.actionItems.forEach((item, i) => {
    const owner = extractOwner(item);
    output += `${i + 1}. ${item}\n`;
    if (owner) {
      output += `   Owner: ${owner}\n`;
    }
    output += `   Status: [ ] Pending\n\n`;
  });

  return output;
}

function formatEmailRecap(
  parsed: ParsedNotes,
  title: string,
  date: string,
  attendees: string
): string {
  const subject = title || "Meeting Recap";
  const dateStr = date || new Date().toLocaleDateString();

  let email = `Subject: ${subject} - ${dateStr}\n\n`;
  email += `Hi team,\n\n`;
  email += `Here is a summary of our meeting${title ? ` "${title}"` : ""} on ${dateStr}.\n`;

  if (attendees) {
    email += `Attendees: ${attendees}\n`;
  }

  email += "\n";

  if (parsed.discussions.length > 0) {
    email += "Key Points Discussed:\n";
    parsed.discussions.slice(0, 8).forEach((item) => {
      email += `  - ${item}\n`;
    });
    email += "\n";
  }

  if (parsed.decisions.length > 0) {
    email += "Decisions Made:\n";
    parsed.decisions.forEach((item) => {
      email += `  - ${item}\n`;
    });
    email += "\n";
  }

  if (parsed.actionItems.length > 0) {
    email += "Action Items:\n";
    parsed.actionItems.forEach((item) => {
      const owner = extractOwner(item);
      email += owner ? `  - [${owner}] ${item}\n` : `  - ${item}\n`;
    });
    email += "\n";
  }

  email += "Please let me know if I missed anything or if there are any corrections.\n\n";
  email += "Best regards";

  return email;
}

function formatMarkdown(
  parsed: ParsedNotes,
  meetingType: MeetingType,
  title: string,
  date: string,
  attendees: string
): string {
  let md = `# ${title || "Meeting Summary"}\n\n`;

  if (date) md += `**Date:** ${date}\n`;
  if (attendees) md += `**Attendees:** ${attendees}\n`;
  if (date || attendees) md += `**Type:** ${meetingType.charAt(0).toUpperCase() + meetingType.slice(1)}\n\n---\n\n`;

  if (meetingType === "standup") {
    const done: string[] = [];
    const planned: string[] = [];
    const blockers: string[] = [];

    for (const line of parsed.discussions) {
      const lower = line.toLowerCase();
      if (lower.includes("blocker") || lower.includes("blocked") || lower.includes("stuck")) {
        blockers.push(line);
      } else if (lower.includes("yesterday") || lower.includes("completed") || lower.includes("finished") || lower.includes("done")) {
        done.push(line);
      } else {
        planned.push(line);
      }
    }

    md += "## What Was Done\n\n";
    md += done.length > 0 ? done.map((l) => `- ${l}`).join("\n") : "- No items identified";
    md += "\n\n## What's Planned\n\n";
    md += planned.length > 0 ? planned.map((l) => `- ${l}`).join("\n") : "- No items identified";
    md += "\n\n## Blockers\n\n";
    md += blockers.length > 0 ? blockers.map((l) => `- ${l}`).join("\n") : "- None";
  } else if (meetingType === "retrospective") {
    const wentWell: string[] = [];
    const toImprove: string[] = [];

    for (const line of parsed.discussions) {
      const lower = line.toLowerCase();
      if (lower.includes("good") || lower.includes("well") || lower.includes("great") || lower.includes("positive") || lower.includes("liked")) {
        wentWell.push(line);
      } else {
        toImprove.push(line);
      }
    }

    md += "## What Went Well\n\n";
    md += wentWell.length > 0 ? wentWell.map((l) => `- ${l}`).join("\n") : "- No items identified";
    md += "\n\n## What To Improve\n\n";
    md += toImprove.length > 0 ? toImprove.map((l) => `- ${l}`).join("\n") : "- No items identified";
  } else if (meetingType === "planning") {
    const goals: string[] = [];
    const tasks: string[] = [];

    for (const line of parsed.discussions) {
      const lower = line.toLowerCase();
      if (lower.includes("goal") || lower.includes("objective") || lower.includes("target")) {
        goals.push(line);
      } else {
        tasks.push(line);
      }
    }

    md += "## Goals\n\n";
    md += goals.length > 0 ? goals.map((l) => `- ${l}`).join("\n") : "- No goals identified";
    md += "\n\n## Tasks\n\n";
    md += tasks.length > 0 ? tasks.map((l) => `- ${l}`).join("\n") : "- No tasks identified";
  } else {
    md += "## Discussion Points\n\n";
    md += parsed.discussions.length > 0 ? parsed.discussions.map((l) => `- ${l}`).join("\n") : "- No discussion points identified";
  }

  if (parsed.decisions.length > 0) {
    md += "\n\n## Decisions\n\n";
    md += parsed.decisions.map((l) => `- ${l}`).join("\n");
  }

  md += "\n\n## Action Items\n\n";
  if (parsed.actionItems.length > 0) {
    md += parsed.actionItems
      .map((l) => {
        const owner = extractOwner(l);
        return owner ? `- [ ] **${owner}:** ${l}` : `- [ ] ${l}`;
      })
      .join("\n");
  } else {
    md += "- No action items identified";
  }

  return md;
}

function buildHeader(title: string, date: string, attendees: string): string {
  let header = "=".repeat(50) + "\n";
  header += `  ${title || "MEETING SUMMARY"}\n`;
  header += "=".repeat(50) + "\n";
  if (date) header += `Date: ${date}\n`;
  if (attendees) header += `Attendees: ${attendees}\n`;
  if (date || attendees) header += "-".repeat(50) + "\n";
  header += "\n";
  return header;
}

export default function AiMeetingSummaryTemplatePage() {
  const [rawNotes, setRawNotes] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [attendees, setAttendees] = useState("");
  const [meetingType, setMeetingType] = useState<MeetingType>("general");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("structured");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const generateSummary = useCallback(() => {
    if (!rawNotes.trim()) {
      setOutput("Please enter your meeting notes to generate a summary.");
      return;
    }

    const parsed = parseRawNotes(rawNotes);

    let result = "";

    switch (outputFormat) {
      case "structured":
        result = formatStructured(
          parsed,
          meetingType,
          meetingTitle,
          meetingDate,
          attendees
        );
        break;
      case "action-items":
        result = formatActionItemsOnly(parsed);
        break;
      case "email":
        result = formatEmailRecap(parsed, meetingTitle, meetingDate, attendees);
        break;
      case "markdown":
        result = formatMarkdown(
          parsed,
          meetingType,
          meetingTitle,
          meetingDate,
          attendees
        );
        break;
    }

    setOutput(result);
  }, [rawNotes, meetingTitle, meetingDate, attendees, meetingType, outputFormat]);

  const copyToClipboard = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [output]);

  return (
    <>
      <title>
        Free AI Meeting Summary Generator - Structure Your Meeting Notes |
        DevTools
      </title>
      <meta
        name="description"
        content="Free AI meeting summary generator. Paste your raw meeting notes and instantly structure them into clean summaries with action items, decisions, and next steps. No sign-up required."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "ai-meeting-summary-template",
            name: "AI Meeting Summary Template",
            description:
              "Structure raw meeting notes into clean summaries with action items, decisions, and next steps",
            category: "text",
          }),
          generateBreadcrumbSchema({
            slug: "ai-meeting-summary-template",
            name: "AI Meeting Summary Template",
            description:
              "Structure raw meeting notes into clean summaries with action items, decisions, and next steps",
            category: "text",
          }),
          generateFAQSchema([
            {
              question:
                "Does this tool use AI or send my meeting notes to a server?",
              answer:
                "No. This tool runs entirely in your browser. Your meeting notes are never sent to any server or AI API. The structuring is done with client-side pattern matching to identify action items, decisions, and discussion points from your raw notes.",
            },
            {
              question:
                "How does the tool detect action items from meeting notes?",
              answer:
                'The parser looks for common action-item indicators in your notes, such as lines containing "TODO", "action:", "@username", "will", "need to", "should", or "assigned to". For best results, use these keywords when writing meeting notes.',
            },
            {
              question: "What meeting types are supported?",
              answer:
                "The tool supports six meeting types: standup (done/planned/blockers), planning (goals/tasks/timeline/dependencies), retrospective (went well/improve/actions), brainstorm, client meeting, and general. Each type structures the output differently to match the meeting format.",
            },
            {
              question: "Can I export the meeting summary?",
              answer:
                "Yes. You can copy the generated summary to your clipboard in four formats: structured summary, action items only, email recap, or markdown. The markdown format is especially useful for pasting into tools like Notion, Confluence, or GitHub.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="ai-meeting-summary-template" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              AI Meeting Summary Template
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Paste your raw meeting notes below and instantly structure them
              into a clean summary with action items, decisions, and next steps.
              Everything runs in your browser — nothing is sent to a server.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: inputs */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label
                  htmlFor="raw-notes"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Raw Meeting Notes
                </label>
                <textarea
                  id="raw-notes"
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  placeholder={`Paste your meeting notes here...\n\nExample:\nDiscussed the new dashboard design\n@Sarah will create the wireframes by Friday\nAgreed to use Tailwind for styling\nTODO: Set up the staging environment\nJohn mentioned a blocker with the API rate limits\nDecided to move the launch date to March 15`}
                  className="w-full h-64 bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                />
              </div>

              {/* Optional fields row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="meeting-title"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Meeting Title{" "}
                    <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="meeting-title"
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="e.g. Sprint Planning - Week 12"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="meeting-date"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Date <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="meeting-date"
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="attendees"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Attendees{" "}
                  <span className="text-slate-500">
                    (optional, comma-separated)
                  </span>
                </label>
                <input
                  id="attendees"
                  type="text"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  placeholder="e.g. Sarah, John, Alex, Maria"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Output area */}
              {output && (
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Generated Summary
                  </label>
                  <textarea
                    value={output}
                    readOnly
                    className="w-full h-80 bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-slate-200 font-mono resize-none focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-8 right-3 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>

            {/* Right column: settings */}
            <div className="space-y-6">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
                <h2 className="text-lg font-semibold text-white">Settings</h2>

                <div>
                  <label
                    htmlFor="meeting-type"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Meeting Type
                  </label>
                  <select
                    id="meeting-type"
                    value={meetingType}
                    onChange={(e) =>
                      setMeetingType(e.target.value as MeetingType)
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="standup">Standup</option>
                    <option value="planning">Planning</option>
                    <option value="retrospective">Retrospective</option>
                    <option value="brainstorm">Brainstorm</option>
                    <option value="client">Client Meeting</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="output-format"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Output Format
                  </label>
                  <select
                    id="output-format"
                    value={outputFormat}
                    onChange={(e) =>
                      setOutputFormat(e.target.value as OutputFormat)
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="structured">Structured Summary</option>
                    <option value="action-items">Action Items Only</option>
                    <option value="email">Email Recap</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </div>

                <button
                  onClick={generateSummary}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  Generate Summary
                </button>
              </div>

              {/* Tips section */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <h2 className="text-lg font-semibold text-white mb-3">
                  Meeting Notes Best Practices
                </h2>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex gap-2">
                    <span className="text-blue-400 shrink-0">1.</span>
                    <span>
                      Use <code className="text-slate-300">@name</code> to tag
                      action item owners (e.g. &ldquo;@Sarah will send the
                      report&rdquo;)
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 shrink-0">2.</span>
                    <span>
                      Prefix action items with{" "}
                      <code className="text-slate-300">TODO:</code> or{" "}
                      <code className="text-slate-300">Action:</code> for
                      reliable detection
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 shrink-0">3.</span>
                    <span>
                      Write decisions with keywords like &ldquo;decided&rdquo;,
                      &ldquo;agreed&rdquo;, or &ldquo;confirmed&rdquo;
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 shrink-0">4.</span>
                    <span>
                      One point per line works best for parsing accuracy
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 shrink-0">5.</span>
                    <span>
                      Choose the right meeting type to get a structure tailored
                      to your meeting format
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 shrink-0">6.</span>
                    <span>
                      Use the markdown format for pasting into Notion,
                      Confluence, or GitHub issues
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <AdUnit slot="BOTTOM_SLOT" format="auto" className="mb-6" />

          <RelatedTools currentSlug="ai-meeting-summary-template" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Does this tool use AI or send my meeting notes to a server?
                </h3>
                <p className="text-slate-400">
                  No. This tool runs entirely in your browser. Your meeting
                  notes are never sent to any server or AI API. The structuring
                  is done with client-side pattern matching to identify action
                  items, decisions, and discussion points from your raw notes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does the tool detect action items from meeting notes?
                </h3>
                <p className="text-slate-400">
                  The parser looks for common action-item indicators in your
                  notes, such as lines containing &ldquo;TODO&rdquo;,
                  &ldquo;action:&rdquo;, &ldquo;@username&rdquo;,
                  &ldquo;will&rdquo;, &ldquo;need to&rdquo;,
                  &ldquo;should&rdquo;, or &ldquo;assigned to&rdquo;. For best
                  results, use these keywords when writing meeting notes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What meeting types are supported?
                </h3>
                <p className="text-slate-400">
                  The tool supports six meeting types: standup (done / planned /
                  blockers), planning (goals / tasks / timeline /
                  dependencies), retrospective (went well / improve / actions),
                  brainstorm, client meeting, and general. Each type structures
                  the output differently to match the meeting format.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I export the meeting summary?
                </h3>
                <p className="text-slate-400">
                  Yes. You can copy the generated summary to your clipboard in
                  four formats: structured summary, action items only, email
                  recap, or markdown. The markdown format is especially useful
                  for pasting into tools like Notion, Confluence, or GitHub.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
