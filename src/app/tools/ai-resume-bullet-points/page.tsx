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

// --- Action verbs by seniority level ---

const ACTION_VERBS: Record<string, string[]> = {
  entry: [
    "Assisted", "Supported", "Contributed", "Coordinated", "Organized",
    "Prepared", "Maintained", "Processed", "Documented", "Compiled",
    "Facilitated", "Participated", "Researched", "Administered", "Executed",
  ],
  mid: [
    "Managed", "Developed", "Implemented", "Improved", "Designed",
    "Delivered", "Streamlined", "Led", "Launched", "Optimized",
    "Established", "Resolved", "Increased", "Reduced", "Automated",
  ],
  senior: [
    "Spearheaded", "Architected", "Directed", "Transformed", "Pioneered",
    "Orchestrated", "Drove", "Championed", "Oversaw", "Scaled",
    "Mentored", "Restructured", "Negotiated", "Elevated", "Consolidated",
  ],
  executive: [
    "Envisioned", "Governed", "Steered", "Forged", "Shaped",
    "Influenced", "Revolutionized", "Accelerated", "Cultivated", "Unified",
    "Defined", "Secured", "Instituted", "Repositioned", "Mobilized",
  ],
};

// --- Metric templates ---

const METRIC_TEMPLATES = [
  "resulting in a {pct}% improvement in {area}",
  "achieving a {pct}% increase in {area}",
  "reducing {area} by {pct}%",
  "saving approximately {hours} hours per {period}",
  "impacting {count}+ {stakeholders}",
  "across {count} {scope}",
  "contributing to ${amount}K in {outcome}",
  "within a {timeline} timeline",
  "supporting a team of {count} {members}",
  "serving {count}+ {audience}",
];

const METRIC_AREAS = [
  "efficiency", "productivity", "performance", "engagement", "retention",
  "conversion", "accuracy", "throughput", "satisfaction", "quality",
];

const STAKEHOLDERS = [
  "team members", "end users", "customers", "clients", "stakeholders",
  "departments", "cross-functional teams",
];

const SCOPES = [
  "departments", "product lines", "business units", "market segments",
  "projects", "regional offices", "service areas",
];

const OUTCOMES = [
  "revenue growth", "cost savings", "operational efficiency",
  "new business", "pipeline generation", "budget optimization",
];

// --- Industry-specific language ---

const INDUSTRY_LANGUAGE: Record<string, { terms: string[]; contexts: string[] }> = {
  tech: {
    terms: [
      "CI/CD pipeline", "microservices", "API integration", "cloud infrastructure",
      "agile sprints", "code review", "system architecture", "DevOps practices",
      "scalable solutions", "technical debt", "SLA compliance", "deployment automation",
    ],
    contexts: [
      "production environment", "development lifecycle", "tech stack",
      "software delivery", "platform reliability", "data pipeline",
    ],
  },
  marketing: {
    terms: [
      "brand awareness", "content strategy", "SEO optimization", "campaign performance",
      "audience segmentation", "marketing funnel", "lead generation", "social media",
      "A/B testing", "conversion rate", "email campaigns", "analytics dashboard",
    ],
    contexts: [
      "go-to-market strategy", "digital channels", "brand positioning",
      "customer journey", "market research", "creative execution",
    ],
  },
  finance: {
    terms: [
      "financial modeling", "risk assessment", "portfolio management", "regulatory compliance",
      "budget forecasting", "P&L analysis", "audit procedures", "revenue optimization",
      "financial reporting", "cost-benefit analysis", "due diligence", "capital allocation",
    ],
    contexts: [
      "fiscal year planning", "financial operations", "investment strategy",
      "compliance framework", "treasury management", "stakeholder reporting",
    ],
  },
  healthcare: {
    terms: [
      "patient outcomes", "clinical workflows", "HIPAA compliance", "electronic health records",
      "care coordination", "quality metrics", "treatment protocols", "patient satisfaction",
      "evidence-based practice", "population health", "clinical documentation", "care pathways",
    ],
    contexts: [
      "clinical setting", "patient care delivery", "healthcare operations",
      "interdisciplinary team", "regulatory environment", "quality improvement program",
    ],
  },
  general: {
    terms: [
      "process improvement", "stakeholder management", "project delivery", "team collaboration",
      "strategic planning", "operational efficiency", "quality assurance", "customer satisfaction",
      "performance metrics", "resource allocation", "continuous improvement", "best practices",
    ],
    contexts: [
      "organizational goals", "business operations", "cross-functional initiatives",
      "company objectives", "growth strategy", "operational excellence",
    ],
  },
};

// --- Bullet point structure templates ---

const BULLET_STRUCTURES = {
  achievement: (verb: string, what: string, metric: string) =>
    `${verb} ${what}, ${metric}`,
  skill: (verb: string, skill: string, context: string) =>
    `${verb} ${skill} within ${context}`,
  scope: (verb: string, initiative: string, scope: string, result: string) =>
    `${verb} ${initiative} ${scope}, ${result}`,
  method: (verb: string, outcome: string, method: string) =>
    `${verb} ${outcome} by ${method}`,
  collaboration: (verb: string, what: string, who: string, result: string) =>
    `${verb} ${what} in collaboration with ${who}, ${result}`,
};

// --- Utility helpers ---

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "shall", "should", "may", "might", "can", "could", "must", "that",
    "this", "these", "those", "it", "its", "as", "we", "our", "you",
    "your", "they", "their", "them", "not", "no", "all", "each", "every",
    "any", "such", "what", "which", "who", "whom", "how", "if", "when",
    "where", "than", "then", "so", "about", "up", "out", "into", "over",
    "after", "also", "other", "more", "very", "just", "own", "same",
    "well", "back", "both", "etc", "per", "via", "able", "across",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-\/\+#.]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // Count frequency
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  // Sort by frequency and return top keywords
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

function extractSkillPhrases(text: string): string[] {
  const phrases: string[] = [];

  // Match multi-word skill phrases (e.g., "project management", "data analysis")
  const multiWordPattern =
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  let match;
  while ((match = multiWordPattern.exec(text)) !== null) {
    phrases.push(match[1].toLowerCase());
  }

  // Match common tech/tool patterns
  const toolPatterns = [
    /\b(Python|Java|JavaScript|TypeScript|React|Angular|Vue|Node\.js|AWS|Azure|GCP|Docker|Kubernetes|SQL|NoSQL|MongoDB|PostgreSQL|Redis|Terraform|Jenkins|Git|Jira|Figma|Tableau|Power BI|Excel|Salesforce|HubSpot|SAP)\b/gi,
    /\b(\w+(?:\.js|\.io|\.ai))\b/gi,
  ];

  for (const pattern of toolPatterns) {
    while ((match = pattern.exec(text)) !== null) {
      phrases.push(match[1]);
    }
  }

  return Array.from(new Set(phrases)).slice(0, 10);
}

function generateMetric(): string {
  const template = pickRandom(METRIC_TEMPLATES);
  return template
    .replace("{pct}", String(randomInt(15, 60)))
    .replace("{hours}", String(randomInt(5, 40)))
    .replace("{period}", pickRandom(["week", "month", "sprint"]))
    .replace("{count}", String(randomInt(3, 50)))
    .replace("{stakeholders}", pickRandom(STAKEHOLDERS))
    .replace("{scope}", pickRandom(SCOPES))
    .replace("{amount}", String(randomInt(50, 500)))
    .replace("{outcome}", pickRandom(OUTCOMES))
    .replace("{timeline}", pickRandom(["3-month", "6-month", "quarterly", "tight"]))
    .replace("{members}", pickRandom(["engineers", "analysts", "specialists", "associates"]))
    .replace("{audience}", pickRandom(["users", "customers", "patients", "subscribers"]))
    .replace("{area}", pickRandom(METRIC_AREAS));
}

function generateBulletPoints(
  jobDescription: string,
  experience: string,
  industry: string,
  seniority: string,
): string[] {
  const keywords = extractKeywords(jobDescription);
  const skills = extractSkillPhrases(jobDescription);
  const experienceKeywords = experience ? extractKeywords(experience) : [];
  const experienceSkills = experience ? extractSkillPhrases(experience) : [];

  const allKeywords = Array.from(new Set([...keywords, ...experienceKeywords]));
  const allSkills = Array.from(new Set([...skills, ...experienceSkills]));

  const verbs = ACTION_VERBS[seniority] || ACTION_VERBS.mid;
  const lang = INDUSTRY_LANGUAGE[industry] || INDUSTRY_LANGUAGE.general;

  const bullets: string[] = [];
  const usedVerbs = new Set<string>();

  const getVerb = (): string => {
    const available = verbs.filter((v) => !usedVerbs.has(v));
    const chosen = available.length > 0 ? pickRandom(available) : pickRandom(verbs);
    usedVerbs.add(chosen);
    return chosen;
  };

  const keywordPhrase = (): string => {
    if (allKeywords.length > 0) {
      const selected = pickRandomN(allKeywords, randomInt(1, 3));
      return selected.join(", ");
    }
    return pickRandom(lang.terms);
  };

  // Structure 1: Achievement with metric (XYZ formula)
  const verb1 = getVerb();
  const term1 = allSkills.length > 0 ? pickRandom(allSkills) : pickRandom(lang.terms);
  bullets.push(
    BULLET_STRUCTURES.achievement(
      verb1,
      `${term1} initiatives aligned with ${pickRandom(lang.contexts)}`,
      generateMetric(),
    ),
  );

  // Structure 2: Skill-focused
  const verb2 = getVerb();
  const skillTerm = allKeywords.length > 1
    ? `${allKeywords[0]} and ${allKeywords[1]} capabilities`
    : `${pickRandom(lang.terms)} capabilities`;
  bullets.push(
    BULLET_STRUCTURES.skill(
      verb2,
      skillTerm,
      `${pickRandom(lang.contexts)} to meet organizational targets`,
    ),
  );

  // Structure 3: Scope-focused
  const verb3 = getVerb();
  bullets.push(
    BULLET_STRUCTURES.scope(
      verb3,
      `end-to-end ${pickRandom(lang.terms)} processes`,
      `across ${randomInt(2, 8)} ${pickRandom(SCOPES)}`,
      generateMetric(),
    ),
  );

  // Structure 4: Method-focused
  const verb4 = getVerb();
  const methodKeywords = keywordPhrase();
  bullets.push(
    BULLET_STRUCTURES.method(
      verb4,
      `measurable improvements in ${pickRandom(METRIC_AREAS)}`,
      `leveraging ${methodKeywords} and ${pickRandom(lang.terms)}`,
    ),
  );

  // Structure 5: Collaboration-focused
  const verb5 = getVerb();
  bullets.push(
    BULLET_STRUCTURES.collaboration(
      verb5,
      `key ${pickRandom(lang.terms)} deliverables`,
      `${pickRandom(STAKEHOLDERS)} and leadership`,
      generateMetric(),
    ),
  );

  // Structure 6: Impact statement
  const verb6 = getVerb();
  const impactSkill = allSkills.length > 1 ? pickRandom(allSkills) : pickRandom(lang.terms);
  bullets.push(
    `${verb6} ${impactSkill} strategy that directly contributed to ${generateMetric()}`,
  );

  // Structure 7: Technical/domain with keywords
  const verb7 = getVerb();
  const domainTerms = pickRandomN(lang.terms, 2);
  bullets.push(
    `${verb7} ${domainTerms[0]} and ${domainTerms[1]} frameworks, ${generateMetric()}`,
  );

  // Structure 8: Growth/development
  const verb8 = getVerb();
  bullets.push(
    `${verb8} comprehensive ${pickRandom(lang.contexts)} roadmap, incorporating ${keywordPhrase()} to drive ${pickRandom(METRIC_AREAS)} and ${pickRandom(METRIC_AREAS)}`,
  );

  return bullets;
}

export default function AIResumeBulletPointsPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [experience, setExperience] = useState("");
  const [industry, setIndustry] = useState("general");
  const [seniority, setSeniority] = useState("mid");
  const [bullets, setBullets] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!jobDescription.trim()) return;
    const result = generateBulletPoints(jobDescription, experience, industry, seniority);
    setBullets(result);
    setCopiedIndex(null);
    setCopiedAll(false);
  }, [jobDescription, experience, industry, seniority]);

  const copyBullet = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  }, []);

  const copyAll = useCallback(async () => {
    const text = bullets.map((b) => `• ${b}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  }, [bullets]);

  return (
    <>
      <title>Free AI Resume Bullet Point Generator - Tailored to Job Descriptions | DevTools</title>
      <meta
        name="description"
        content="Free AI resume bullet point generator. Paste a job description and get tailored, ATS-friendly resume bullet points using the XYZ formula. No sign-up required."
      />
      <meta
        name="keywords"
        content="free ai resume bullet point generator, resume bullet points, job description resume, XYZ formula resume, ATS-friendly resume, resume writer, resume builder"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "ai-resume-bullet-points",
            name: "AI Resume Bullet Point Generator",
            description:
              "Generate tailored resume bullet points from job descriptions using the XYZ formula. Free, client-side, no API calls.",
            category: "generator",
          }),
          generateBreadcrumbSchema({
            slug: "ai-resume-bullet-points",
            name: "AI Resume Bullet Point Generator",
            description:
              "Generate tailored resume bullet points from job descriptions using the XYZ formula. Free, client-side, no API calls.",
            category: "generator",
          }),
          generateFAQSchema([
            {
              question: "How does the AI resume bullet point generator work?",
              answer:
                "The tool analyzes keywords and skills from your job description, then generates tailored bullet points using the XYZ formula (Accomplished X as measured by Y by doing Z). It uses pattern matching and templates — no data is sent to any server.",
            },
            {
              question: "What is the XYZ resume bullet point formula?",
              answer:
                "The XYZ formula structures resume bullets as: Accomplished [X] as measured by [Y], by doing [Z]. This format clearly communicates your achievements with quantifiable results and specific methods, making your resume more impactful to hiring managers and ATS systems.",
            },
            {
              question: "Are the generated bullet points ATS-friendly?",
              answer:
                "Yes. The generator incorporates keywords directly from the job description into your bullet points, which helps your resume pass Applicant Tracking System (ATS) screening. It uses strong action verbs and industry-specific language that ATS parsers recognize.",
            },
            {
              question: "Is this resume tool really free and private?",
              answer:
                "Yes, completely free with no sign-up required. All processing happens locally in your browser — your job description and experience details are never sent to any external server or AI API.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="ai-resume-bullet-points" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              AI Resume Bullet Point Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Paste a job description and generate tailored, ATS-friendly resume bullet
              points using the XYZ formula. Choose your industry and seniority level
              for perfectly matched language.
            </p>
          </div>

          <AdUnit slot="TOP_SLOT" format="horizontal" className="mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Controls Column */}
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-slate-300">Input</h2>

              {/* Job Description */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Job Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={8}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              </div>

              {/* Experience / Skills */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Your Experience / Skills{" "}
                  <span className="text-slate-500">(optional)</span>
                </label>
                <textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Add your current skills, experience, or achievements to personalize results..."
                  rows={5}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="tech">Technology</option>
                  <option value="marketing">Marketing</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                </select>
              </div>

              {/* Seniority */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Seniority Level
                </label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!jobDescription.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Generate Bullet Points
              </button>
            </div>

            {/* Output Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Generated Bullet Points
                </label>
                {bullets.length > 0 && (
                  <button
                    onClick={copyAll}
                    className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600 transition-colors"
                  >
                    {copiedAll ? "Copied All!" : "Copy All"}
                  </button>
                )}
              </div>

              <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 min-h-[300px]">
                {bullets.length > 0 ? (
                  <ul className="space-y-3">
                    {bullets.map((bullet, i) => (
                      <li
                        key={i}
                        className="group flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        <span className="text-blue-400 mt-0.5 flex-shrink-0 text-sm font-medium">
                          {i + 1}.
                        </span>
                        <p className="text-sm text-slate-200 leading-relaxed flex-1">
                          {bullet}
                        </p>
                        <button
                          onClick={() => copyBullet(bullet, i)}
                          className="flex-shrink-0 px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded border border-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                          title="Copy bullet point"
                        >
                          {copiedIndex === i ? "Copied!" : "Copy"}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[260px]">
                    <div className="text-center">
                      <p className="text-slate-500 text-sm">
                        Paste a job description and click &quot;Generate Bullet Points&quot;
                      </p>
                      <p className="text-slate-600 text-xs mt-2">
                        The more detailed the job description, the better the results
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {bullets.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <button
                    onClick={handleGenerate}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => {
                      setBullets([]);
                      setCopiedIndex(null);
                      setCopiedAll(false);
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Resume Bullet Point Best Practices */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Resume Bullet Point Best Practices
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-blue-400 mb-2">
                  The XYZ Formula
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Structure bullets as: &quot;Accomplished <strong className="text-slate-300">[X]</strong> as
                  measured by <strong className="text-slate-300">[Y]</strong>, by
                  doing <strong className="text-slate-300">[Z]</strong>.&quot; This format ensures each bullet
                  communicates a clear achievement with measurable impact and specific method.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-400 mb-2">
                  Start with Strong Action Verbs
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Begin every bullet with a powerful action verb like &quot;Spearheaded,&quot;
                  &quot;Delivered,&quot; or &quot;Transformed.&quot; Avoid weak starts like &quot;Responsible
                  for&quot; or &quot;Helped with.&quot; Match verb strength to your seniority level.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-400 mb-2">
                  Quantify Everything
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Include numbers wherever possible: percentages, dollar amounts, team sizes,
                  timelines, or user counts. &quot;Increased sales by 35%&quot; is far more impactful
                  than &quot;Increased sales significantly.&quot;
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-400 mb-2">
                  Mirror the Job Description
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Incorporate keywords and phrases from the job posting directly into your
                  bullet points. This helps your resume pass ATS screening and shows
                  hiring managers you are a strong fit for the role.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-400 mb-2">
                  Keep It Concise
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Aim for 1-2 lines per bullet point. Remove filler words and focus on
                  impact. Recruiters spend an average of 6-7 seconds scanning a resume, so
                  every word must earn its place.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-400 mb-2">
                  Tailor for Each Application
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Never use the same resume for every job. Customize your bullet points
                  to highlight the experience most relevant to each specific position.
                  This tool makes it easy to generate fresh bullets for each application.
                </p>
              </div>
            </div>
          </div>

          <AdUnit slot="BOTTOM_SLOT" format="auto" className="mb-6" />

          <RelatedTools currentSlug="ai-resume-bullet-points" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does the AI resume bullet point generator work?
                </h3>
                <p className="text-slate-400">
                  The tool analyzes keywords, skills, and phrases from your job description
                  using pattern matching. It then generates tailored bullet points using the
                  XYZ formula with industry-appropriate language and seniority-matched action
                  verbs. All processing happens locally in your browser — no data is sent to
                  any external server or AI API.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is the XYZ resume bullet point formula?
                </h3>
                <p className="text-slate-400">
                  The XYZ formula structures resume bullets as: Accomplished [X] as measured
                  by [Y], by doing [Z]. This format clearly communicates your achievements
                  with quantifiable results and specific methods, making your resume more
                  impactful to hiring managers and ATS systems.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Are the generated bullet points ATS-friendly?
                </h3>
                <p className="text-slate-400">
                  Yes. The generator incorporates keywords directly from the job description
                  into your bullet points, which helps your resume pass Applicant Tracking
                  System (ATS) screening. It uses strong action verbs and industry-specific
                  language that ATS parsers recognize.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is this resume tool really free and private?
                </h3>
                <p className="text-slate-400">
                  Yes, completely free with no sign-up required. All processing happens
                  locally in your browser — your job description and experience details are
                  never sent to any external server or AI API. Your data stays on your device.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
