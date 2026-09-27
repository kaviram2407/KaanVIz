import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "KaanViz Frontend",
    timestamp: new Date().toISOString(),
  });
}
