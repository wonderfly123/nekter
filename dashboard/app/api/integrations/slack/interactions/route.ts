import { NextRequest, NextResponse } from 'next/server';

// Slack requires this endpoint for interactivity, even for URL buttons
// This handles any interactive component callbacks (button clicks, etc.)
export async function POST(request: NextRequest) {
  // Slack sends interaction payloads as form data
  // For now, just acknowledge receipt - URL buttons don't actually trigger this
  return NextResponse.json({ ok: true });
}
