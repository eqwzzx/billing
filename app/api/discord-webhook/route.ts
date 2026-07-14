import { NextRequest, NextResponse } from 'next/server';

/**
 * Внутренний webhook для отправки уведомлений в Discord бота
 * Вызывается из других частей приложения при важных событиях
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Проверка авторизации (внутренний запрос)
    const authHeader = request.headers.get('authorization');
    const secret = process.env.INTERNAL_WEBHOOK_SECRET || 'fluxor-internal-webhook';
    
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Отправка события в Discord бота через HTTP запрос к боту
    // Бот должен иметь HTTP сервер для приёма webhooks
    const botWebhookUrl = process.env.DISCORD_BOT_WEBHOOK_URL;
    
    if (botWebhookUrl) {
      await fetch(botWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secret}`
        },
        body: JSON.stringify({ type, data })
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Discord webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
