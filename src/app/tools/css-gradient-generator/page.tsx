"use client";

import { useState, useCallback, useMemo } from "react";

interface ColorStop {
  id: number;
  color: string;
  position: number;
}

type GradientType = "linear" | "radial" | "conic";

const PRESETS = [
  { name: "Sunset", stops: [{ color: "#ff6b6b", position: 0 }, { color: "#feca57", position: 100 }], type: "linear" as GradientType, angle: 135 },
  { name: "Ocean", stops: [{ color: "#667eea", position: 0 }, { color: "#764ba2", position: 100 }], type: "linear" as GradientType, angle: 135 },
  { name: "Forest", stops: [{ color: "#11998e", position: 0 }, { color: "#38ef7d", position: 100 }], type: "linear" as GradientType, angle: 135 },
  { name: "Peach", stops: [{ color: "#ffecd2", position: 0 }, { color: "#fcb69f", position: 100 }], type: "linear" as GradientType, angle: 135 },
  { name: "Night Sky", stops: [{ color: "#0f0c29", position: 0 }, { color: "#302b63", position: 50 }, { color: "#24243e", position: 100 }], type: "linear" as GradientType, angle: 180 },
  { name: "Candy", stops: [{ color: "#fc5c7d", position: 0 }, { color: "#6a82fb", position: 100 }], type: "linear" as GradientType, angle: 90 },
  { name: "Mint", stops: [{ color: "#00b09b", position: 0 }, { color: "#96c93d", position: 100 }], type: "linear" as GradientType, angle: 90 },
  { name: "Aurora", stops: [{ color: "#a8ff78", position: 0 }, { color: "#78ffd6", position: 50 }, { color: "#007991", position: 100 }], type: "linear" as GradientType, angle: 135 },
];

let nextId = 3;

export default function CSSGradientGeneratorPage() {
  const [stops, setStops] = useState<ColorStop[]>([
    { id: 1, color: "#667eea", position: 0 },
    { id: 2, color: "#764ba2", position: 100 },
  ]);
  const [gradientType, setGradientType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(135);
  const [radialShape, setRadialShape] = useState<"circle" | "ellipse">("circle");
  const [copied, setCopied] = useState<string | null>(null);

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.position - b.position),
    [stops]
  );

  const cssGradient = useMemo(() => {
    const stopsStr = sortedStops
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");

    switch (gradientType) {
      case "linear":
        return `linear-gradient(${angle}deg, ${stopsStr})`;
      case "radial":
        return `radial-gradient(${radialShape}, ${stopsStr})`;
      case "conic":
        return `conic-gradient(from ${angle}deg, ${stopsStr})`;
    }
  }, [sortedStops, gradientType, angle, radialShape]);

  const cssCode = useMemo(() => {
    return `background: ${cssGradient};`;
  }, [cssGradient]);

  const tailwindClass = useMemo(() => {
    if (gradientType !== "linear" || stops.length !== 2) return null;
    const dirMap: Record<number, string> = {
      0: "bg-gradient-to-t",
      45: "bg-gradient-to-tr",
      90: "bg-gradient-to-r",
      135: "bg-gradient-to-br",
      180: "bg-gradient-to-b",
      225: "bg-gradient-to-bl",
      270: "bg-gradient-to-l",
      315: "bg-gradient-to-tl",
    };
    const dir = dirMap[angle];
    if (!dir) return null;
    return `${dir} from-[${sortedStops[0].color}] to-[${sortedStops[1].color}]`;
  }, [gradientType, angle, stops.length, sortedStops]);

  const addStop = useCallback(() => {
    if (stops.length >= 10) return;
    const id = nextId++;
    const midPosition = Math.round(
      (sortedStops[0].position + sortedStops[sortedStops.length - 1].position) / 2
    );
    setStops((prev) => [...prev, { id, color: "#ffffff", position: midPosition }]);
  }, [stops.length, sortedStops]);

  const removeStop = useCallback(
    (id: number) => {
      if (stops.length <= 2) return;
      setStops((prev) => prev.filter((s) => s.id !== id));
    },
    [stops.length]
  );

  const updateStop = useCallback(
    (id: number, field: "color" | "position", value: string | number) => {
      setStops((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  const randomize = useCallback(() => {
    const randomColor = () =>
      "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    setStops([
      { id: nextId++, color: randomColor(), position: 0 },
      { id: nextId++, color: randomColor(), position: 100 },
    ]);
    setAngle(Math.floor(Math.random() * 360));
  }, []);

  const applyPreset = useCallback((preset: typeof PRESETS[number]) => {
    setStops(
      preset.stops.map((s) => ({ ...s, id: nextId++ }))
    );
    setGradientType(preset.type);
    setAngle(preset.angle);
  }, []);

  const copyText = useCallback(async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <>
      <title>CSS Gradient Generator - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Generate beautiful CSS gradients with a visual editor. Linear, radial, and conic gradients with multiple color stops, presets, and copy-ready CSS code."
      />

      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="hover:text-white transition-colors">Home</a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li>
                <a href="/tools" className="hover:text-white transition-colors">Design Tools</a>
              </li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">CSS Gradient Generator</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              CSS Gradient Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Create beautiful CSS gradients visually. Choose gradient type, add
              color stops, pick from presets, and copy the CSS code to your
              project.
            </p>
          </div>

          {/* Preview */}
          <div
            className="w-full h-48 sm:h-64 rounded-xl border border-slate-700 mb-6 shadow-lg"
            style={{ background: cssGradient }}
          />

          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left: Gradient Settings */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>

              {/* Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Type
                </label>
                <div className="flex gap-2">
                  {(["linear", "radial", "conic"] as GradientType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setGradientType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                        gradientType === type
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Angle (linear & conic) */}
              {(gradientType === "linear" || gradientType === "conic") && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Angle: {angle}°
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={angle}
                    onChange={(e) => setAngle(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                      <button
                        key={a}
                        onClick={() => setAngle(a)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          angle === a
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                        }`}
                      >
                        {a}°
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Radial shape */}
              {gradientType === "radial" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Shape
                  </label>
                  <div className="flex gap-2">
                    {(["circle", "ellipse"] as const).map((shape) => (
                      <button
                        key={shape}
                        onClick={() => setRadialShape(shape)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                          radialShape === shape
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={addStop}
                  disabled={stops.length >= 10}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Add Color Stop
                </button>
                <button
                  onClick={randomize}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Random
                </button>
              </div>
            </div>

            {/* Right: Color Stops */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Color Stops ({stops.length})
              </h2>

              <div className="space-y-3">
                {sortedStops.map((stop) => (
                  <div
                    key={stop.id}
                    className="flex items-center gap-3 bg-slate-900 rounded-lg p-3"
                  >
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => updateStop(stop.id, "color", e.target.value)}
                      className="w-10 h-10 rounded border border-slate-600 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={stop.color}
                      onChange={(e) => updateStop(stop.id, "color", e.target.value)}
                      className="w-24 bg-slate-800 border border-slate-600 rounded px-2 py-1 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      spellCheck={false}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={stop.position}
                        onChange={(e) =>
                          updateStop(stop.id, "position", Number(e.target.value))
                        }
                        className="flex-1 accent-blue-500"
                      />
                      <span className="text-xs text-slate-400 w-10 text-right">
                        {stop.position}%
                      </span>
                    </div>
                    <button
                      onClick={() => removeStop(stop.id)}
                      disabled={stops.length <= 2}
                      className="text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
                      title="Remove stop"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Code Output */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">CSS Code</h2>

            <div className="bg-slate-900 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">CSS</span>
                <button
                  onClick={() => copyText("css", cssCode)}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {copied === "css" ? "Copied!" : "Copy"}
                </button>
              </div>
              <code className="text-sm font-mono text-green-400 break-all select-all">
                {cssCode}
              </code>
            </div>

            {tailwindClass && (
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">Tailwind CSS</span>
                  <button
                    onClick={() => copyText("tailwind", tailwindClass)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {copied === "tailwind" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <code className="text-sm font-mono text-blue-400 break-all select-all">
                  {tailwindClass}
                </code>
              </div>
            )}
          </div>

          {/* Presets */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Presets</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESETS.map((preset) => {
                const previewGradient = `linear-gradient(${preset.angle}deg, ${preset.stops
                  .map((s) => `${s.color} ${s.position}%`)
                  .join(", ")})`;
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="group"
                  >
                    <div
                      className="h-20 rounded-lg border border-slate-600 group-hover:border-blue-500 transition-colors mb-1"
                      style={{ background: previewGradient }}
                    />
                    <span className="text-xs text-slate-400 group-hover:text-white transition-colors">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FAQ */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What types of CSS gradients are there?
                </h3>
                <p className="text-slate-400">
                  CSS supports three gradient types: linear (straight line
                  transition), radial (emanating from a center point), and conic
                  (rotating around a center). Each can have multiple color stops
                  for complex effects.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How many color stops can I use?
                </h3>
                <p className="text-slate-400">
                  CSS gradients support unlimited color stops. This tool allows
                  up to 10 stops, which is more than enough for most designs.
                  More stops create smoother transitions and more complex
                  patterns.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Are CSS gradients supported in all browsers?
                </h3>
                <p className="text-slate-400">
                  Linear and radial gradients are supported in all modern
                  browsers (Chrome, Firefox, Safari, Edge). Conic gradients have
                  broad support but may require fallbacks for older browsers.
                  No vendor prefixes are needed for current browser versions.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I use gradients with Tailwind CSS?
                </h3>
                <p className="text-slate-400">
                  Yes. For simple two-color linear gradients at standard angles,
                  this tool generates Tailwind utility classes (e.g.,
                  bg-gradient-to-r from-blue-500 to-purple-500). For more
                  complex gradients, use the CSS output with Tailwind&apos;s
                  arbitrary value syntax or custom CSS.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
