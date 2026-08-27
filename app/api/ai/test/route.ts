import { NextResponse } from "next/server";
import { openai } from "@/app/lib/openai";

export async function GET() {
  try {
    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: "Reply with exactly: Deutsch Werkstatt API connection successful.",
    });

    return NextResponse.json({
      success: true,
      message: response.output_text,
    });
  } catch (error) {
    console.error("OpenAI test error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "OpenAI API request failed.",
      },
      { status: 500 },
    );
  }
}