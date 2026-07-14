import { NextRequest, NextResponse } from 'next/server';

// Инициирует OAuth процесс - редиректит пользователя на Discord
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'login'; // 'login' или 'link'
  
  console.log('[Discord OAuth Init] Action:', action);
  console.log('[Discord OAuth Init] Request URL:', request.url);
  
  const clientId = process.env.DISCORD_OAUTH_CLIENT_ID;
  const redirectUri = process.env.DISCORD_OAUTH_REDIRECT_URI;

  console.log('[Discord OAuth Init] Client ID:', clientId);
  console.log('[Discord OAuth Init] Redirect URI:', redirectUri);

  if (!clientId || !redirectUri) {
    console.error('[Discord OAuth Init] Missing configuration!');
    return NextResponse.json(
      { error: 'Discord OAuth не настроен' },
      { status: 500 }
    );
  }

  // Сохраняем action в state для callback
  const state = Buffer.from(JSON.stringify({ action })).toString('base64');
  console.log('[Discord OAuth Init] Generated state:', state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email',
    state: state,
  });

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  console.log('[Discord OAuth Init] Redirecting to:', discordAuthUrl);

  return NextResponse.redirect(discordAuthUrl);
}
