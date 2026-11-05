import type { Metadata } from "next";
import { activeCampgrounds } from "@/lib/camp";
import { toLite } from "@/lib/lite";
import SavedClient from "@/components/SavedClient";

export const metadata: Metadata = {
  title: "保存した施設を比べる — ソロキャン羅針盤",
  description: "保存したキャンプ場を、料金・チェックイン・風呂・トイレ・直火・バイクなどで横に並べて比べる。",
  alternates: { canonical: "/saved" },
  robots: { index: false, follow: true },
};

export default function SavedPage() {
  return <SavedClient camps={activeCampgrounds.map(toLite)} />;
}
