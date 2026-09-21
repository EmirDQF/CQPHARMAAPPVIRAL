import { NextResponse } from "next/server";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error: message }, { status });
}
