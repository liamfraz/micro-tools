"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import QRCode from "qrcode";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

// ---- Types ----

type ECLevel = "L" | "M" | "Q" | "H";
type PresetType = "text" | "url" | "wifi" | "vcard" | "email" | "phone" | "sms";

interface WiFiData {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}

interface VCardData {
  name: string;
  phone: string;
  email: string;
  company: string;
  title: string;
  website: string;
}

interface EmailData {
  address: string;
  subject: string;
  body: string;
}

interface SMSData {
  number: string;
  message: string;
}

// ---- Helpers ----

function buildWiFiString(data: WiFiData): string {
  const escape = (s: string) => s.replace(/[\\;,":\t]/g, (c) => "\\" + c);
  let str = `WIFI:T:${data.encryption};S:${escape(data.ssid)};`;
  if (data.encryption !== "nopass" && data.password) {
    str += `P:${escape(data.password)};`;
  }
  if (data.hidden) str += "H:true;";
  str += ";";
  return str;
}

function buildVCardString(data: VCardData): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  if (data.name) lines.push(`FN:${data.name}`);
  if (data.phone) lines.push(`TEL:${data.phone}`);
  if (data.email) lines.push(`EMAIL:${data.email}`);
  if (data.company) lines.push(`ORG:${data.company}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.website) lines.push(`URL:${data.website}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

function buildEmailString(data: EmailData): string {
  let str = `mailto:${data.address}`;
  const params: string[] = [];
  if (data.subject) params.push(`subject=${encodeURIComponent(data.subject)}`);
  if (data.body) params.push(`body=${encodeURIComponent(data.body)}`);
  if (params.length) str += "?" + params.join("&");
  return str;
}

function buildSMSString(data: SMSData): string {
  let str = `sms:${data.number}`;
  if (data.message) str += `?body=${encodeURIComponent(data.message)}`;
  return str;
}

const EC_LABELS: Record<ECLevel, string> = {
  L: "Low (7%)",
  M: "Medium (15%)",
  Q: "Quartile (25%)",
  H: "High (30%)",
};

const PRESET_LABELS: Record<PresetType, string> = {
  text: "Plain Text",
  url: "URL",
  wifi: "Wi-Fi Network",
  vcard: "vCard Contact",
  email: "Email",
  phone: "Phone",
  sms: "SMS",
};

const SIZE_OPTIONS = [128, 192, 256, 384, 512, 768, 1024];

// ---- Component ----

export default function QrCodeGeneratorPage() {
  // Core state
  const [preset, setPreset] = useState<PresetType>("text");
  const [rawText, setRawText] = useState("");
  const [size, setSize] = useState(256);
  const [ecLevel, setEcLevel] = useState<ECLevel>("M");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [error, setError] = useState<string | null>(null);

  // Preset data
  const [urlValue, setUrlValue] = useState("https://");
  const [wifiData, setWifiData] = useState<WiFiData>({
    ssid: "",
    password: "",
    encryption: "WPA",
    hidden: false,
  });
  const [vcardData, setVcardData] = useState<VCardData>({
    name: "",
    phone: "",
    email: "",
    company: "",
    title: "",
    website: "",
  });
  const [emailData, setEmailData] = useState<EmailData>({
    address: "",
    subject: "",
    body: "",
  });
  const [phoneValue, setPhoneValue] = useState("");
  const [smsData, setSmsData] = useState<SMSData>({
    number: "",
    message: "",
  });

  // Bulk mode
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState<
    { text: string; dataUrl: string }[]
  >([]);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // Single QR output
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Derive the text to encode based on preset
  const getEncodedText = useCallback((): string => {
    switch (preset) {
      case "text":
        return rawText;
      case "url":
        return urlValue;
      case "wifi":
        return buildWiFiString(wifiData);
      case "vcard":
        return buildVCardString(vcardData);
      case "email":
        return buildEmailString(emailData);
      case "phone":
        return phoneValue ? `tel:${phoneValue}` : "";
      case "sms":
        return buildSMSString(smsData);
      default:
        return rawText;
    }
  }, [preset, rawText, urlValue, wifiData, vcardData, emailData, phoneValue, smsData]);

  // Generate QR code
  const generateQR = useCallback(async () => {
    const text = getEncodedText();
    if (!text.trim()) {
      setQrDataUrl(null);
      setQrSvg(null);
      setError(null);
      return;
    }

    try {
      const opts: QRCode.QRCodeToDataURLOptions = {
        errorCorrectionLevel: ecLevel,
        width: size,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
      };

      const dataUrl = await QRCode.toDataURL(text, opts);
      setQrDataUrl(dataUrl);

      const svgString = await QRCode.toString(text, {
        type: "svg",
        errorCorrectionLevel: ecLevel,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
      });
      setQrSvg(svgString);

      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate QR code");
      setQrDataUrl(null);
      setQrSvg(null);
    }
  }, [getEncodedText, ecLevel, size, fgColor, bgColor]);

  // Auto-generate on any setting change
  useEffect(() => {
    generateQR();
  }, [generateQR]);

  // Bulk generate
  const generateBulk = useCallback(async () => {
    const lines = bulkInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setBulkGenerating(true);
    const results: { text: string; dataUrl: string }[] = [];

    for (const line of lines.slice(0, 100)) {
      try {
        const dataUrl = await QRCode.toDataURL(line, {
          errorCorrectionLevel: ecLevel,
          width: size,
          margin: 2,
          color: { dark: fgColor, light: bgColor },
        });
        results.push({ text: line, dataUrl });
      } catch {
        results.push({ text: line, dataUrl: "" });
      }
    }

    setBulkResults(results);
    setBulkGenerating(false);
  }, [bulkInput, ecLevel, size, fgColor, bgColor]);

  // Downloads
  const downloadPNG = useCallback(() => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = qrDataUrl;
    link.click();
  }, [qrDataUrl]);

  const downloadSVG = useCallback(() => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = "qrcode.svg";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [qrSvg]);

  const downloadBulkZip = useCallback(async () => {
    if (bulkResults.length === 0) return;
    // Download each as individual PNGs via a simple approach
    for (let i = 0; i < bulkResults.length; i++) {
      const r = bulkResults[i];
      if (!r.dataUrl) continue;
      const link = document.createElement("a");
      link.download = `qrcode-${i + 1}.png`;
      link.href = r.dataUrl;
      link.click();
      // Small delay to avoid browser blocking multiple downloads
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }, [bulkResults]);

  const copyToClipboard = useCallback(async () => {
    if (!qrDataUrl) return;
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy to clipboard not supported in this browser");
    }
  }, [qrDataUrl]);

  const encodedText = getEncodedText();
  const byteLength = new TextEncoder().encode(encodedText).length;

  // Input classes
  const inputClass =
    "w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "text-sm font-medium text-slate-300 mb-1.5 block";

  return (
    <>
      <title>
        Free QR Code Generator | devtools.page
      </title>
      <meta
        name="description"
        content="Free QR code generator. Create QR codes for URLs, Wi-Fi networks, vCard contacts, email, phone, and SMS. Customize size, colors, and error correction. Download as PNG or SVG. Bulk generate up to 100 QR codes."
      />
      <meta
        name="keywords"
        content="qr code generator, free qr code generator, qr code maker, create qr code, qr code for wifi, qr code for vcard, qr code download png svg, bulk qr code generator, qr code online"
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "qr-code-generator",
            name: "QR Code Generator",
            description:
              "Free QR code generator for URLs, Wi-Fi, vCards, email, phone, and SMS. Download as PNG or SVG with custom colors and error correction.",
            category: "generator",
          }),
          generateBreadcrumbSchema({
            slug: "qr-code-generator",
            name: "QR Code Generator",
            description:
              "Free QR code generator for URLs, Wi-Fi, vCards, email, phone, and SMS. Download as PNG or SVG with custom colors and error correction.",
            category: "generator",
          }),
          generateFAQSchema([
            {
              question: "What is a QR code?",
              answer:
                "A QR (Quick Response) code is a two-dimensional barcode that can store text, URLs, contact information, Wi-Fi credentials, and other data. QR codes can be scanned by smartphone cameras and dedicated barcode readers to quickly access the encoded information.",
            },
            {
              question: "What types of data can I encode in a QR code?",
              answer:
                "You can encode website URLs, plain text, Wi-Fi network credentials (SSID, password, encryption type), vCard contact information (name, phone, email, company), email addresses with subject and body, phone numbers, and SMS messages. Each type uses a standard format recognized by QR code scanners.",
            },
            {
              question: "What do error correction levels (L, M, Q, H) mean?",
              answer:
                "Error correction allows a QR code to remain scannable even if partially damaged. Level L recovers 7% of data, M recovers 15%, Q recovers 25%, and H recovers 30%. Higher correction means a denser QR code but more resilience. Use M for most cases, H if the QR code may be printed small or partially obscured.",
            },
            {
              question:
                "What is the difference between PNG and SVG downloads?",
              answer:
                "PNG is a raster format with fixed pixel dimensions based on your size setting. SVG is a vector format that scales to any size without losing quality, making it ideal for print materials, business cards, and large format displays.",
            },
            {
              question: "Can I generate QR codes in bulk?",
              answer:
                "Yes. Switch to Bulk Mode and paste up to 100 URLs or text values (one per line). Click Generate All to create QR codes for each line, then download them individually or all at once.",
            },
            {
              question: "Is my data safe?",
              answer:
                "Yes. All QR codes are generated entirely in your browser using JavaScript. No data is sent to any server. Your text, URLs, Wi-Fi passwords, and contact information never leave your device.",
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="qr-code-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              QR Code Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Create QR codes for URLs, Wi-Fi networks, contacts, email, phone,
              and SMS. Customize size, colors, and error correction level.
              Download as PNG or SVG — everything runs in your browser.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setBulkMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !bulkMode
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Single QR
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                bulkMode
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Bulk Mode
            </button>
          </div>

          {!bulkMode ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Input Panel */}
              <div>
                {/* Preset selector */}
                <div className="mb-4">
                  <label className={labelClass}>QR Code Type</label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      Object.entries(PRESET_LABELS) as [PresetType, string][]
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setPreset(key)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          preset === key
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-slate-800 border-slate-600 text-slate-300 hover:border-blue-500 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset-specific forms */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
                  {preset === "text" && (
                    <div>
                      <label className={labelClass}>Text Content</label>
                      <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Enter any text to encode..."
                        className={`${inputClass} h-28 resize-none`}
                        spellCheck={false}
                      />
                    </div>
                  )}

                  {preset === "url" && (
                    <div>
                      <label className={labelClass}>Website URL</label>
                      <input
                        type="url"
                        value={urlValue}
                        onChange={(e) => setUrlValue(e.target.value)}
                        placeholder="https://example.com"
                        className={inputClass}
                      />
                    </div>
                  )}

                  {preset === "wifi" && (
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Network Name (SSID)</label>
                        <input
                          type="text"
                          value={wifiData.ssid}
                          onChange={(e) =>
                            setWifiData({ ...wifiData, ssid: e.target.value })
                          }
                          placeholder="MyWiFiNetwork"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Password</label>
                        <input
                          type="text"
                          value={wifiData.password}
                          onChange={(e) =>
                            setWifiData({
                              ...wifiData,
                              password: e.target.value,
                            })
                          }
                          placeholder="Enter password"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Encryption</label>
                        <select
                          value={wifiData.encryption}
                          onChange={(e) =>
                            setWifiData({
                              ...wifiData,
                              encryption: e.target.value as WiFiData["encryption"],
                            })
                          }
                          className={inputClass}
                        >
                          <option value="WPA">WPA/WPA2</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">None (Open)</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wifiData.hidden}
                          onChange={(e) =>
                            setWifiData({
                              ...wifiData,
                              hidden: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                        />
                        Hidden network
                      </label>
                    </div>
                  )}

                  {preset === "vcard" && (
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Full Name</label>
                        <input
                          type="text"
                          value={vcardData.name}
                          onChange={(e) =>
                            setVcardData({ ...vcardData, name: e.target.value })
                          }
                          placeholder="John Doe"
                          className={inputClass}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Phone</label>
                          <input
                            type="tel"
                            value={vcardData.phone}
                            onChange={(e) =>
                              setVcardData({
                                ...vcardData,
                                phone: e.target.value,
                              })
                            }
                            placeholder="+1234567890"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Email</label>
                          <input
                            type="email"
                            value={vcardData.email}
                            onChange={(e) =>
                              setVcardData({
                                ...vcardData,
                                email: e.target.value,
                              })
                            }
                            placeholder="john@example.com"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Company</label>
                          <input
                            type="text"
                            value={vcardData.company}
                            onChange={(e) =>
                              setVcardData({
                                ...vcardData,
                                company: e.target.value,
                              })
                            }
                            placeholder="Acme Inc."
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Title</label>
                          <input
                            type="text"
                            value={vcardData.title}
                            onChange={(e) =>
                              setVcardData({
                                ...vcardData,
                                title: e.target.value,
                              })
                            }
                            placeholder="Software Engineer"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Website</label>
                        <input
                          type="url"
                          value={vcardData.website}
                          onChange={(e) =>
                            setVcardData({
                              ...vcardData,
                              website: e.target.value,
                            })
                          }
                          placeholder="https://example.com"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {preset === "email" && (
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Email Address</label>
                        <input
                          type="email"
                          value={emailData.address}
                          onChange={(e) =>
                            setEmailData({
                              ...emailData,
                              address: e.target.value,
                            })
                          }
                          placeholder="hello@example.com"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Subject (optional)</label>
                        <input
                          type="text"
                          value={emailData.subject}
                          onChange={(e) =>
                            setEmailData({
                              ...emailData,
                              subject: e.target.value,
                            })
                          }
                          placeholder="Hello!"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Body (optional)</label>
                        <textarea
                          value={emailData.body}
                          onChange={(e) =>
                            setEmailData({
                              ...emailData,
                              body: e.target.value,
                            })
                          }
                          placeholder="Message body..."
                          className={`${inputClass} h-20 resize-none`}
                        />
                      </div>
                    </div>
                  )}

                  {preset === "phone" && (
                    <div>
                      <label className={labelClass}>Phone Number</label>
                      <input
                        type="tel"
                        value={phoneValue}
                        onChange={(e) => setPhoneValue(e.target.value)}
                        placeholder="+1234567890"
                        className={inputClass}
                      />
                    </div>
                  )}

                  {preset === "sms" && (
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Phone Number</label>
                        <input
                          type="tel"
                          value={smsData.number}
                          onChange={(e) =>
                            setSmsData({ ...smsData, number: e.target.value })
                          }
                          placeholder="+1234567890"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Message (optional)
                        </label>
                        <textarea
                          value={smsData.message}
                          onChange={(e) =>
                            setSmsData({ ...smsData, message: e.target.value })
                          }
                          placeholder="Your message..."
                          className={`${inputClass} h-20 resize-none`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Encoded output preview */}
                  {encodedText.trim() && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">
                        Encoded data ({byteLength} bytes):
                      </p>
                      <code className="text-xs text-slate-400 font-mono break-all block max-h-16 overflow-y-auto">
                        {encodedText}
                      </code>
                    </div>
                  )}
                </div>

                {/* Customization */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Customization
                  </h3>
                  <div className="space-y-4">
                    {/* Size */}
                    <div>
                      <label className={labelClass}>
                        Size: {size}px
                      </label>
                      <input
                        type="range"
                        min={128}
                        max={1024}
                        step={1}
                        value={size}
                        onChange={(e) => setSize(Number(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>128px</span>
                        <span>1024px</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {SIZE_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSize(s)}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              size === s
                                ? "bg-blue-600 border-blue-500 text-white"
                                : "bg-slate-900 border-slate-600 text-slate-400 hover:text-white"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Error correction */}
                    <div>
                      <label className={labelClass}>Error Correction</label>
                      <div className="flex gap-2">
                        {(["L", "M", "Q", "H"] as ECLevel[]).map((level) => (
                          <button
                            key={level}
                            onClick={() => setEcLevel(level)}
                            className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${
                              ecLevel === level
                                ? "bg-blue-600 border-blue-500 text-white"
                                : "bg-slate-900 border-slate-600 text-slate-400 hover:text-white"
                            }`}
                          >
                            <div className="font-bold">{level}</div>
                            <div className="text-[10px] opacity-70">
                              {EC_LABELS[level]}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Foreground</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={fgColor}
                            onChange={(e) => setFgColor(e.target.value)}
                            className="w-10 h-10 rounded border border-slate-600 cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={fgColor}
                            onChange={(e) => setFgColor(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="w-10 h-10 rounded border border-slate-600 cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={downloadPNG}
                    disabled={!qrDataUrl}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Download PNG
                  </button>
                  <button
                    onClick={downloadSVG}
                    disabled={!qrSvg}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Download SVG
                  </button>
                  <button
                    onClick={copyToClipboard}
                    disabled={!qrDataUrl}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {copied ? "Copied!" : "Copy to Clipboard"}
                  </button>
                </div>
              </div>

              {/* Right: Preview Panel */}
              <div className="flex flex-col items-center">
                <label className="text-sm font-medium text-slate-300 mb-4 self-start">
                  Preview
                </label>
                <div className="bg-white rounded-xl p-6 shadow-lg inline-block">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Generated QR Code"
                      width={Math.min(size, 400)}
                      height={Math.min(size, 400)}
                      className="block"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center bg-slate-100 rounded-lg"
                      style={{
                        width: Math.min(size, 400),
                        height: Math.min(size, 400),
                      }}
                    >
                      <p className="text-slate-400 text-sm text-center px-8">
                        Enter content above to generate a QR code
                      </p>
                    </div>
                  )}
                </div>
                {qrDataUrl && encodedText.trim() && (
                  <p className="text-xs text-slate-500 mt-3">
                    {size}&times;{size}px &bull; EC Level {ecLevel} &bull;{" "}
                    {byteLength} bytes
                  </p>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>
          ) : (
            /* Bulk Mode */
            <div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">
                  Bulk QR Code Generator
                </h2>
                <p className="text-sm text-slate-400 mb-4">
                  Paste up to 100 URLs or text values, one per line. Each will
                  generate a separate QR code with your current customization
                  settings.
                </p>
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder={"https://example.com\nhttps://google.com\nhttps://github.com"}
                  className="w-full h-40 bg-slate-900 border border-slate-600 rounded-lg p-4 font-mono text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  spellCheck={false}
                />

                {/* Inline settings for bulk */}
                <div className="flex flex-wrap items-end gap-4 mb-4">
                  <div>
                    <label className={labelClass}>Size</label>
                    <select
                      value={size}
                      onChange={(e) => setSize(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {SIZE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}px
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Error Correction</label>
                    <select
                      value={ecLevel}
                      onChange={(e) => setEcLevel(e.target.value as ECLevel)}
                      className="bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {(["L", "M", "Q", "H"] as ECLevel[]).map((l) => (
                        <option key={l} value={l}>
                          {l} — {EC_LABELS[l]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={generateBulk}
                    disabled={
                      !bulkInput.trim() || bulkGenerating
                    }
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {bulkGenerating ? "Generating..." : "Generate All"}
                  </button>
                  {bulkResults.length > 0 && (
                    <button
                      onClick={downloadBulkZip}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Download All PNGs
                    </button>
                  )}
                </div>
              </div>

              {/* Bulk results */}
              {bulkResults.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Generated QR Codes ({bulkResults.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {bulkResults.map((result, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 rounded-lg p-3 flex flex-col items-center"
                      >
                        {result.dataUrl ? (
                          <img
                            src={result.dataUrl}
                            alt={`QR code for ${result.text}`}
                            className="w-full h-auto mb-2"
                            style={{ imageRendering: "pixelated" }}
                          />
                        ) : (
                          <div className="w-full aspect-square bg-red-900/30 rounded flex items-center justify-center mb-2">
                            <span className="text-xs text-red-400">Error</span>
                          </div>
                        )}
                        <p
                          className="text-xs text-slate-400 truncate w-full text-center"
                          title={result.text}
                        >
                          {result.text}
                        </p>
                        {result.dataUrl && (
                          <a
                            href={result.dataUrl}
                            download={`qrcode-${i + 1}.png`}
                            className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <RelatedTools currentSlug="qr-code-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What is a QR code?
                </h3>
                <p className="text-slate-400">
                  A QR (Quick Response) code is a two-dimensional barcode that
                  can store text, URLs, contact information, Wi-Fi credentials,
                  and other data. QR codes can be scanned by smartphone cameras
                  and dedicated barcode readers to quickly access the encoded
                  information.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What types of data can I encode?
                </h3>
                <p className="text-slate-400">
                  This tool supports seven QR code types: plain text, website
                  URLs, Wi-Fi network credentials (with SSID, password, and
                  encryption type), vCard contacts (name, phone, email, company,
                  title, website), email with subject and body, phone numbers,
                  and SMS messages. Each type generates the correct standardized
                  format recognized by all QR scanners.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What do error correction levels mean?
                </h3>
                <p className="text-slate-400">
                  Error correction allows a QR code to remain scannable even when
                  partially damaged or obscured. Level L recovers up to 7% of
                  data, M recovers 15%, Q recovers 25%, and H recovers 30%.
                  Higher correction creates a denser code but increases
                  reliability. Use M for most digital uses, Q or H for print
                  materials that may get worn.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What&apos;s the difference between PNG and SVG downloads?
                </h3>
                <p className="text-slate-400">
                  PNG is a raster format with a fixed pixel resolution based on
                  your size setting (128px to 1024px). SVG is a vector format
                  that scales to any size without losing quality, making it ideal
                  for print materials, business cards, posters, and large format
                  displays.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I generate QR codes in bulk?
                </h3>
                <p className="text-slate-400">
                  Yes. Switch to Bulk Mode at the top of the page and paste up to
                  100 URLs or text values (one per line). Click Generate All to
                  create QR codes for every line with your current size and error
                  correction settings. You can download them individually or all
                  at once.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is my data safe?
                </h3>
                <p className="text-slate-400">
                  Yes. All QR codes are generated entirely in your browser using
                  JavaScript. No data is ever sent to any server. Your text,
                  URLs, Wi-Fi passwords, and contact information never leave your
                  device.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
