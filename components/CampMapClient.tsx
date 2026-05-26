"use client";

import dynamic from "next/dynamic";

const CampMap = dynamic(() => import("./CampMap"), { ssr: false });

export default function CampMapClient(props: { lat: number; lng: number; name: string }) {
  return <CampMap {...props} />;
}
