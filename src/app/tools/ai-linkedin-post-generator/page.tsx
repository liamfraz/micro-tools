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

type PostType =
  | "thought-leadership"
  | "personal-story"
  | "industry-news"
  | "career-update"
  | "tips-advice"
  | "announcement";

type Tone = "professional" | "inspirational" | "conversational" | "bold" | "authentic";
type PostLength = "short" | "medium" | "long";

interface GeneratedPost {
  label: string;
  text: string;
}

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: "thought-leadership", label: "Thought Leadership" },
  { value: "personal-story", label: "Personal Story" },
  { value: "industry-news", label: "Industry News" },
  { value: "career-update", label: "Career Update" },
  { value: "tips-advice", label: "Tips & Advice" },
  { value: "announcement", label: "Announcement" },
];

const TONES: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "inspirational", label: "Inspirational" },
  { value: "conversational", label: "Conversational" },
  { value: "bold", label: "Bold" },
  { value: "authentic", label: "Authentic" },
];

const LENGTHS: { value: PostLength; label: string; description: string }[] = [
  { value: "short", label: "Short", description: "Under 200 words, punchy & scannable" },
  { value: "medium", label: "Medium", description: "200-400 words, balanced depth" },
  { value: "long", label: "Long", description: "400+ words, detailed & comprehensive" },
];

// --- Vocabulary maps per tone ---

const HOOKS: Record<Tone, string[]> = {
  professional: [
    "A pattern I keep seeing across the industry:",
    "Something worth discussing:",
    "An observation from my recent work:",
    "Here is a perspective that might challenge assumptions:",
  ],
  inspirational: [
    "This changed everything for me:",
    "The moment that shifted my perspective:",
    "What nobody tells you about success:",
    "The truth that took me years to learn:",
  ],
  conversational: [
    "Can we talk about something?",
    "Okay, I have to share this.",
    "You know what I find interesting?",
    "Hot take incoming:",
  ],
  bold: [
    "Unpopular opinion:",
    "Most people get this wrong.",
    "Stop doing this immediately:",
    "The industry needs to hear this:",
  ],
  authentic: [
    "I want to be honest about something.",
    "Here is what I have learned the hard way:",
    "Sharing this because I wish someone had told me:",
    "Real talk for a moment:",
  ],
};

const TRANSITIONS: Record<Tone, string[]> = {
  professional: [
    "Here is what I have observed:",
    "The key takeaway is this:",
    "What makes this significant:",
    "Consider this perspective:",
  ],
  inspirational: [
    "And here is the beautiful part:",
    "What I realized was profound:",
    "The lesson was clear:",
    "This is what matters most:",
  ],
  conversational: [
    "Here is the thing though:",
    "And honestly?",
    "What really surprised me:",
    "The interesting part is:",
  ],
  bold: [
    "Let me be direct:",
    "The data speaks for itself:",
    "Here is the reality:",
    "No sugarcoating:",
  ],
  authentic: [
    "Looking back, I see it clearly now:",
    "The honest truth is:",
    "What I did not expect:",
    "Here is what I wish I knew:",
  ],
};

const CLOSINGS: Record<Tone, string[]> = {
  professional: [
    "I would love to hear how others are approaching this.",
    "Curious to hear your perspective on this.",
    "What patterns are you seeing in your work?",
    "How is your team navigating this?",
  ],
  inspirational: [
    "Remember: your journey is uniquely yours. Keep going.",
    "If this resonates, share it with someone who needs to hear it.",
    "The best time to start was yesterday. The next best time is now.",
    "You are closer than you think. Keep pushing.",
  ],
  conversational: [
    "Anyway, just wanted to share. What do you think?",
    "Am I the only one who thinks this? Drop your thoughts below.",
    "Would love to hear your take on this!",
    "Tell me I am not the only one seeing this.",
  ],
  bold: [
    "Agree or disagree? I want to hear it.",
    "Challenge my thinking. I dare you.",
    "The ones who act on this will win. The rest will wonder what happened.",
    "If this made you uncomfortable, good. That means it hit a nerve.",
  ],
  authentic: [
    "Thanks for reading this far. It means more than you know.",
    "I am still figuring it out, just like everyone else. And that is okay.",
    "If you are going through something similar, my DMs are open.",
    "Grateful for this community and the conversations we have here.",
  ],
};

const CTAS = [
  "What do you think?",
  "Drop your thoughts below.",
  "Agree or disagree?",
  "Share your experience in the comments.",
  "Tag someone who needs to see this.",
  "Repost if this resonated.",
  "Follow me for more insights like this.",
  "Save this for later.",
];

const EMOJIS_BY_TYPE: Record<PostType, string[]> = {
  "thought-leadership": ["💡", "🎯", "📌", "🔑", "🧠"],
  "personal-story": ["🙌", "💪", "🚀", "❤️", "🌟"],
  "industry-news": ["📰", "📊", "🔍", "⚡", "📈"],
  "career-update": ["🎉", "🚀", "✨", "🙏", "💼"],
  "tips-advice": ["✅", "💡", "📋", "🎯", "⚙️"],
  announcement: ["🎉", "📢", "🚀", "⭐", "🔥"],
};

// --- Utility helpers ---

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function extractTopicWords(topic: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "shall", "should", "may", "might", "can", "could", "must", "that",
    "this", "these", "those", "it", "its", "as", "we", "our", "you",
    "your", "they", "their", "them", "not", "no", "about", "how", "what",
    "which", "who", "when", "where", "why", "so", "if", "my", "me", "i",
    "am", "just", "also", "than", "then", "very", "too", "some", "any",
  ]);
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

function generateHashtags(topic: string): string[] {
  const words = extractTopicWords(topic);
  const tags: string[] = [];

  // Create compound hashtags from adjacent words
  for (let i = 0; i < words.length - 1 && tags.length < 3; i++) {
    const compound = words[i] + words[i + 1].charAt(0).toUpperCase() + words[i + 1].slice(1);
    if (compound.length <= 20) {
      tags.push(`#${compound}`);
    }
  }

  // Add single-word hashtags
  for (const word of words) {
    if (tags.length >= 5) break;
    const tag = `#${word}`;
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }

  // Always add a few generic professional hashtags
  const genericTags = ["#leadership", "#growth", "#innovation", "#careeradvice", "#linkedin", "#networking", "#productivity", "#mindset"];
  while (tags.length < 5) {
    const generic = pickRandom(genericTags);
    if (!tags.includes(generic)) {
      tags.push(generic);
    }
  }

  return tags.slice(0, 5);
}

// --- Post generation by type ---

function buildThoughtLeadership(
  topic: string,
  tone: Tone,
  length: PostLength,
  variation: number
): string {
  const hooks = HOOKS[tone];
  const transitions = TRANSITIONS[tone];
  const closings = CLOSINGS[tone];

  const hook = variation === 0 ? hooks[0] : hooks[1];
  const transition = variation === 0 ? transitions[0] : transitions[1];
  const closing = variation === 0 ? closings[0] : closings[1];

  const insight = variation === 0
    ? `After spending years working in and around ${topic}, I have noticed a consistent pattern that separates those who succeed from those who struggle.`
    : `The conversation around ${topic} is evolving rapidly, and most professionals are not keeping up with the shift.`;

  const bullets = variation === 0
    ? [
        `The fundamentals of ${topic} are being redefined by emerging trends`,
        "The gap between early adopters and the rest is widening every quarter",
        "Those who invest in understanding this now will have a significant advantage",
      ]
    : [
        `Traditional approaches to ${topic} are becoming less effective`,
        "The market is rewarding adaptability over rigid expertise",
        "Collaboration across disciplines is now a necessity, not a nice-to-have",
      ];

  const reflection = variation === 0
    ? `${transition} The professionals who thrive are not the ones with the most experience. They are the ones who stay curious and adapt.`
    : `${transition} We are at an inflection point. The decisions we make now about ${topic} will define outcomes for years to come.`;

  if (length === "short") {
    return `${hook}\n\n${insight}\n\n${closing}`;
  }

  const bulletText = bullets.map((b) => `- ${b}`).join("\n");

  if (length === "medium") {
    return `${hook}\n\n${insight}\n\n${bulletText}\n\n${reflection}\n\n${closing}`;
  }

  const extra = variation === 0
    ? `I have seen this play out firsthand. Teams that embrace a learning mindset around ${topic} consistently outperform those that rely on what worked five years ago. The pace of change demands a new approach, and the organizations that recognize this are already pulling ahead.`
    : `What strikes me most is how many smart, talented people are still approaching ${topic} with an outdated playbook. It is not a matter of intelligence or effort. It is about being willing to question long-held assumptions and embrace new frameworks.`;

  return `${hook}\n\n${insight}\n\n${bulletText}\n\n${extra}\n\n${reflection}\n\n${closing}`;
}

function buildPersonalStory(
  topic: string,
  tone: Tone,
  length: PostLength,
  variation: number
): string {
  const hooks = HOOKS[tone];
  const closings = CLOSINGS[tone];

  const hook = variation === 0 ? hooks[2] : hooks[3];
  const closing = variation === 0 ? closings[2] : closings[3];

  const backstory = variation === 0
    ? `A few years ago, I was struggling with ${topic}. I had no roadmap, no mentor, and honestly, no idea where to start.`
    : `3 years ago, someone gave me advice about ${topic} that I ignored. It turned out to be the most expensive mistake of my career.`;

  const challenge = variation === 0
    ? `I tried everything the textbooks recommended. I followed the "proven" strategies. And yet nothing was working. I was ready to give up.`
    : `The challenge was not a lack of knowledge. It was a lack of perspective. I was so deep in the weeds that I could not see the bigger picture.`;

  const turningPoint = variation === 0
    ? `Then something shifted. I stopped trying to follow someone else's path and started building my own approach to ${topic}. I focused on what actually worked in my specific situation rather than what was supposed to work.`
    : `The turning point came when I finally asked for help. A conversation with a colleague completely reframed how I thought about ${topic}. Sometimes the breakthrough is not a strategy. It is a perspective shift.`;

  const lesson = variation === 0
    ? "The lesson? There is no universal playbook. Your path will look different from everyone else's, and that is not just okay, it is necessary."
    : `Looking back, the lesson is simple but powerful: the people who succeed with ${topic} are not the ones with the best plans. They are the ones willing to adapt when the plan falls apart.`;

  if (length === "short") {
    return `${hook}\n\n${backstory}\n\n${lesson}\n\n${closing}`;
  }

  if (length === "medium") {
    return `${hook}\n\n${backstory}\n\n${challenge}\n\n${turningPoint}\n\n${lesson}\n\n${closing}`;
  }

  const extra = variation === 0
    ? `Today, my relationship with ${topic} is completely different. I am still learning, still iterating, still making mistakes. But I approach it with a confidence that only comes from having failed and gotten back up. And I want to be clear: the failures were not obstacles on the way to success. They were the path itself.`
    : `Since that realization, I have applied this framework to every major challenge I have faced. Whether it is ${topic} or anything else, the principle holds: stay humble, stay curious, and never let pride keep you from changing course.`;

  return `${hook}\n\n${backstory}\n\n${challenge}\n\n${turningPoint}\n\n${extra}\n\n${lesson}\n\n${closing}`;
}

function buildIndustryNews(
  topic: string,
  tone: Tone,
  length: PostLength,
  variation: number
): string {
  const transitions = TRANSITIONS[tone];
  const closings = CLOSINGS[tone];

  const hook = variation === 0
    ? `Something big is happening in the world of ${topic}, and it is worth paying attention to.`
    : `The latest developments around ${topic} are going to reshape how we work. Here is why it matters.`;

  const context = variation === 0
    ? `The landscape is shifting faster than most people realize. What seemed like a niche trend six months ago is now becoming the standard.`
    : `We have been watching this space closely, and the signals are becoming impossible to ignore. This is not hype. This is a fundamental shift.`;

  const implications = variation === 0
    ? [
        `Professionals working in ${topic} will need to upskill quickly or risk falling behind`,
        "Companies that adapt early will capture disproportionate market share",
        "The traditional gatekeepers in this space are losing their influence",
      ]
    : [
        `The barrier to entry for ${topic} is dropping, which means more competition`,
        "New tools and frameworks are emerging that could make current approaches obsolete",
        "Cross-industry collaboration is becoming critical for staying competitive",
      ];

  const transition = variation === 0 ? transitions[2] : transitions[3];
  const closing = variation === 0 ? closings[0] : closings[1];

  const opinion = variation === 0
    ? `${transition} This is one of those moments where the early movers have a real advantage. The window will not stay open forever.`
    : `${transition} I believe this is going to be a defining moment for professionals in this space. How you respond in the next 6-12 months matters.`;

  if (length === "short") {
    return `${hook}\n\n${context}\n\n${closing}`;
  }

  const implicationText = implications.map((i) => `- ${i}`).join("\n");

  if (length === "medium") {
    return `${hook}\n\n${context}\n\n3 implications to consider:\n\n${implicationText}\n\n${opinion}\n\n${closing}`;
  }

  const deepDive = variation === 0
    ? `To put this in perspective, the rate of change we are seeing in ${topic} is unprecedented. Industry reports suggest adoption rates have doubled in just the past year. This is not a gradual evolution. It is a step change that demands attention from anyone in the space.`
    : `What makes this particularly interesting is the convergence of multiple factors. Technology, market demand, and regulatory shifts are all pointing in the same direction. When you see that kind of alignment, it usually means the change is not just coming. It is already here.`;

  return `${hook}\n\n${context}\n\n${deepDive}\n\n3 implications to consider:\n\n${implicationText}\n\n${opinion}\n\n${closing}`;
}

function buildCareerUpdate(
  topic: string,
  tone: Tone,
  length: PostLength,
  variation: number
): string {
  const closings = CLOSINGS[tone];
  const closing = variation === 0 ? closings[0] : closings[3];

  const announcement = variation === 0
    ? `I am thrilled to share some exciting news: ${topic}.`
    : `Big news: ${topic}. This has been a long time coming, and I could not be more excited.`;

  const backstory = variation === 0
    ? "This did not happen overnight. It is the result of years of learning, growing, and sometimes failing. Every challenge along the way taught me something valuable."
    : "The journey to get here has been anything but linear. There were moments of doubt, setbacks that felt insurmountable, and countless late nights. But every single one was worth it.";

  const gratitude = variation === 0
    ? "I want to thank everyone who supported me along the way. The mentors who challenged my thinking, the colleagues who believed in me, and the friends who kept me grounded."
    : "None of this would have been possible without an incredible support system. To my team, my mentors, and everyone who gave me a chance when I was still figuring things out: thank you.";

  const whatsNext = variation === 0
    ? `I am looking forward to the challenges and opportunities ahead. This is just the beginning, and I cannot wait to see where this chapter leads.`
    : `What comes next is even more exciting. I am ready to bring everything I have learned to this new chapter and create something meaningful.`;

  if (length === "short") {
    return `${announcement}\n\n${gratitude}\n\n${closing}`;
  }

  if (length === "medium") {
    return `${announcement}\n\n${backstory}\n\n${gratitude}\n\n${whatsNext}\n\n${closing}`;
  }

  const encouragement = variation === 0
    ? "If you are working toward something big right now, keep going. The path is never as straight as it looks in hindsight. Trust the process, invest in relationships, and never stop learning."
    : "To anyone reading this who is in the middle of their own journey: do not compare your timeline to anyone else's. Your path is valid. Your progress is real. And the best chapters are still ahead of you.";

  return `${announcement}\n\n${backstory}\n\n${gratitude}\n\n${whatsNext}\n\n${encouragement}\n\n${closing}`;
}

function buildTipsAdvice(
  topic: string,
  tone: Tone,
  length: PostLength,
  variation: number
): string {
  const closings = CLOSINGS[tone];
  const closing = variation === 0 ? closings[0] : closings[2];

  const intro = variation === 0
    ? `Here is what I have learned about ${topic}:`
    : `${topic} - lessons that took me years to figure out:`;

  const shortTips = variation === 0
    ? [
        "Start with the fundamentals before chasing advanced strategies",
        "Consistency beats intensity every single time",
        "Learn from people who have done it, not just those who teach it",
      ]
    : [
        "Focus on one thing at a time instead of spreading yourself thin",
        "Document your process so you can replicate what works",
        "Ask for feedback early and often, even when it is uncomfortable",
      ];

  const mediumTips = variation === 0
    ? [
        "Start with the fundamentals before chasing advanced strategies",
        "Consistency beats intensity every single time",
        "Learn from people who have done it, not just those who teach it",
        "Measure your progress weekly, not daily",
        "Invest time in building systems, not just completing tasks",
      ]
    : [
        "Focus on one thing at a time instead of spreading yourself thin",
        "Document your process so you can replicate what works",
        "Ask for feedback early and often, even when it is uncomfortable",
        "Build in public and share your journey transparently",
        "Set boundaries and protect your deep work time",
      ];

  const longTips = variation === 0
    ? [
        "Start with the fundamentals before chasing advanced strategies. The basics never go out of style",
        "Consistency beats intensity every single time. Small daily actions compound into massive results",
        "Learn from people who have done it, not just those who teach it. Experience is the best teacher",
        "Measure your progress weekly, not daily. Daily fluctuations will mislead you",
        "Invest time in building systems, not just completing tasks. Systems scale; individual effort does not",
        "Share what you learn publicly. Teaching is the fastest way to deepen your understanding",
        "Stay curious and question everything. The best ideas often come from unexpected places",
      ]
    : [
        "Focus on one thing at a time instead of spreading yourself thin. Depth beats breadth",
        "Document your process so you can replicate what works. Future you will thank present you",
        "Ask for feedback early and often, even when it is uncomfortable. Growth lives outside comfort zones",
        "Build in public and share your journey transparently. Authenticity attracts opportunities",
        "Set boundaries and protect your deep work time. Your best thinking requires uninterrupted focus",
        "Invest in relationships before you need them. Your network is your net worth",
        "Embrace failure as data, not defeat. Every setback contains a lesson if you look for it",
      ];

  const closingInsight = variation === 0
    ? `The biggest mistake people make with ${topic}? Overthinking and underacting. Start before you feel ready.`
    : `Remember: nobody figures out ${topic} perfectly on the first try. The goal is progress, not perfection.`;

  if (length === "short") {
    const tipText = shortTips.map((t, i) => `${i + 1}. ${t}`).join("\n");
    return `${intro}\n\n${tipText}\n\n${closing}`;
  }

  if (length === "medium") {
    const tipText = mediumTips.map((t, i) => `${i + 1}. ${t}`).join("\n");
    return `${intro}\n\n${tipText}\n\n${closingInsight}\n\n${closing}`;
  }

  const tipText = longTips.map((t, i) => `${i + 1}. ${t}`).join("\n");
  return `${intro}\n\n${tipText}\n\n${closingInsight}\n\n${closing}`;
}

function buildAnnouncement(
  topic: string,
  tone: Tone,
  length: PostLength,
  variation: number
): string {
  const closings = CLOSINGS[tone];
  const closing = variation === 0 ? closings[0] : closings[2];

  const hook = variation === 0
    ? `It is official: ${topic}.`
    : `I have been keeping this under wraps, but I can finally share: ${topic}.`;

  const details = variation === 0
    ? "This has been months in the making, and seeing it come to life is incredibly rewarding. Every detail was carefully considered to deliver real value."
    : "From the initial idea to today's announcement, this journey has been one of the most challenging and fulfilling experiences of my career.";

  const whyItMatters = variation === 0
    ? `Here is why this matters: the landscape is changing, and this is our response to that change. We are not just keeping up. We are setting the pace.`
    : `Why does this matter? Because the problems we are solving are real, the need is urgent, and the time is now. This is not just another announcement. It is a commitment.`;

  const gratitude = variation === 0
    ? "Thank you to everyone who made this possible. Your hard work, dedication, and belief in this vision brought us here."
    : "A huge thank you to the incredible team behind this. None of this happens without the talented people who pour their energy into making it real.";

  if (length === "short") {
    return `${hook}\n\n${details}\n\n${closing}`;
  }

  if (length === "medium") {
    return `${hook}\n\n${details}\n\n${whyItMatters}\n\n${gratitude}\n\n${closing}`;
  }

  const lookAhead = variation === 0
    ? "Looking ahead, this is just the beginning. We have big plans, and today's announcement is the foundation for everything that comes next. Stay tuned, because what is coming will be even more exciting."
    : "This milestone is not the finish line. It is the starting line for the next phase. We are already working on what comes next, and I cannot wait to share more in the weeks ahead.";

  return `${hook}\n\n${details}\n\n${whyItMatters}\n\n${lookAhead}\n\n${gratitude}\n\n${closing}`;
}

// --- Main generation function ---

function generateLinkedInPosts(
  topic: string,
  postType: PostType,
  tone: Tone,
  length: PostLength,
  includeHashtags: boolean,
  includeEmoji: boolean,
  includeCTA: boolean
): GeneratedPost[] {
  if (!topic.trim()) return [];

  const builders: Record<PostType, (t: string, tn: Tone, l: PostLength, v: number) => string> = {
    "thought-leadership": buildThoughtLeadership,
    "personal-story": buildPersonalStory,
    "industry-news": buildIndustryNews,
    "career-update": buildCareerUpdate,
    "tips-advice": buildTipsAdvice,
    announcement: buildAnnouncement,
  };

  const builder = builders[postType];
  const hashtags = generateHashtags(topic);
  const emojis = EMOJIS_BY_TYPE[postType];

  return [0, 1].map((variation) => {
    let text = builder(topic, tone, length, variation);

    if (includeEmoji) {
      const selectedEmojis = pickRandomN(emojis, 2);
      // Add an emoji after the first line
      const lines = text.split("\n");
      if (lines.length > 0) {
        lines[0] = `${selectedEmojis[0]} ${lines[0]}`;
      }
      // Add emoji before closing line
      const lastNonEmptyIdx = lines.length - 1;
      if (lastNonEmptyIdx > 0) {
        lines[lastNonEmptyIdx] = `${selectedEmojis[1]} ${lines[lastNonEmptyIdx]}`;
      }
      text = lines.join("\n");
    }

    if (includeCTA) {
      const cta = pickRandom(CTAS);
      text += `\n\n${cta}`;
    }

    if (includeHashtags) {
      text += `\n\n${hashtags.join(" ")}`;
    }

    return {
      label: variation === 0 ? "Variation A" : "Variation B",
      text,
    };
  });
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function estimateReadTime(words: number): string {
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

export default function AILinkedInPostGenerator() {
  const [topic, setTopic] = useState("");
  const [postType, setPostType] = useState<PostType>("thought-leadership");
  const [tone, setTone] = useState<Tone>("professional");
  const [length, setLength] = useState<PostLength>("medium");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmoji, setIncludeEmoji] = useState(false);
  const [includeCTA, setIncludeCTA] = useState(true);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    const results = generateLinkedInPosts(
      topic,
      postType,
      tone,
      length,
      includeHashtags,
      includeEmoji,
      includeCTA
    );
    setPosts(results);
    setActiveTab(0);
    setCopied(null);
  }, [topic, postType, tone, length, includeHashtags, includeEmoji, includeCTA]);

  const copyText = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard not available */
    }
  }, []);

  const activePost = posts[activeTab] || null;
  const activeWordCount = activePost ? countWords(activePost.text) : 0;
  const activeCharCount = activePost ? activePost.text.length : 0;

  return (
    <>
      <title>Free AI LinkedIn Post Generator - Create Engaging Posts | DevTools</title>
      <meta
        name="description"
        content="Free LinkedIn post generator. Create engaging thought leadership, career updates, and industry posts. Choose tone, length, and format. No signup required."
      />
      <meta
        name="keywords"
        content="linkedin post generator, free linkedin post writer, linkedin content generator, linkedin thought leadership, linkedin career update, linkedin engagement, social media post generator"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "ai-linkedin-post-generator",
            name: "AI LinkedIn Post Generator",
            description:
              "Generate engaging LinkedIn posts instantly. Choose post type, tone, and length to create thought leadership, career updates, personal stories, and more.",
            category: "generator",
          }),
          generateBreadcrumbSchema({
            slug: "ai-linkedin-post-generator",
            name: "AI LinkedIn Post Generator",
            description:
              "Generate engaging LinkedIn posts instantly. Choose post type, tone, and length to create thought leadership, career updates, personal stories, and more.",
            category: "generator",
          }),
          generateFAQSchema([
            {
              question: "How does this LinkedIn post generator work?",
              answer:
                "This tool uses intelligent templates and LinkedIn-specific patterns to generate post drafts based on your topic. You provide the context, select the post type, tone, and length, and the tool creates two engaging variations. Everything runs in your browser with no data sent to any server.",
            },
            {
              question: "What types of LinkedIn posts can I generate?",
              answer:
                "You can generate six types of posts: thought leadership, personal stories, industry news, career updates, tips and advice, and announcements. Each type uses proven LinkedIn engagement patterns and formatting optimized for the platform's algorithm.",
            },
            {
              question: "Will these posts get engagement on LinkedIn?",
              answer:
                "The generated posts follow LinkedIn best practices including strong hooks, line breaks for readability, optional hashtags, and calls-to-action. However, engagement also depends on your network size, posting time, and how you personalize the content. Use these as strong starting points and add your unique voice.",
            },
            {
              question: "Is this LinkedIn post generator free to use?",
              answer:
                "Yes, completely free with no sign-up, no limits, and no data collection. All post generation happens locally in your browser using templates. Your content is never sent to any server or AI service.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="ai-linkedin-post-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              AI LinkedIn Post Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Generate engaging LinkedIn posts instantly. Enter your topic,
              choose the post type, tone, and length, then get two polished
              variations ready to copy and publish.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Controls Column */}
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-slate-300">
                Post Settings
              </h2>

              {/* Topic */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  What is your post about? <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., The importance of continuous learning in tech, or: I just landed my dream job at Google..."
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
              </div>

              {/* Post Type */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Post Type
                </label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as PostType)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {POST_TYPES.map((t) => (
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

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-slate-400">Include Hashtags</span>
                  <button
                    type="button"
                    onClick={() => setIncludeHashtags(!includeHashtags)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      includeHashtags ? "bg-blue-600" : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        includeHashtags ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-slate-400">Include Emoji</span>
                  <button
                    type="button"
                    onClick={() => setIncludeEmoji(!includeEmoji)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      includeEmoji ? "bg-blue-600" : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        includeEmoji ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-slate-400">Include CTA</span>
                  <button
                    type="button"
                    onClick={() => setIncludeCTA(!includeCTA)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      includeCTA ? "bg-blue-600" : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        includeCTA ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!topic.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Generate Post
              </button>
            </div>

            {/* Output Column */}
            <div className="lg:col-span-2">
              {/* Variation Tabs */}
              {posts.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {posts.map((post, idx) => (
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
                      {post.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Stats Bar */}
              {activePost && (
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-xs text-slate-500">
                    {activeCharCount} characters
                  </span>
                  <span className="text-xs text-slate-500">
                    {activeWordCount} words
                  </span>
                  <span className="text-xs text-slate-500">
                    {estimateReadTime(activeWordCount)}
                  </span>
                </div>
              )}

              {/* Post Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    LinkedIn Post
                  </label>
                </div>
                <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 min-h-[350px] max-h-[550px] overflow-y-auto">
                  {activePost ? (
                    <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {activePost.text}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic">
                      Describe what your post is about and click
                      &quot;Generate Post&quot; to create drafts...
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button
                  onClick={() => {
                    if (activePost) {
                      copyText(activePost.text, "full");
                    }
                  }}
                  disabled={!activePost}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {copied === "full" ? "Copied!" : "Copy Post"}
                </button>
                <button
                  onClick={() => {
                    setPosts([]);
                    setCopied(null);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* LinkedIn Post Tips */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              LinkedIn Post Tips
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                {
                  name: "Hook in the First Line",
                  tip: "LinkedIn truncates posts after 2-3 lines. Your opening line must be compelling enough to make people click \"see more.\" Lead with a bold statement, question, or surprising insight.",
                },
                {
                  name: "Use Line Breaks Liberally",
                  tip: "LinkedIn's feed is dense. Short paragraphs with whitespace between them dramatically improve readability and keep people scrolling through your entire post.",
                },
                {
                  name: "Post at Peak Times",
                  tip: "Tuesday through Thursday between 8-10 AM tends to see the highest engagement. However, test different times with your specific audience to find your sweet spot.",
                },
                {
                  name: "End with a Question",
                  tip: "Posts that ask a genuine question in the closing get significantly more comments. Comments boost your post in the algorithm more than likes or reactions.",
                },
                {
                  name: "Be Authentic and Specific",
                  tip: "Generic advice gets scrolled past. Share specific numbers, personal experiences, and concrete examples. Vulnerability and specificity build trust and engagement.",
                },
                {
                  name: "Use Hashtags Strategically",
                  tip: "Use 3-5 relevant hashtags. Mix broad hashtags (#leadership) with niche ones (#devopscommunity). Too many hashtags look spammy and can reduce reach.",
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

          <RelatedTools currentSlug="ai-linkedin-post-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does this LinkedIn post generator work?
                </h3>
                <p className="text-slate-400">
                  This tool uses intelligent templates and LinkedIn-specific
                  patterns to generate post drafts based on your topic. You
                  provide the context, select the post type, tone, and length,
                  and the tool creates two engaging variations. Everything runs
                  in your browser with no data sent to any server.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What types of LinkedIn posts can I generate?
                </h3>
                <p className="text-slate-400">
                  You can generate six types of posts: thought leadership,
                  personal stories, industry news, career updates, tips and
                  advice, and announcements. Each type uses proven LinkedIn
                  engagement patterns and formatting optimized for the
                  platform&apos;s algorithm.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Will these posts get engagement on LinkedIn?
                </h3>
                <p className="text-slate-400">
                  The generated posts follow LinkedIn best practices including
                  strong hooks, line breaks for readability, optional hashtags,
                  and calls-to-action. However, engagement also depends on your
                  network size, posting time, and how you personalize the
                  content. Use these as strong starting points and add your
                  unique voice.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is this LinkedIn post generator free to use?
                </h3>
                <p className="text-slate-400">
                  Yes, completely free with no sign-up, no limits, and no data
                  collection. All post generation happens locally in your browser
                  using templates. Your content is never sent to any server or AI
                  service.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
