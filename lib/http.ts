import { NextResponse } from "next/server";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: cors });
}

export function fail(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status, headers: cors });
}

export function options() {
  return new NextResponse(null, { status: 204, headers: cors });
}
