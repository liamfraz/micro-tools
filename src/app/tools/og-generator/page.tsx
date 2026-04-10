import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/tool-metadata";
import OGGeneratorClient from "./OGGeneratorClient";

export const metadata: Metadata = generateToolMetadata("og-generator");

export default function OGGeneratorPage() {
  return <OGGeneratorClient />;
}
