import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { signInWithGithub } from '@/http/sign-in-with-github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { message: 'Github Oauth code was not found.' },
      { status: 400 }
    );
  }

  const { token } = await signInWithGithub({ code });

  (await cookies()).set('token', token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return new NextResponse(null, {
    status: 307,
    headers: { Location: '/' },
  });
}
