"use client";

import { useState, useCallback, useMemo } from "react";

interface Shadow {
  id: number;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
}

let nextId = 2;

const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
};

const PRESETS: { name: string; shadows: Omit<Shadow, "id">[] }[] = [
  {
    name: "Subtle",
    shadows: [{ x: 0, y: 1, blur: 3, spread: 0, color: "#000000", opacity: 10, inset: false }],
  },
  {
    name: "Medium",
    shadows: [{ x: 0, y: 4, blur: 6, spread: -1, color: "#000000", opacity: 15, inset: false }],
  },
  {
    name: "Large",
    shadows: [{ x: 0, y: 10, blur: 15, spread: -3, color: "#000000", opacity: 20, inset: false }],
  },
  {
    name: "XL",
    shadows: [{ x: 0, y: 20, blur: 25, spread: -5, color: "#000000", opacity: 25, inset: false }],
  },
  {
    name: "2XL",
    shadows: [{ x: 0, y: 25, blur: 50, spread: -12, color: "#000000", opacity: 30, inset: false }],
  },
  {
    name: "Layered",
    shadows: [
      { x: 0, y: 1, blur: 2, spread: 0, color: "#000000", opacity: 10, inset: false },
      { x: 0, y: 4, blur: 8, spread: 0, color: "#000000", opacity: 10, inset: false },
      { x: 0, y: 16, blur: 32, spread: 0, color: "#000000", opacity: 10, inset: false },
    ],
  },
  {
    name: "Sharp",
    shadows: [{ x: 4, y: 4, blur: 0, spread: 0, color: "#000000", opacity: 25, inset: false }],
  },
  {
    name: "Glow",
    shadows: [{ x: 0, y: 0, blur: 20, spread: 2, color: "#3b82f6", opacity: 60, inset: false }],
  },
  {
    name: "Neon Blue",
    shadows: [
      { x: 0, y: 0, blur: 10, spread: 0, color: "#3b82f6", opacity: 70, inset: false },
      { x: 0, y: 0, blur: 40, spread: 0, color: "#3b82f6", opacity: 40, inset: false },
    ],
  },
  {
    name: "Neon Purple",
    shadows: [
      { x: 0, y: 0, blur: 10, spread: 0, color: "#8b5cf6", opacity: 70, inset: false },
      { x: 0, y: 0, blur: 40, spread: 0, color: "#8b5cf6", opacity: 40, inset: false },
    ],
  },
  {
    name: "Inner Light",
    shadows: [{ x: 0, y: 2, blur: 8, spread: 0, color: "#ffffff", opacity: 15, inset: true }],
  },
  {
    name: "Embossed",
    shadows: [
      { x: 0, y: 2, blur: 4, spread: 0, color: "#ffffff", opacity: 10, inset: true },
      { x: 0, y: -2, blur: 4, spread: 0, color: "#000000", opacity: 20, inset: true },
    ],
  },
];

export default function BoxShadowGeneratorPage() {
  const [shadows, setShadows] = useState<Shadow[]>([
    { id: 1, x: 0, y: 4, blur: 6, spread: -1, color: "#000000", opacity: 15, inset: false },
  ]);
  const [boxColor, setBoxColor] = useState("#1e293b");
  const [bgColor, setBgColor] = useState("#0f172a");
  const [borderRadius, setBorderRadius] = useState(8);
  const [copied, setCopied] = useState(false);

  const shadowCSS = useMemo(() => {
    return shadows
      .map((s) => {
        const rgba = hexToRgba(s.color, s.opacity);
        return `${s.inset ? "inset " : ""}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${rgba}`;
      })
      .join(",\n    ");
  }, [shadows]);

  const fullCSS = useMemo(() => {
    return `box-shadow: ${shadowCSS};`;
  }, [shadowCSS]);

  const addShadow = useCallback(() => {
    if (shadows.length >= 6) return;
    setShadows((prev) => [
      ...prev,
      { id: nextId++, x: 0, y: 4, blur: 10, spread: 0, color: "#000000", opacity: 20, inset: false },
    ]);
  }, [shadows.length]);

  const removeShadow = useCallback((id: number) => {
    setShadows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const updateShadow = useCallback((id: number, field: keyof Omit<Shadow, "id">, value: number | string | boolean) => {
    setShadows((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }, []);

  const applyPreset = useCallback((preset: typeof PRESETS[number]) => {
    setShadows(preset.shadows.map((s) => ({ ...s, id: nextId++ })));
  }, []);

  const copyCSS = useCallback(async () => {
    await navigator.clipboard.writeText(fullCSS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullCSS]);

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <title>CSS Box Shadow Generator — Visual Editor | Micro Tools</title>
      <meta name="description" content="Create CSS box-shadow effects visually with multiple layers, color picker, blur, spread, and inset options. Copy the CSS code instantly." />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to all tools
          </a>
          <h1 className="text-3xl font-bold mb-2">CSS Box Shadow Generator</h1>
          <p className="text-slate-400">
            Create beautiful CSS box-shadow effects with a visual editor. Add multiple shadow layers, control blur, spread, offset, color, and opacity. Copy the CSS code to your project instantly.
          </p>
        </div>

        {/* Preview + Controls Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Live Preview */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-sm font-medium text-slate-400 mb-4">Live Preview</h2>
            <div
              className="rounded-lg flex items-center justify-center"
              style={{ backgroundColor: bgColor, height: "280px" }}
            >
              <div
                className="w-48 h-48 flex items-center justify-center text-sm text-slate-400"
                style={{
                  backgroundColor: boxColor,
                  borderRadius: `${borderRadius}px`,
                  boxShadow: shadows
                    .map((s) => `${s.inset ? "inset " : ""}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${hexToRgba(s.color, s.opacity)}`)
                    .join(", "),
                }}
              >
                Preview Box
              </div>
            </div>

            {/* Box & Background Colors */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Box Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={boxColor}
                    onChange={(e) => setBoxColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-600 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-300">{boxColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-600 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-300">{bgColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Radius: {borderRadius}px</label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 mt-1"
                />
              </div>
            </div>
          </div>

          {/* Shadow Layers */}
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-slate-400">
                Shadow Layers ({shadows.length}/6)
              </h2>
              <button
                onClick={addShadow}
                disabled={shadows.length >= 6}
                className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-3 py-1 rounded transition-colors"
              >
                + Add Layer
              </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {shadows.map((shadow, idx) => (
                <div key={shadow.id} className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-300">Layer {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shadow.inset}
                          onChange={(e) => updateShadow(shadow.id, "inset", e.target.checked)}
                          className="accent-blue-600 w-3.5 h-3.5"
                        />
                        <span className="text-xs text-slate-400">Inset</span>
                      </label>
                      <button
                        onClick={() => removeShadow(shadow.id)}
                        disabled={shadows.length <= 1}
                        className="text-slate-500 hover:text-red-400 disabled:opacity-30 transition-colors text-lg leading-none"
                        title="Remove layer"
                      >
                        &times;
                      </button>
                    </div>
                  </div>

                  {/* Color + Opacity */}
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="color"
                      value={shadow.color}
                      onChange={(e) => updateShadow(shadow.id, "color", e.target.value)}
                      className="w-8 h-8 rounded border border-slate-600 cursor-pointer bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-400">{shadow.color}</span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-xs text-slate-500">Opacity:</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={shadow.opacity}
                        onChange={(e) => updateShadow(shadow.id, "opacity", parseInt(e.target.value, 10))}
                        className="w-20 accent-blue-600"
                      />
                      <span className="text-xs text-slate-400 w-8 text-right">{shadow.opacity}%</span>
                    </div>
                  </div>

                  {/* X, Y, Blur, Spread sliders */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {([
                      { label: "X Offset", field: "x" as const, min: -50, max: 50 },
                      { label: "Y Offset", field: "y" as const, min: -50, max: 50 },
                      { label: "Blur", field: "blur" as const, min: 0, max: 100 },
                      { label: "Spread", field: "spread" as const, min: -50, max: 50 },
                    ]).map((ctrl) => (
                      <div key={ctrl.field}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{ctrl.label}</span>
                          <span className="text-xs font-mono text-slate-400">{shadow[ctrl.field]}px</span>
                        </div>
                        <input
                          type="range"
                          min={ctrl.min}
                          max={ctrl.max}
                          value={shadow[ctrl.field]}
                          onChange={(e) => updateShadow(shadow.id, ctrl.field, parseInt(e.target.value, 10))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CSS Output */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-400">CSS Code</h2>
            <button
              onClick={copyCSS}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
            >
              {copied ? "Copied!" : "Copy CSS"}
            </button>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <code className="text-sm font-mono text-green-400 whitespace-pre-wrap break-all select-all">
              {fullCSS}
            </code>
          </div>
        </div>

        {/* Presets */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Presets</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {PRESETS.map((preset) => {
              const previewShadow = preset.shadows
                .map((s) => `${s.inset ? "inset " : ""}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${hexToRgba(s.color, s.opacity)}`)
                .join(", ");
              return (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="group text-center"
                >
                  <div className="flex items-center justify-center h-20 bg-slate-900 rounded-lg border border-slate-700 group-hover:border-blue-500 transition-colors">
                    <div
                      className="w-12 h-12 rounded-md"
                      style={{ backgroundColor: "#1e293b", boxShadow: previewShadow }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-white transition-colors mt-1 block">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Box Shadow Properties Reference */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Box Shadow Properties</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400 font-medium">Property</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                  <th className="text-left py-2 text-slate-400 font-medium">Values</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  ["X Offset", "Horizontal position of the shadow", "Positive = right, negative = left"],
                  ["Y Offset", "Vertical position of the shadow", "Positive = down, negative = up"],
                  ["Blur Radius", "How blurry the shadow appears", "0 = sharp edge, higher = softer"],
                  ["Spread Radius", "Size increase/decrease of the shadow", "Positive = larger, negative = smaller"],
                  ["Color", "Shadow color with opacity", "Any CSS color, usually with alpha"],
                  ["Inset", "Places shadow inside the element", "Optional keyword, creates inner shadow"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-slate-700/50">
                    <td className="py-2 font-medium text-white font-mono text-xs">{row[0]}</td>
                    <td className="py-2">{row[1]}</td>
                    <td className="py-2 text-slate-400">{row[2]}</td>
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
              { name: "CSS Gradient Generator", slug: "css-gradient-generator", desc: "Create linear, radial, and conic gradients" },
              { name: "CSS Minifier", slug: "css-minifier", desc: "Minify and beautify CSS code" },
              { name: "Tailwind CSS Converter", slug: "tailwind-css-converter", desc: "Convert CSS to Tailwind utility classes" },
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
                q: "How does the CSS box-shadow property work?",
                a: "The box-shadow property adds shadow effects around an element. The syntax is: box-shadow: [inset] x-offset y-offset blur spread color. You can add multiple shadows separated by commas, and they stack in the order listed (first shadow on top)."
              },
              {
                q: "What is the difference between blur and spread?",
                a: "Blur radius controls how soft or sharp the shadow edge is — 0 gives a hard edge, higher values create a softer, more diffused shadow. Spread radius changes the size of the shadow — positive values make it larger than the element, negative values make it smaller. A common technique uses negative spread with positive blur for a more natural shadow."
              },
              {
                q: "Can I use multiple box shadows?",
                a: "Yes. CSS allows multiple comma-separated shadows on a single element. This is great for creating layered, realistic shadow effects — for example, a soft ambient shadow combined with a tighter directional shadow. This tool supports up to 6 shadow layers."
              },
              {
                q: "What is an inset shadow?",
                a: "An inset shadow appears inside the element instead of outside. It creates an inner shadow or pressed-in effect. Use it for input fields, cards with depth, or embossed UI elements. Combine inset and normal shadows for realistic effects."
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
  );
}
