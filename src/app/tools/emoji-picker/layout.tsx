import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/tool-metadata";

const SLUG = "emoji-picker";

export const metadata: Metadata = generateToolMetadata(SLUG);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
