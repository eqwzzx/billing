#!/bin/bash
# Быстрое исправление скидки первого заказа

cd /var/www/billing

echo "1️⃣  Загрузите через SFTP обновлённый файл:"
echo "   app/api/marketing/discount/route.ts"
echo ""
echo "2️⃣  Пересборка и перезапуск:"

rm -rf .next && \
npm run build && \
pm2 restart avelon-web && \
echo "✅ Готово!" && \
pm2 logs avelon-web --lines 30
