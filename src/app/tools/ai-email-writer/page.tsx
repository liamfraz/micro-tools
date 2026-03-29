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

type EmailType =
  | "follow-up"
  | "introduction"
  | "request"
  | "thank-you"
  | "apology"
  | "announcement";

type Tone = "professional" | "friendly" | "formal" | "casual";
type Length = "short" | "medium" | "detailed";

interface EmailDraft {
  label: string;
  subject: string;
  body: string;
}

const EMAIL_TYPES: { value: EmailType; label: string }[] = [
  { value: "follow-up", label: "Follow-Up" },
  { value: "introduction", label: "Introduction" },
  { value: "request", label: "Request" },
  { value: "thank-you", label: "Thank You" },
  { value: "apology", label: "Apology" },
  { value: "announcement", label: "Announcement" },
];

const TONES: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
];

const LENGTHS: { value: Length; label: string; description: string }[] = [
  { value: "short", label: "Short", description: "1 paragraph, quick & concise" },
  { value: "medium", label: "Medium", description: "2-3 paragraphs, balanced" },
  { value: "detailed", label: "Detailed", description: "4+ paragraphs, comprehensive" },
];

function getGreeting(tone: Tone, recipient: string): string {
  const name = recipient.trim() || "there";
  switch (tone) {
    case "formal":
      return recipient.trim() ? `Dear ${recipient.trim()},` : "Dear Sir/Madam,";
    case "professional":
      return `Dear ${name},`;
    case "friendly":
      return `Hi ${name}!`;
    case "casual":
      return `Hey ${name},`;
  }
}

function getSignOff(tone: Tone): string {
  switch (tone) {
    case "formal":
      return "Yours sincerely,\n[Your Name]";
    case "professional":
      return "Best regards,\n[Your Name]";
    case "friendly":
      return "Thanks so much!\n[Your Name]";
    case "casual":
      return "Cheers,\n[Your Name]";
  }
}

function buildSubject(
  emailType: EmailType,
  context: string,
  variation: number
): string {
  const topic = context.length > 60 ? context.slice(0, 57) + "..." : context;
  const shortTopic =
    context.length > 40 ? context.slice(0, 37) + "..." : context;

  const subjects: Record<EmailType, string[]> = {
    "follow-up": [
      `Following Up: ${shortTopic}`,
      `Checking In RE: ${shortTopic}`,
    ],
    introduction: [
      `Introduction - ${shortTopic}`,
      `Connecting With You: ${shortTopic}`,
    ],
    request: [
      `Request: ${shortTopic}`,
      `Assistance Needed - ${shortTopic}`,
    ],
    "thank-you": [
      `Thank You - ${shortTopic}`,
      `Appreciation: ${shortTopic}`,
    ],
    apology: [
      `Apology Regarding ${shortTopic}`,
      `Sincere Apologies - ${shortTopic}`,
    ],
    announcement: [
      `Announcement: ${topic}`,
      `Important Update - ${shortTopic}`,
    ],
  };

  return subjects[emailType][variation] || subjects[emailType][0];
}

function buildBody(
  emailType: EmailType,
  tone: Tone,
  length: Length,
  context: string,
  variation: number
): string {
  const ctx = context.trim();

  // Transition phrases by tone
  const transitions: Record<Tone, string[]> = {
    formal: [
      "I am writing to",
      "I would like to bring to your attention",
      "Please be advised that",
      "It is worth noting that",
      "Furthermore,",
      "In addition to the above,",
    ],
    professional: [
      "I wanted to reach out regarding",
      "I'd like to discuss",
      "As a quick update,",
      "On a related note,",
      "Additionally,",
      "I also wanted to mention that",
    ],
    friendly: [
      "I wanted to touch base about",
      "Just a heads up about",
      "On another note,",
      "Also,",
      "By the way,",
      "I was also thinking about",
    ],
    casual: [
      "Quick note about",
      "So about",
      "Also,",
      "Oh, and",
      "BTW,",
      "One more thing -",
    ],
  };

  const t = transitions[tone];

  // Opening lines per email type and variation
  const openings: Record<EmailType, string[]> = {
    "follow-up": [
      `${t[0]} our previous conversation about ${ctx}. I wanted to check in and see if there have been any updates or if you need any additional information from my end.`,
      `I hope this message finds you well. I'm circling back regarding ${ctx}. I wanted to make sure this is still on your radar and see if there's anything I can do to help move things forward.`,
    ],
    introduction: [
      `${t[0]} ${ctx}. I believe there's a great opportunity for us to connect and explore how we might work together.`,
      `I'm reaching out because ${ctx}. I've been eager to introduce myself and share how I think we could collaborate effectively.`,
    ],
    request: [
      `${t[0]} ${ctx}. I would greatly appreciate your assistance with this matter, as your expertise would be invaluable.`,
      `I'm writing to ask for your help with ${ctx}. I understand you may be busy, but this is something that could really benefit from your input.`,
    ],
    "thank-you": [
      `I wanted to take a moment to express my sincere gratitude regarding ${ctx}. Your contribution made a real difference, and it did not go unnoticed.`,
      `Thank you so much for your help with ${ctx}. I truly appreciate the time and effort you put into this, and the results speak for themselves.`,
    ],
    apology: [
      `I want to sincerely apologize regarding ${ctx}. I understand the impact this may have had, and I take full responsibility for the situation.`,
      `I'm writing to express my regret about ${ctx}. This was not up to the standard I hold myself to, and I want to make things right.`,
    ],
    announcement: [
      `I'm excited to share some important news regarding ${ctx}. This is a development that I believe will have a positive impact on everyone involved.`,
      `${t[1]} ${ctx}. This is a significant update, and I wanted to make sure you were among the first to know about it.`,
    ],
  };

  // Middle paragraphs for medium/detailed
  const middles: Record<EmailType, string[][]> = {
    "follow-up": [
      [
        `${t[3]} since our last discussion, I've had some additional thoughts that I think could be valuable. I'd love the chance to walk you through them at your convenience.`,
        `${t[4]} I want to emphasize that I remain very committed to seeing this through. If there are any blockers or concerns on your end, please don't hesitate to share them so we can address them together.`,
        `To help facilitate the next steps, I've prepared some additional materials that I think you'll find useful. I can share these whenever works best for your schedule.`,
      ],
      [
        `Since we last spoke, I've been thinking more about the details and believe we have a solid path forward. I'd appreciate your feedback on the direction we discussed.`,
        `${t[5]} the timeline we outlined still seems achievable, but I want to confirm everything is aligned on your end. Any adjustments needed would be good to discuss sooner rather than later.`,
        `I'm confident that with a bit of coordination, we can wrap this up efficiently. Let me know what works best for a quick sync to align on next steps.`,
      ],
    ],
    introduction: [
      [
        `A bit about my background: I have extensive experience in areas directly relevant to ${ctx}. I've worked on similar initiatives and have seen firsthand what drives success in this space.`,
        `${t[4]} I've reviewed your work and am genuinely impressed. I see several areas where our combined strengths could create something truly remarkable.`,
        `I'd love to set up a brief call or meeting to explore potential collaboration. I'm flexible on timing and happy to work around your schedule.`,
      ],
      [
        `I've been following your work for some time and believe there's a natural synergy between what we're both trying to achieve. The overlap in our areas of focus is particularly interesting.`,
        `${t[5]} in my experience, the most impactful results come from bringing together complementary perspectives. I think that's exactly what we could achieve here.`,
        `Would you be open to a short introductory conversation? Even 15-20 minutes would be enough to explore whether there's a fit for collaboration.`,
      ],
    ],
    request: [
      [
        `To provide some context, ${ctx} is something I've been working on and have reached a point where external input would be extremely helpful. Your specific knowledge in this area is exactly what's needed.`,
        `${t[4]} I want to be respectful of your time, so I've done my best to prepare everything needed to make this as straightforward as possible for you.`,
        `If you're able to help, I'm happy to discuss the details further and work around whatever timeline suits you best. Even partial guidance would be greatly valued.`,
      ],
      [
        `Here's some additional background: I've been working through the details of ${ctx} and identified some specific areas where your perspective would help clarify the best path forward.`,
        `${t[5]} I've already explored several approaches, but I feel confident that your expertise could help identify the most effective solution. I don't want to move forward without considering your viewpoint.`,
        `Please let me know if this is something you'd be able to assist with. I'm also open to alternative suggestions if you think someone else might be better positioned to help.`,
      ],
    ],
    "thank-you": [
      [
        `${t[3]} your support with ${ctx} went above and beyond what was expected. The quality of your work and your willingness to go the extra mile truly stood out.`,
        `${t[4]} the positive outcomes we've seen are a direct result of your involvement. The entire team has noticed and appreciates the difference you've made.`,
        `I hope we have the opportunity to work together again in the future. Your professionalism and dedication are qualities that are rare and deeply valued.`,
      ],
      [
        `What impressed me most was how you approached ${ctx} with such thoroughness and attention to detail. It's clear you put genuine care into your work.`,
        `${t[5]} the impact of your contribution extends beyond just this project. You've set a standard that inspires everyone around you.`,
        `I look forward to finding more ways to collaborate and continue building on the great work we've accomplished together. Thank you again for everything.`,
      ],
    ],
    apology: [
      [
        `${t[3]} I understand that ${ctx} caused inconvenience and frustration. That was never my intention, and I want you to know that I've taken time to reflect on what went wrong.`,
        `${t[4]} I've already taken concrete steps to ensure this situation does not repeat itself. Specifically, I've reviewed the process and identified the root cause of the issue.`,
        `I value our relationship and want to rebuild any trust that may have been affected. Please let me know if there's anything else I can do to make this right.`,
      ],
      [
        `Upon reflection, I realize that the situation surrounding ${ctx} could have been handled much better. I should have communicated more clearly and acted more promptly.`,
        `${t[5]} I've put measures in place to prevent similar issues going forward. I'm committed to maintaining a higher standard and being more proactive in my communication.`,
        `Your patience and understanding mean a great deal to me. I hope we can move past this, and I'm dedicated to demonstrating through my actions that this was an isolated incident.`,
      ],
    ],
    announcement: [
      [
        `Here are the key details: ${ctx} represents a significant step forward. After careful planning and consideration, we're confident this is the right move at the right time.`,
        `${t[4]} this change has been designed with everyone's interests in mind. We've anticipated many of the questions you might have and have prepared resources to help with the transition.`,
        `We'll be hosting an information session soon to walk through the details and answer any questions. In the meantime, please don't hesitate to reach out directly if you need clarification.`,
      ],
      [
        `To give you some background, ${ctx} is the result of months of careful evaluation and planning. We wanted to make sure we got this right before making the announcement.`,
        `${t[5]} we expect this to bring meaningful improvements across the board. The feedback we've gathered during the planning phase has been overwhelmingly positive.`,
        `More details will follow in the coming days, but I wanted you to hear about this directly from me first. Your support and involvement as we move forward will be invaluable.`,
      ],
    ],
  };

  // Closing lines
  const closings: Record<EmailType, string[]> = {
    "follow-up": [
      "Please let me know if you have any questions or if there's a convenient time to connect. I look forward to hearing from you.",
      "I'd appreciate any updates you can share at your convenience. Looking forward to continuing our discussion.",
    ],
    introduction: [
      "I'd welcome the chance to connect at your convenience. Please let me know if you're open to a brief conversation.",
      "I hope to hear from you soon. I'm genuinely excited about the possibilities ahead.",
    ],
    request: [
      "Thank you in advance for considering my request. I truly appreciate your time and expertise.",
      "I'm grateful for any guidance you can offer. Please let me know how I can make this easier for you.",
    ],
    "thank-you": [
      "Once again, thank you for everything. Your efforts are truly appreciated.",
      "I can't thank you enough for your generosity and support. It has made a lasting impact.",
    ],
    apology: [
      "Thank you for your understanding. I'm committed to doing better moving forward.",
      "I appreciate your patience and am ready to take whatever steps are needed to resolve this fully.",
    ],
    announcement: [
      "We're excited about what's ahead and look forward to your involvement. Stay tuned for more details.",
      "Thank you for your continued support. Together, we'll make this transition a success.",
    ],
  };

  const v = variation;
  const opening = openings[emailType][v] || openings[emailType][0];
  const middle = middles[emailType][v] || middles[emailType][0];
  const closing = closings[emailType][v] || closings[emailType][0];

  if (length === "short") {
    return `${opening}\n\n${closing}`;
  }

  if (length === "medium") {
    return `${opening}\n\n${middle[0]}\n\n${closing}`;
  }

  // detailed
  return `${opening}\n\n${middle[0]}\n\n${middle[1]}\n\n${middle[2]}\n\n${closing}`;
}

function generateEmailDrafts(
  emailType: EmailType,
  tone: Tone,
  length: Length,
  context: string,
  recipient: string
): EmailDraft[] {
  if (!context.trim()) return [];

  return [0, 1].map((variation) => {
    const greeting = getGreeting(tone, recipient);
    const subject = buildSubject(emailType, context, variation);
    const body = buildBody(emailType, tone, length, context, variation);
    const signOff = getSignOff(tone);

    return {
      label: variation === 0 ? "Variation A" : "Variation B",
      subject,
      body: `${greeting}\n\n${body}\n\n${signOff}`,
    };
  });
}

export default function AIEmailWriter() {
  const [context, setContext] = useState("");
  const [recipient, setRecipient] = useState("");
  const [emailType, setEmailType] = useState<EmailType>("follow-up");
  const [tone, setTone] = useState<Tone>("professional");
  const [length, setLength] = useState<Length>("medium");
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    const results = generateEmailDrafts(emailType, tone, length, context, recipient);
    setDrafts(results);
    setActiveTab(0);
    setCopied(null);
  }, [emailType, tone, length, context, recipient]);

  const copyText = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard not available */
    }
  }, []);

  const activeDraft = drafts[activeTab] || null;

  return (
    <>
      <title>Free AI Email Writer - Generate Professional Emails Instantly | DevTools</title>
      <meta
        name="description"
        content="Free AI email writer and generator. Create professional follow-up, introduction, request, thank-you, apology, and announcement emails instantly. No sign-up required."
      />
      <meta
        name="keywords"
        content="free ai email writer generator, email generator, professional email writer, email template generator, business email writer, follow up email generator"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "ai-email-writer",
            name: "AI Email Writer",
            description:
              "Generate professional email drafts instantly. Choose email type, tone, and length to create polished follow-up, introduction, request, and thank-you emails.",
            category: "generator",
          }),
          generateBreadcrumbSchema({
            slug: "ai-email-writer",
            name: "AI Email Writer",
            description:
              "Generate professional email drafts instantly. Choose email type, tone, and length to create polished follow-up, introduction, request, and thank-you emails.",
            category: "generator",
          }),
          generateFAQSchema([
            {
              question: "How does this AI email writer work?",
              answer:
                "This tool uses intelligent templates to generate email drafts based on your input. You provide the context, select the email type, tone, and length, and the tool creates two professionally structured variations. Everything runs in your browser with no data sent to any server.",
            },
            {
              question: "What types of emails can I generate?",
              answer:
                "You can generate six types of emails: follow-up emails, introductions, requests, thank-you notes, apologies, and announcements. Each type uses purpose-specific language patterns and structure to create appropriate, professional drafts.",
            },
            {
              question: "Can I customize the tone and length of generated emails?",
              answer:
                "Yes. Choose from four tones (professional, friendly, formal, casual) and three lengths (short for a quick 1-paragraph email, medium for 2-3 paragraphs, or detailed for 4+ paragraphs). The tool adjusts greetings, sign-offs, and language formality based on your selections.",
            },
            {
              question: "Is this email writer free to use?",
              answer:
                "Yes, completely free with no sign-up, no limits, and no data collection. All email generation happens locally in your browser using templates. Your email content is never sent to any server or AI service.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="ai-email-writer" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              AI Email Writer
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate professional email drafts instantly. Describe what your
              email is about, choose the type, tone, and length, then get two
              polished variations ready to copy and send.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Controls Column */}
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-slate-300">
                Email Settings
              </h2>

              {/* Context */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  What is this email about? *
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., Following up on the project proposal we discussed last Tuesday..."
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
              </div>

              {/* Recipient Name */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Recipient Name (optional)
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g., Sarah, Mr. Johnson"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Email Type */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Email Type
                </label>
                <select
                  value={emailType}
                  onChange={(e) => setEmailType(e.target.value as EmailType)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {EMAIL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
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
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Length */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Length
                </label>
                <div className="space-y-1.5">
                  {LENGTHS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setLength(l.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                        length === l.value
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <span className="font-medium">{l.label}</span>
                      <span className="block text-xs mt-0.5 opacity-70">
                        {l.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!context.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Generate Email
              </button>
            </div>

            {/* Output Column */}
            <div className="lg:col-span-2">
              {/* Variation Tabs */}
              {drafts.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {drafts.map((draft, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveTab(idx);
                        setCopied(null);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        activeTab === idx
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {draft.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Subject Line */}
              {activeDraft && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-300">
                      Subject Line
                    </label>
                    <button
                      onClick={() =>
                        copyText(activeDraft.subject, "subject")
                      }
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {copied === "subject" ? "Copied!" : "Copy Subject"}
                    </button>
                  </div>
                  <div className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200">
                    {activeDraft.subject}
                  </div>
                </div>
              )}

              {/* Email Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Email Body
                  </label>
                  {activeDraft && (
                    <span className="text-xs text-slate-500">
                      {activeDraft.body.split(/\s+/).filter((w) => w.length > 0).length} words
                    </span>
                  )}
                </div>
                <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 min-h-[350px] max-h-[550px] overflow-y-auto">
                  {activeDraft ? (
                    <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {activeDraft.body}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic">
                      Describe what your email is about and click
                      &quot;Generate Email&quot; to create drafts...
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button
                  onClick={() => {
                    if (activeDraft) {
                      const full = `Subject: ${activeDraft.subject}\n\n${activeDraft.body}`;
                      copyText(full, "full");
                    }
                  }}
                  disabled={!activeDraft}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {copied === "full" ? "Copied!" : "Copy Full Email"}
                </button>
                <button
                  onClick={() => {
                    if (activeDraft) copyText(activeDraft.body, "body");
                  }}
                  disabled={!activeDraft}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {copied === "body" ? "Copied!" : "Copy Body Only"}
                </button>
                <button
                  onClick={() => {
                    setDrafts([]);
                    setCopied(null);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Email Writing Tips */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Email Writing Tips
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Clear Subject Lines",
                  tip: "Keep subject lines under 60 characters and front-load the most important words. Recipients decide whether to open based on the subject alone.",
                },
                {
                  name: "One Purpose Per Email",
                  tip: "Each email should have a single, clear purpose. If you have multiple topics, consider sending separate emails to improve response rates.",
                },
                {
                  name: "Front-Load Key Info",
                  tip: "Put your main point or request in the first paragraph. Many people only skim the beginning, especially on mobile devices.",
                },
                {
                  name: "Include a Clear CTA",
                  tip: "End with a specific call to action. Instead of 'let me know,' try 'Could you reply by Friday with your availability?'",
                },
                {
                  name: "Match Your Audience",
                  tip: "Adjust formality to your recipient. A casual tone works for close colleagues, while formal language suits executives or new contacts.",
                },
                {
                  name: "Proofread Before Sending",
                  tip: "Read your email aloud before sending. This catches awkward phrasing, missing words, and tone issues that silent reading often misses.",
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

          <RelatedTools currentSlug="ai-email-writer" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does this AI email writer work?
                </h3>
                <p className="text-slate-400">
                  This tool uses intelligent templates to generate email drafts
                  based on your input. You provide the context, select the email
                  type, tone, and length, and the tool creates two professionally
                  structured variations. Everything runs in your browser with no
                  data sent to any server.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What types of emails can I generate?
                </h3>
                <p className="text-slate-400">
                  You can generate six types of emails: follow-up emails,
                  introductions, requests, thank-you notes, apologies, and
                  announcements. Each type uses purpose-specific language patterns
                  and structure to create appropriate, professional drafts.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I customize the tone and length of generated emails?
                </h3>
                <p className="text-slate-400">
                  Yes. Choose from four tones (professional, friendly, formal,
                  casual) and three lengths (short for a quick 1-paragraph email,
                  medium for 2-3 paragraphs, or detailed for 4+ paragraphs). The
                  tool adjusts greetings, sign-offs, and language formality based
                  on your selections.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is this email writer free to use?
                </h3>
                <p className="text-slate-400">
                  Yes, completely free with no sign-up, no limits, and no data
                  collection. All email generation happens locally in your browser
                  using templates. Your email content is never sent to any server
                  or AI service.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
