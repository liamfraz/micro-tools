import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const TOOL_PROMPTS: Record<string, (input: Record<string, string>) => string> = {
  "color-palette": (input) =>
    `Generate a color palette of exactly 5 harmonious colors based on this description: "${input.description}".

Return ONLY valid JSON in this exact format, no other text:
{"colors":[{"name":"Color Name","hex":"#RRGGBB","rgb":"rgb(R, G, B)","tailwind":"bg-[#RRGGBB]"},{"name":"Color Name","hex":"#RRGGBB","rgb":"rgb(R, G, B)","tailwind":"bg-[#RRGGBB]"},{"name":"Color Name","hex":"#RRGGBB","rgb":"rgb(R, G, B)","tailwind":"bg-[#RRGGBB]"},{"name":"Color Name","hex":"#RRGGBB","rgb":"rgb(R, G, B)","tailwind":"bg-[#RRGGBB]"},{"name":"Color Name","hex":"#RRGGBB","rgb":"rgb(R, G, B)","tailwind":"bg-[#RRGGBB]"}]}

Give each color a creative, descriptive name. Ensure colors work well together for web design.`,

  "meta-description": (input) =>
    `Generate 3 SEO-optimized meta descriptions for a web page with this title/topic: "${input.title}".

Each meta description must be 150-160 characters, include a call to action, and naturally incorporate relevant keywords.

Return ONLY valid JSON in this exact format, no other text:
{"descriptions":[{"text":"meta description 1","charCount":155},{"text":"meta description 2","charCount":158},{"text":"meta description 3","charCount":152}]}`,

  "regex-generator": (input) =>
    `Generate a regular expression pattern that matches: "${input.description}".

Return ONLY valid JSON in this exact format, no other text:
{"pattern":"the regex pattern","flags":"g or gi or gm etc","explanation":"Step by step explanation of what each part of the regex does","examples":{"matches":["example1","example2","example3"],"nonMatches":["nonmatch1","nonmatch2"]}}`,

  "commit-message": (input) =>
    `Generate a conventional commit message for this git diff:

\`\`\`
${input.diff.slice(0, 3000)}
\`\`\`

Return ONLY valid JSON in this exact format, no other text:
{"type":"feat|fix|refactor|docs|style|test|chore","scope":"affected area","subject":"short imperative description","body":"optional longer description of what changed and why","full":"type(scope): subject\\n\\nbody"}`,

  "privacy-policy": (input) =>
    `Generate a basic privacy policy for a business with these details:
- Business name: "${input.businessName}"
- Business type: "${input.businessType}"
- Website URL: "${input.websiteUrl || "[website URL]"}"
- Email: "${input.contactEmail || "[contact email]"}"

The privacy policy should cover: information collection, use of information, cookies, third-party services, data security, children's privacy, changes to policy, and contact information.

Return ONLY valid JSON in this exact format, no other text:
{"title":"Privacy Policy","lastUpdated":"${new Date().toISOString().split("T")[0]}","sections":[{"heading":"Section Title","content":"Section content as a single string with proper paragraphs."}]}

Make it professional and comprehensive but readable. Include 8-10 sections.`,
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service is not configured. Please set ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { tool, input } = body as { tool: string; input: Record<string, string> };

    const promptFn = TOOL_PROMPTS[tool];
    if (!promptFn) {
      return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
    }

    const prompt = promptFn(input);

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = textBlock.text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);
    return NextResponse.json({ result: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("AI API error:", message);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
