import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

const COOKIE_NAME = "osa_review_access";

function cookieValue(secret: string) {
  return createHmac("sha256", secret).update("osa-review-session-v1").digest("hex");
}

function passwordMatches(input: string, expected: string) {
  const left = Buffer.from(input);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  const reviewSecret = process.env.OSA_REVIEW_SECRET;
  if (!reviewSecret) {
    return NextResponse.json({ error: "Review access is not configured yet. Add OSA_REVIEW_SECRET in Vercel." }, { status: 503 });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.password !== "string" || !passwordMatches(body.password, reviewSecret)) {
    return NextResponse.json({ error: "Incorrect review password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, cookieValue(reviewSecret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/review",
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/review",
    maxAge: 0,
  });
  return response;
}
