"use client";

import { useState, useCallback, useEffect } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

// ── IP info types ──

interface IpInfo {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
}

// ── Subnet calculator ──

const ipToNum = (ip: string): number => {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return -1;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
};

const numToIp = (num: number): string => {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join(".");
};

const cidrToMask = (cidr: number): number => {
  if (cidr === 0) return 0;
  return (~0 << (32 - cidr)) >>> 0;
};

interface SubnetResult {
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  cidr: number;
  ipClass: string;
  isPrivate: boolean;
}

const calculateSubnet = (ip: string, cidr: number): SubnetResult | null => {
  const ipNum = ipToNum(ip);
  if (ipNum === -1 || cidr < 0 || cidr > 32) return null;

  const mask = cidrToMask(cidr);
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = cidr >= 31 ? totalHosts : totalHosts - 2;

  const firstByte = (ipNum >>> 24) & 255;
  let ipClass = "A";
  if (firstByte >= 128 && firstByte < 192) ipClass = "B";
  else if (firstByte >= 192 && firstByte < 224) ipClass = "C";
  else if (firstByte >= 224 && firstByte < 240) ipClass = "D (Multicast)";
  else if (firstByte >= 240) ipClass = "E (Reserved)";

  const isPrivate =
    (firstByte === 10) ||
    (firstByte === 172 && ((ipNum >>> 16) & 255) >= 16 && ((ipNum >>> 16) & 255) <= 31) ||
    (firstByte === 192 && ((ipNum >>> 16) & 255) === 168) ||
    (firstByte === 127);

  return {
    networkAddress: numToIp(network),
    broadcastAddress: numToIp(broadcast),
    subnetMask: numToIp(mask),
    wildcardMask: numToIp((~mask) >>> 0),
    firstHost: cidr >= 31 ? numToIp(network) : numToIp(network + 1),
    lastHost: cidr >= 31 ? numToIp(broadcast) : numToIp(broadcast - 1),
    totalHosts,
    usableHosts: Math.max(0, usableHosts),
    cidr,
    ipClass,
    isPrivate,
  };
};

// ── Common CIDR presets ──
const CIDR_PRESETS: { label: string; cidr: number; hosts: string }[] = [
  { label: "/8", cidr: 8, hosts: "16.7M" },
  { label: "/16", cidr: 16, hosts: "65,534" },
  { label: "/20", cidr: 20, hosts: "4,094" },
  { label: "/24", cidr: 24, hosts: "254" },
  { label: "/25", cidr: 25, hosts: "126" },
  { label: "/26", cidr: 26, hosts: "62" },
  { label: "/27", cidr: 27, hosts: "30" },
  { label: "/28", cidr: 28, hosts: "14" },
  { label: "/29", cidr: 29, hosts: "6" },
  { label: "/30", cidr: 30, hosts: "2" },
  { label: "/32", cidr: 32, hosts: "1" },
];

// ── IPv4 validation ──
const isValidIpv4 = (ip: string): boolean => {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = parseInt(p, 10);
    return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
  });
};

export default function IpAddressLookupPage() {
  const [publicIp, setPublicIp] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lookupIp, setLookupIp] = useState("");
  const [lookupResult, setLookupResult] = useState<IpInfo | null>(null);
  const [lookupError, setLookupError] = useState("");

  // Subnet calculator state
  const [subnetIp, setSubnetIp] = useState("192.168.1.0");
  const [subnetCidr, setSubnetCidr] = useState(24);
  const [subnetResult, setSubnetResult] = useState<SubnetResult | null>(null);

  const [copiedField, setCopiedField] = useState("");

  // Fetch user's public IP on mount
  useEffect(() => {
    const fetchIp = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://ipinfo.io/json?token=");
        if (!res.ok) throw new Error("Failed to fetch IP info");
        const data = await res.json();
        setPublicIp(data);
      } catch {
        // Fallback to simpler API
        try {
          const res = await fetch("https://api.ipify.org?format=json");
          if (!res.ok) throw new Error("Failed to fetch IP");
          const data = await res.json();
          setPublicIp({ ip: data.ip });
        } catch {
          setError("Could not determine your public IP address. You may be blocking external requests.");
        }
      }
      setLoading(false);
    };
    fetchIp();
  }, []);

  // Calculate subnet on input change
  useEffect(() => {
    if (isValidIpv4(subnetIp)) {
      setSubnetResult(calculateSubnet(subnetIp, subnetCidr));
    } else {
      setSubnetResult(null);
    }
  }, [subnetIp, subnetCidr]);

  const handleLookup = useCallback(async () => {
    const ip = lookupIp.trim();
    if (!ip) { setLookupError("Enter an IP address to look up."); return; }
    if (!isValidIpv4(ip) && !ip.includes(":")) {
      setLookupError("Enter a valid IPv4 or IPv6 address.");
      return;
    }

    setLookupError("");
    setLookupResult(null);
    try {
      const res = await fetch(`https://ipinfo.io/${ip}/json?token=`);
      if (!res.ok) throw new Error("Lookup failed");
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "Invalid IP");
      setLookupResult(data);
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : "Failed to look up IP address.");
    }
  }, [lookupIp]);

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  }, []);

  const InfoRow = ({ label, value, field }: { label: string; value: string; field: string }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-700/50">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-white">{value}</span>
        <button
          onClick={() => copyToClipboard(value, field)}
          className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
          title="Copy"
        >
          {copiedField === field ? "✓" : "⧉"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <title>IP Address Lookup & Subnet Calculator - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Look up IP address details including location, ISP, and timezone. Calculate subnets with CIDR notation, network/broadcast addresses, and host ranges — all free."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "ip-address-lookup",
            name: "IP Address Lookup & Subnet Calculator",
            description: "Look up your public IP address and calculate subnet details from CIDR notation",
            category: "developer",
          }),
          generateBreadcrumbSchema({
            slug: "ip-address-lookup",
            name: "IP Address Lookup & Subnet Calculator",
            description: "Look up your public IP address and calculate subnet details from CIDR notation",
            category: "developer",
          }),
          generateFAQSchema([
            { question: "What is my IP address?", answer: "Your IP (Internet Protocol) address is a unique number assigned to your device by your Internet Service Provider (ISP). It identifies your device on the internet and is used for routing traffic. Your public IP is shown at the top of this page -- it's the address that websites and services see when you connect to them." },
            { question: "What is CIDR notation?", answer: "CIDR (Classless Inter-Domain Routing) notation expresses an IP address and its subnet mask as a single value, like 192.168.1.0/24. The number after the slash indicates how many bits of the address are the network prefix. A /24 means 24 bits for the network (256 total addresses, 254 usable hosts), while a /16 means 16 bits (65,536 addresses)." },
            { question: "What's the difference between public and private IP addresses?", answer: "Private IP addresses (10.x.x.x, 172.16-31.x.x, 192.168.x.x) are used within local networks and can't be reached directly from the internet. Public IP addresses are globally unique and routable on the internet. Your router has a public IP; devices behind it use private IPs. NAT (Network Address Translation) bridges the two." },
            { question: "Is this lookup data accurate?", answer: "IP geolocation data is sourced from ipinfo.io and is generally accurate to the city level for most ISPs. However, VPN, proxy, or corporate network users may see the location of their exit node rather than their physical location. The subnet calculator uses pure math and is always exact." },
          ]),
        ]}
      />

      <main className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <ToolBreadcrumb slug="ip-address-lookup" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              IP Address Lookup & Subnet Calculator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Find your public IP address with geolocation details, look up any IP address, and calculate subnets with CIDR notation, network ranges, and host counts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Your IP */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Your Public IP</h2>
              {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Detecting your IP address...
                </div>
              )}
              {error && (
                <div className="text-sm text-red-400">{error}</div>
              )}
              {publicIp && (
                <div>
                  <div className="text-3xl font-mono font-bold text-blue-400 mb-4">{publicIp.ip}</div>
                  {publicIp.city && <InfoRow label="City" value={publicIp.city} field="city" />}
                  {publicIp.region && <InfoRow label="Region" value={publicIp.region} field="region" />}
                  {publicIp.country && <InfoRow label="Country" value={publicIp.country} field="country" />}
                  {publicIp.loc && <InfoRow label="Location" value={publicIp.loc} field="loc" />}
                  {publicIp.org && <InfoRow label="ISP / Org" value={publicIp.org} field="org" />}
                  {publicIp.postal && <InfoRow label="Postal Code" value={publicIp.postal} field="postal" />}
                  {publicIp.timezone && <InfoRow label="Timezone" value={publicIp.timezone} field="timezone" />}
                  {publicIp.hostname && <InfoRow label="Hostname" value={publicIp.hostname} field="hostname" />}
                  <button
                    onClick={() => copyToClipboard(publicIp.ip, "publicIp")}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {copiedField === "publicIp" ? "Copied!" : "Copy IP Address"}
                  </button>
                </div>
              )}
            </div>

            {/* Lookup any IP */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Look Up an IP Address</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={lookupIp}
                  onChange={(e) => { setLookupIp(e.target.value); setLookupError(""); }}
                  placeholder="e.g. 8.8.8.8 or 2001:4860:4860::8888"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => { if (e.key === "Enter") handleLookup(); }}
                />
                <button
                  onClick={handleLookup}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                >
                  Look Up
                </button>
              </div>

              {/* Quick lookup presets */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {[
                  { label: "Google DNS", ip: "8.8.8.8" },
                  { label: "Cloudflare", ip: "1.1.1.1" },
                  { label: "OpenDNS", ip: "208.67.222.222" },
                  { label: "Quad9", ip: "9.9.9.9" },
                ].map((preset) => (
                  <button
                    key={preset.ip}
                    onClick={() => { setLookupIp(preset.ip); setLookupError(""); }}
                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                  >
                    {preset.label} ({preset.ip})
                  </button>
                ))}
              </div>

              {lookupError && (
                <div className="text-sm text-red-400 mb-3">{lookupError}</div>
              )}

              {lookupResult && (
                <div>
                  <div className="text-2xl font-mono font-bold text-green-400 mb-3">{lookupResult.ip}</div>
                  {lookupResult.city && <InfoRow label="City" value={lookupResult.city} field="l-city" />}
                  {lookupResult.region && <InfoRow label="Region" value={lookupResult.region} field="l-region" />}
                  {lookupResult.country && <InfoRow label="Country" value={lookupResult.country} field="l-country" />}
                  {lookupResult.loc && <InfoRow label="Location" value={lookupResult.loc} field="l-loc" />}
                  {lookupResult.org && <InfoRow label="ISP / Org" value={lookupResult.org} field="l-org" />}
                  {lookupResult.postal && <InfoRow label="Postal Code" value={lookupResult.postal} field="l-postal" />}
                  {lookupResult.timezone && <InfoRow label="Timezone" value={lookupResult.timezone} field="l-timezone" />}
                  {lookupResult.hostname && <InfoRow label="Hostname" value={lookupResult.hostname} field="l-hostname" />}
                </div>
              )}

              {!lookupResult && !lookupError && (
                <div className="text-sm text-slate-500 mt-4">
                  Enter any public IPv4 or IPv6 address to see its geolocation, ISP, and timezone information.
                </div>
              )}
            </div>
          </div>

          {/* Subnet Calculator */}
          <div className="bg-slate-800 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Subnet Calculator</h2>
            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">IP Address</label>
                <input
                  type="text"
                  value={subnetIp}
                  onChange={(e) => setSubnetIp(e.target.value)}
                  placeholder="192.168.1.0"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">CIDR (/{subnetCidr})</label>
                <input
                  type="range"
                  min={0}
                  max={32}
                  value={subnetCidr}
                  onChange={(e) => setSubnetCidr(parseInt(e.target.value, 10))}
                  className="w-48 accent-blue-500"
                />
              </div>
              <div className="text-sm font-mono text-slate-300">
                /{subnetCidr}
              </div>
            </div>

            {/* CIDR presets */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {CIDR_PRESETS.map((preset) => (
                <button
                  key={preset.cidr}
                  onClick={() => setSubnetCidr(preset.cidr)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    subnetCidr === preset.cidr
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  }`}
                >
                  {preset.label} ({preset.hosts})
                </button>
              ))}
            </div>

            {subnetResult ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <InfoRow label="Network Address" value={subnetResult.networkAddress} field="s-network" />
                <InfoRow label="Broadcast Address" value={subnetResult.broadcastAddress} field="s-broadcast" />
                <InfoRow label="Subnet Mask" value={subnetResult.subnetMask} field="s-mask" />
                <InfoRow label="Wildcard Mask" value={subnetResult.wildcardMask} field="s-wildcard" />
                <InfoRow label="First Usable Host" value={subnetResult.firstHost} field="s-first" />
                <InfoRow label="Last Usable Host" value={subnetResult.lastHost} field="s-last" />
                <InfoRow label="Total Addresses" value={subnetResult.totalHosts.toLocaleString()} field="s-total" />
                <InfoRow label="Usable Hosts" value={subnetResult.usableHosts.toLocaleString()} field="s-usable" />
                <InfoRow label="CIDR Notation" value={`${subnetResult.networkAddress}/${subnetResult.cidr}`} field="s-cidr" />
                <InfoRow label="IP Class" value={subnetResult.ipClass} field="s-class" />
                <div className="flex items-center justify-between py-2.5 border-b border-slate-700/50 sm:col-span-2">
                  <span className="text-sm text-slate-400">Address Type</span>
                  <span className={`text-sm font-medium ${subnetResult.isPrivate ? "text-yellow-400" : "text-green-400"}`}>
                    {subnetResult.isPrivate ? "Private (RFC 1918)" : "Public"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-400">
                {subnetIp && !isValidIpv4(subnetIp) ? "Enter a valid IPv4 address" : ""}
              </div>
            )}
          </div>

          {/* Common subnets reference */}
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Common Subnet Reference</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400 font-medium">CIDR</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Subnet Mask</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Addresses</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Usable Hosts</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Use Case</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ["/8", "255.0.0.0", "16,777,216", "16,777,214", "Class A networks"],
                    ["/16", "255.255.0.0", "65,536", "65,534", "Class B networks, large orgs"],
                    ["/20", "255.255.240.0", "4,096", "4,094", "Cloud VPC subnets"],
                    ["/24", "255.255.255.0", "256", "254", "Standard LAN subnet"],
                    ["/25", "255.255.255.128", "128", "126", "Half a /24 subnet"],
                    ["/26", "255.255.255.192", "64", "62", "Small office network"],
                    ["/27", "255.255.255.224", "32", "30", "Small subnet"],
                    ["/28", "255.255.255.240", "16", "14", "Point-to-point + devices"],
                    ["/29", "255.255.255.248", "8", "6", "Small server cluster"],
                    ["/30", "255.255.255.252", "4", "2", "Point-to-point link"],
                    ["/32", "255.255.255.255", "1", "1", "Single host route"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-slate-700/50">
                      <td className="py-2 font-mono text-blue-400">{row[0]}</td>
                      <td className="py-2 font-mono text-xs">{row[1]}</td>
                      <td className="py-2">{row[2]}</td>
                      <td className="py-2">{row[3]}</td>
                      <td className="py-2 text-xs">{row[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <RelatedTools currentSlug="ip-address-lookup" />

          {/* FAQ */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "What is my IP address?",
                  a: "Your IP (Internet Protocol) address is a unique number assigned to your device by your Internet Service Provider (ISP). It identifies your device on the internet and is used for routing traffic. Your public IP is shown at the top of this page — it's the address that websites and services see when you connect to them."
                },
                {
                  q: "What is CIDR notation?",
                  a: "CIDR (Classless Inter-Domain Routing) notation expresses an IP address and its subnet mask as a single value, like 192.168.1.0/24. The number after the slash indicates how many bits of the address are the network prefix. A /24 means 24 bits for the network (256 total addresses, 254 usable hosts), while a /16 means 16 bits (65,536 addresses)."
                },
                {
                  q: "What's the difference between public and private IP addresses?",
                  a: "Private IP addresses (10.x.x.x, 172.16-31.x.x, 192.168.x.x) are used within local networks and can't be reached directly from the internet. Public IP addresses are globally unique and routable on the internet. Your router has a public IP; devices behind it use private IPs. NAT (Network Address Translation) bridges the two."
                },
                {
                  q: "Is this lookup data accurate?",
                  a: "IP geolocation data is sourced from ipinfo.io and is generally accurate to the city level for most ISPs. However, VPN, proxy, or corporate network users may see the location of their exit node rather than their physical location. The subnet calculator uses pure math and is always exact."
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
