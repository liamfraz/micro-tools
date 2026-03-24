import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/tool-metadata";

const SLUG = "css-gradient-generator";

export const metadata: Metadata = generateToolMetadata(SLUG);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
