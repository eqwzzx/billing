# ✅ Проверка API конвертации валют

## 🚀 Быстрая проверка (2 минуты)

### Шаг 1: Запустите сервер

```bash
npm run dev
```

### Шаг 2: Откройте API endpoint

Откройте в браузере:
```
http://localhost:3000/api/currency/rates
```

### Шаг 3: Проверьте ответ

Вы должны увидеть JSON с курсами:

```json
{
  "rates": {
    "RUB": 1,
    "USD": 0.012987...,
    "EUR": 0.011560...,
    "UAH": 0.520833...
  },
  "source": "CBR",
  "lastUpdated": "2026-07-14T...",
  "cached": false
}
```

✅ Если `"source": "CBR"` - API работает!  
⚠️ Если `"source": "fallback"` - API недоступен, используются статичные курсы

---

## 🧪 Детальная проверка

### 1. Проверка актуальности курсов

Сравните полученные курсы с официальными:

**Источник:** https://www.cbr.ru/currency_base/daily/

Пример проверки:
```
API вернул: "USD": 0.012987
Значит 1 USD = 1 / 0.012987 = 77.00 RUB

Сравните с ЦБ РФ - должно совпадать!
```

### 2. Проверка кеширования

```bash
# Первый запрос (получение с API)
curl http://localhost:3000/api/currency/rates | jq '.cached'
# Должно быть: false

# Второй запрос сразу (из кеша)
curl http://localhost:3000/api/currency/rates | jq '.cached'
# Должно быть: true
```

### 3. Проверка на главной странице

1. Откройте: http://localhost:3000
2. Перейдите к секции "Тарифы"
3. Переключайте валюты: RUB → USD → EUR → UAH
4. Откройте консоль браузера (F12)
5. Должно быть сообщение:

```
✅ Currency rates updated: {
  source: 'CBR',
  lastUpdated: '...',
  rates: { ... }
}
```

---

## 🔍 Возможные результаты

### ✅ Успех (API работает)

```json
{
  "source": "CBR",
  "cached": false,
  "rates": {
    "USD": 0.012987,
    "EUR": 0.011560,
    "UAH": 0.520833
  }
}
```

**Что это значит:**
- Курсы получены с ЦБ РФ
- Данные актуальные
- Всё работает правильно

### ⚡ Кеш (быстрая работа)

```json
{
  "source": "CBR",
  "cached": true,
  "cacheAge": 1235,
  "rates": { ... }
}
```

**Что это значит:**
- Используется кеш (возраст 1235 секунд)
- Курсы получены ранее с ЦБ РФ
- Быстрая работа без запроса к API

### ⚠️ Fallback (API недоступен)

```json
{
  "source": "fallback",
  "error": "Using fallback rates due to API error",
  "rates": {
    "USD": 0.013,
    "EUR": 0.0115,
    "UAH": 0.52
  }
}
```

**Что это значит:**
- API ЦБ РФ временно недоступен
- Используются статичные курсы
- Функциональность не нарушена

---

## 🛠️ Диагностика проблем

### Проблема 1: API недоступен

**Симптомы:**
```json
{ "source": "fallback" }
```

**Причины:**
- Нет интернет-соединения
- API ЦБ РФ не работает
- Firewall блокирует запросы

**Решение:**
1. Проверьте интернет:
   ```bash
   ping www.cbr-xml-daily.ru
   ```

2. Попробуйте вручную:
   ```bash
   curl https://www.cbr-xml-daily.ru/daily_json.js
   ```

3. Подождите - курсы обновятся автоматически когда API заработает

### Проблема 2: Старые курсы

**Симптомы:**
- Курсы не обновляются
- `cacheAge` очень большой

**Решение:**
```bash
# Очистите кеш Next.js
rm -rf .next

# Перезапустите
npm run dev
```

### Проблема 3: Ошибка в консоли

**Симптомы:**
```
⚠️ Failed to update currency rates, using fallback
```

**Решение:**
- Это нормально! Система автоматически использует fallback
- Проверьте детали ошибки в консоли
- Курсы обновятся при следующей попытке

---

## 📊 Мониторинг в production

### Логи для проверки:

```bash
# PM2
pm2 logs billing | grep "Currency"

# Docker
docker logs billing | grep "Currency"

# Стандартный вывод
tail -f logs/app.log | grep "Currency"
```

### Что искать:

**Успешное обновление:**
```
✅ Currency rates updated: { source: 'CBR', ... }
```

**Ошибка:**
```
⚠️ Failed to update currency rates, using fallback: Error: ...
```

---

## 🎯 Тестовые сценарии

### Тест 1: Первая загрузка

```bash
# Очистить всё
rm -rf .next
npm run dev

# Открыть страницу
open http://localhost:3000

# Проверить консоль - должно быть:
# ✅ Currency rates updated
```

### Тест 2: Кеширование

```bash
# Первый запрос
time curl http://localhost:3000/api/currency/rates
# Должно быть ~500ms, cached: false

# Второй запрос
time curl http://localhost:3000/api/currency/rates
# Должно быть <10ms, cached: true
```

### Тест 3: Отключение интернета

```bash
# Отключите Wi-Fi
# Откройте страницу
open http://localhost:3000

# Должно использоваться fallback
# source: "fallback"
```

---

## ✅ Чек-лист проверки

### На локальной машине:

- [ ] API endpoint `/api/currency/rates` отвечает
- [ ] `source` = `"CBR"` (не fallback)
- [ ] Курсы актуальные (сравнили с cbr.ru)
- [ ] Кеширование работает (`cached: true` при повторном запросе)
- [ ] На главной странице валюты конвертируются правильно
- [ ] В консоли нет ошибок
- [ ] Сообщение "✅ Currency rates updated" присутствует

### На production:

- [ ] API endpoint доступен извне
- [ ] Логи показывают успешное обновление
- [ ] Нет частых fallback
- [ ] Время ответа < 1сек
- [ ] Кеш работает (проверить `cacheAge`)

---

## 🎓 Полезные команды

### Получить текущие курсы:

```bash
curl -s http://localhost:3000/api/currency/rates | jq '.rates'
```

### Проверить источник:

```bash
curl -s http://localhost:3000/api/currency/rates | jq '.source'
```

### Проверить кеш:

```bash
curl -s http://localhost:3000/api/currency/rates | jq '.cached, .cacheAge'
```

### Сравнить с ЦБ:

```bash
# Наш API
curl -s http://localhost:3000/api/currency/rates | jq '.rates.USD'

# ЦБ напрямую
curl -s https://www.cbr-xml-daily.ru/daily_json.js | jq '.Valute.USD.Value'
```

---

## 📞 Поддержка

Если что-то не работает:

1. Проверьте этот чек-лист
2. Посмотрите логи в консоли
3. Проверьте интернет-соединение
4. Попробуйте очистить кеш Next.js
5. Перезапустите dev сервер

---

**Дата:** 14 июля 2026  
**Статус:** ✅ Готово к проверке
