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

type ModelTarget = "chatgpt" | "claude" | "gemini";
type PromptStyle = "detailed" | "concise" | "creative" | "technical";
type Tone = "professional" | "casual" | "academic";

interface GeneratedPrompt {
  label: string;
  text: string;
}

const MODEL_LABELS: Record<ModelTarget, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
};

const STYLE_LABELS: Record<PromptStyle, string> = {
  detailed: "Detailed",
  concise: "Concise",
  creative: "Creative",
  technical: "Technical",
};

const TONE_LABELS: Record<Tone, string> = {
  professional: "Professional",
  casual: "Casual",
  academic: "Academic",
};

function getTonePhrase(tone: Tone): string {
  switch (tone) {
    case "professional":
      return "Maintain a professional and authoritative tone throughout.";
    case "casual":
      return "Use a friendly, conversational tone that is easy to follow.";
    case "academic":
      return "Use a formal, academic tone with precise language and proper citations where relevant.";
  }
}

function getModelPrefix(model: ModelTarget): string {
  switch (model) {
    case "chatgpt":
      return "You are an expert assistant with deep knowledge in this domain.";
    case "claude":
      return "I need your help with a task. Please think through this carefully and provide a thorough response.";
    case "gemini":
      return "Using your broad knowledge and reasoning capabilities, help me with the following task.";
  }
}

function getModelTip(model: ModelTarget): string {
  switch (model) {
    case "chatgpt":
      return 'Tip: ChatGPT responds well to system-style role assignments ("You are an expert...") and explicit output format instructions.';
    case "claude":
      return "Tip: Claude responds well to direct, clear instructions with context about why you need the output. It handles nuance and long-form tasks effectively.";
    case "gemini":
      return "Tip: Gemini excels with multimodal context and benefits from clearly structured requests with specific output expectations.";
  }
}

function generatePrompts(
  task: string,
  model: ModelTarget,
  style: PromptStyle,
  tone: Tone
): GeneratedPrompt[] {
  const trimmedTask = task.trim();
  if (!trimmedTask) return [];

  const tonePhrase = getTonePhrase(tone);
  const modelPrefix = getModelPrefix(model);
  const prompts: GeneratedPrompt[] = [];

  switch (style) {
    case "detailed": {
      prompts.push({
        label: "Structured Deep-Dive",
        text: `${modelPrefix}

Task: ${trimmedTask}

${tonePhrase}

Please approach this systematically:
1. Begin with a brief overview of the topic or problem
2. Break down the key components or steps involved
3. Provide detailed explanations for each component
4. Include relevant examples or illustrations where helpful
5. Summarize the key takeaways at the end

Format your response with clear headings and bullet points for readability. If there are multiple valid approaches, discuss the trade-offs of each.`,
      });

      prompts.push({
        label: "Context-Rich Analysis",
        text: `${modelPrefix}

I need a comprehensive analysis of the following:

${trimmedTask}

${tonePhrase}

Context & Requirements:
- Assume I have intermediate knowledge of this subject
- Focus on practical, actionable information
- Highlight any common pitfalls or misconceptions
- Where applicable, reference current best practices

Please structure your response as:
1. Background context (2-3 sentences)
2. Detailed analysis with supporting reasoning
3. Practical recommendations
4. Summary of key points`,
      });

      prompts.push({
        label: "Expert Consultation",
        text: `${modelPrefix}

I am working on the following and need expert-level guidance:

${trimmedTask}

${tonePhrase}

Please provide:
- A thorough explanation covering all important aspects
- Step-by-step instructions where applicable
- Potential challenges and how to address them
- Alternative approaches with pros and cons
- Any important caveats or considerations I should be aware of

Be specific and detailed rather than generic. If you need to make assumptions, state them clearly.`,
      });
      break;
    }

    case "concise": {
      prompts.push({
        label: "Direct Instruction",
        text: `${modelPrefix}

${trimmedTask}

${tonePhrase} Be concise and actionable. Focus on the most important points only. Use bullet points for clarity.`,
      });

      prompts.push({
        label: "Quick Answer Format",
        text: `${modelPrefix}

In 200 words or less, address the following:

${trimmedTask}

${tonePhrase} Skip preamble and get straight to the answer. Prioritize clarity over completeness.`,
      });

      prompts.push({
        label: "TL;DR Style",
        text: `${modelPrefix}

${trimmedTask}

${tonePhrase}

Provide your response in this format:
- One-sentence summary
- 3-5 key bullet points
- One recommended next step`,
      });
      break;
    }

    case "creative": {
      prompts.push({
        label: "Role-Play Expert",
        text: `${modelPrefix}

Imagine you are a world-renowned expert who has spent decades mastering every aspect of this field. A colleague has come to you with this challenge:

${trimmedTask}

${tonePhrase}

Draw on your vast experience to provide insights that go beyond the obvious. Share practical wisdom, creative solutions, and any counterintuitive approaches that most people overlook. Feel free to use analogies and storytelling to make complex ideas accessible.`,
      });

      prompts.push({
        label: "Brainstorm & Explore",
        text: `${modelPrefix}

Let's explore this from multiple creative angles:

${trimmedTask}

${tonePhrase}

Approach this as a brainstorming session:
- Start with the conventional wisdom, then challenge it
- Propose at least one unconventional or surprising approach
- Think about this from different perspectives (beginner, expert, outsider)
- Connect ideas from unrelated fields that might apply here
- End with your single best recommendation and why`,
      });

      prompts.push({
        label: "Teach Me Like a Story",
        text: `${modelPrefix}

I want to deeply understand the following topic, and I learn best through engaging explanations:

${trimmedTask}

${tonePhrase}

Make this compelling and memorable:
- Use vivid analogies and real-world metaphors
- Walk me through the reasoning, not just the conclusions
- Highlight the "aha moments" and surprising connections
- If relevant, frame it as a narrative with a beginning, middle, and end`,
      });
      break;
    }

    case "technical": {
      prompts.push({
        label: "Precision Technical",
        text: `${modelPrefix}

Technical Task: ${trimmedTask}

${tonePhrase}

Requirements for your response:
- Use precise, unambiguous language
- Include concrete examples with code snippets or specifications where applicable
- Define any domain-specific terminology on first use
- Address edge cases and boundary conditions
- Specify any assumptions, constraints, or prerequisites
- If providing code, include comments explaining non-obvious logic

Format: Use structured sections with clear headings. Prefer specificity over generality.`,
      });

      prompts.push({
        label: "Implementation Guide",
        text: `${modelPrefix}

I need a technical implementation guide for the following:

${trimmedTask}

${tonePhrase}

Please structure your response as:
1. Problem statement and scope definition
2. Prerequisites and dependencies
3. Step-by-step implementation with code/config examples
4. Testing and validation approach
5. Common failure modes and troubleshooting
6. Performance considerations and optimization notes

Be explicit about versions, configurations, and environment requirements. Do not skip steps that might seem obvious.`,
      });

      prompts.push({
        label: "Technical Review & Analysis",
        text: `${modelPrefix}

Provide a rigorous technical analysis of:

${trimmedTask}

${tonePhrase}

Your analysis should cover:
- Technical feasibility and constraints
- Architecture or design considerations
- Trade-offs between different approaches (present as a comparison table if helpful)
- Security, performance, and scalability implications
- Recommended approach with detailed justification
- References to relevant standards, documentation, or established patterns

Prioritize accuracy and depth. If something is uncertain, state your confidence level and reasoning.`,
      });
      break;
    }
  }

  return prompts;
}

export default function AIPromptGeneratorPage() {
  const [task, setTask] = useState("");
  const [model, setModel] = useState<ModelTarget>("chatgpt");
  const [style, setStyle] = useState<PromptStyle>("detailed");
  const [tone, setTone] = useState<Tone>("professional");
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = useCallback(() => {
    const results = generatePrompts(task, model, style, tone);
    setPrompts(results);
    setCopiedIndex(null);
  }, [task, model, style, tone]);

  const copyToClipboard = useCallback(async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  return (
    <>
      <title>
        Free AI Prompt Generator - Create Optimized Prompts for ChatGPT &
        Claude | DevTools
      </title>
      <meta
        name="description"
        content="Free AI prompt generator to create optimized prompts for ChatGPT, Claude, and Gemini. Choose from detailed, concise, creative, or technical styles with adjustable tone. No API calls required."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "ai-prompt-generator",
            name: "AI Prompt Generator",
            description:
              "Generate optimized AI prompts for ChatGPT, Claude, and Gemini with customizable style and tone",
            category: "generator",
          }),
          generateBreadcrumbSchema({
            slug: "ai-prompt-generator",
            name: "AI Prompt Generator",
            description:
              "Generate optimized AI prompts for ChatGPT, Claude, and Gemini with customizable style and tone",
            category: "generator",
          }),
          generateFAQSchema([
            {
              question: "How does the AI Prompt Generator work?",
              answer:
                "The AI Prompt Generator uses template-based patterns to transform your task description into well-structured prompts. It applies proven prompt engineering techniques like role assignment, structured output formatting, and context framing. No AI API calls are made — everything runs locally in your browser.",
            },
            {
              question:
                "What is the difference between the prompt styles?",
              answer:
                "Detailed style adds context-setting, step-by-step instructions, and output format requirements. Concise style creates direct, focused prompts for quick answers. Creative style incorporates role-playing elements and unconventional thinking approaches. Technical style emphasizes precision, code examples, edge case handling, and implementation specifics.",
            },
            {
              question:
                "Can I use the generated prompts with any AI model?",
              answer:
                "Yes. While the generator adds model-specific tips and framing optimized for ChatGPT, Claude, or Gemini, the generated prompts work well with any large language model. The model selection primarily adjusts the phrasing style to match each model's strengths.",
            },
            {
              question: "Is my data safe when using this tool?",
              answer:
                "Absolutely. All prompt generation happens entirely in your browser using JavaScript template logic. No data is sent to any server or API. Your task descriptions and generated prompts remain completely private.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="ai-prompt-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              AI Prompt Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate optimized prompts for ChatGPT, Claude, and Gemini.
              Describe your task, choose a style and tone, and get 3
              ready-to-use prompt variations — no AI API calls, everything
              runs in your browser.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Input Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Task Description
                </label>
                <span className="text-xs text-slate-500">
                  {task.length} character{task.length !== 1 ? "s" : ""}
                </span>
              </div>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Describe what you want the AI to help you with, e.g. 'Write a Python function to parse CSV files and handle common edge cases like missing values and quoted commas'"
                className="w-full h-40 bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Options Column */}
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-slate-300">Options</h2>

              {/* Model Target */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Target AI Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value as ModelTarget)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(
                    Object.entries(MODEL_LABELS) as [ModelTarget, string][]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prompt Style */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Prompt Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as PromptStyle)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(
                    Object.entries(STYLE_LABELS) as [PromptStyle, string][]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tone */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(Object.entries(TONE_LABELS) as [Tone, string][]).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Model Tip */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-400">{getModelTip(model)}</p>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={handleGenerate}
              disabled={!task.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate Prompts
            </button>
            <button
              onClick={() => {
                setTask("");
                setPrompts([]);
                setCopiedIndex(null);
              }}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() =>
                setTask(
                  "Explain the differences between REST and GraphQL APIs, including when to choose each approach for a new web application"
                )
              }
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Load example
            </button>
          </div>

          {/* Generated Prompts */}
          {prompts.length > 0 && (
            <div className="space-y-4 mb-6">
              <h2 className="text-lg font-semibold text-white">
                Generated Prompts ({prompts.length} variations)
              </h2>
              {prompts.map((prompt, index) => (
                <div
                  key={index}
                  className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {prompt.label}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(prompt.text, index)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded text-xs font-medium transition-colors"
                    >
                      {copiedIndex === index ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre className="p-4 text-sm text-slate-300 whitespace-pre-wrap break-words font-mono leading-relaxed max-h-80 overflow-y-auto">
                    {prompt.text}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {prompts.length === 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-6 text-center">
              <p className="text-slate-500">
                Describe your task above and click &ldquo;Generate
                Prompts&rdquo; to get optimized prompt variations.
              </p>
            </div>
          )}

          {/* Best Practices */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Prompt Engineering Best Practices
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Be specific",
                  tip: "Vague instructions produce vague results. Include details about format, length, audience, and purpose",
                },
                {
                  name: "Set the role",
                  tip: 'Assigning an expert role ("You are a senior developer...") helps the AI calibrate its response depth and vocabulary',
                },
                {
                  name: "Define output format",
                  tip: "Tell the AI exactly how you want the response structured: bullet points, numbered steps, JSON, markdown tables, etc.",
                },
                {
                  name: "Provide examples",
                  tip: "Showing one or two examples of desired output (few-shot prompting) dramatically improves response quality",
                },
                {
                  name: "Break complex tasks down",
                  tip: "For multi-step tasks, ask the AI to work through each step rather than jumping to a final answer",
                },
                {
                  name: "Specify constraints",
                  tip: "Mention what to avoid, length limits, required sections, and edge cases to handle. Constraints focus the output",
                },
              ].map((item) => (
                <div key={item.name}>
                  <h3 className="text-sm font-medium text-white mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400">{item.tip}</p>
                </div>
              ))}
            </div>
          </div>

          <AdUnit slot="BOTTOM_SLOT" format="auto" className="mb-6" />

          <RelatedTools currentSlug="ai-prompt-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does the AI Prompt Generator work?
                </h3>
                <p className="text-slate-400">
                  The AI Prompt Generator uses template-based patterns to
                  transform your task description into well-structured prompts.
                  It applies proven prompt engineering techniques like role
                  assignment, structured output formatting, and context framing.
                  No AI API calls are made — everything runs locally in your
                  browser.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the difference between the prompt styles?
                </h3>
                <p className="text-slate-400">
                  Detailed style adds context-setting, step-by-step
                  instructions, and output format requirements. Concise style
                  creates direct, focused prompts for quick answers. Creative
                  style incorporates role-playing elements and unconventional
                  thinking approaches. Technical style emphasizes precision, code
                  examples, edge case handling, and implementation specifics.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I use the generated prompts with any AI model?
                </h3>
                <p className="text-slate-400">
                  Yes. While the generator adds model-specific tips and framing
                  optimized for ChatGPT, Claude, or Gemini, the generated
                  prompts work well with any large language model. The model
                  selection primarily adjusts the phrasing style to match each
                  model&apos;s strengths.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe when using this tool?
                </h3>
                <p className="text-slate-400">
                  Absolutely. All prompt generation happens entirely in your
                  browser using JavaScript template logic. No data is sent to
                  any server or API. Your task descriptions and generated prompts
                  remain completely private.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
