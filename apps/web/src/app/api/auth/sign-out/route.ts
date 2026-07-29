import { NextResponse } from 'next/server';

export async function GET() {
  const response = new NextResponse(null, {
    status: 307,
    headers: { Location: '/auth/sign-in' },
  });

  response.cookies.delete('token');

  return response;
}
