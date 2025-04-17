import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ exists: false, error: 'URL non fournie' }, { status: 400 });
  }

  try {
    const response = await fetch(url, { method: 'HEAD' });
    return NextResponse.json({ exists: response.ok });
  } catch (error) {
    return NextResponse.json({ exists: false, error: 'Erreur lors de la vérification de l\'URL' });
  }
} 