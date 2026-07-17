import { NextResponse } from 'next/server';

/**
 * Legacy endpoint — use POST /api/store/product-autofill instead.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Deprecated. Use /api/store/product-autofill',
    },
    { status: 410 }
  );
}
