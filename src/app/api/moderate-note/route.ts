import { NextRequest, NextResponse } from "next/server";
import { moderateNote } from "@/lib/moderate";

export async function POST(req: NextRequest) {
  const { general_tips, tools_needed, common_problems } = await req.json();
  return NextResponse.json(await moderateNote({ general_tips, tools_needed, common_problems }));
}
