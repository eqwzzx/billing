import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { RefreshCw } from "lucide-react"

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="px-4 py-24 sm:px-8 md:px-16 lg:px-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <RefreshCw className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Политика возврата средств
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Последнее обновление: 14 июля 2026
              </p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-6">
            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">1. Общие положения</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Fluxor Hosting Solutions LLC стремится обеспечить высокое качество услуг. 
                  Настоящая политика определяет условия возврата средств за неиспользованные услуги.
                </p>
                <p className="text-amber-400 font-medium">
                  Все запросы на возврат рассматриваются индивидуально в течение 3-5 рабочих дней.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">2. Условия возврата</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    2.1. Возврат в течение 24 часов
                  </h3>
                  <p>
                    При отказе от услуги в течение 24 часов с момента оплаты 
                    возвращается <span className="text-emerald-400 font-medium">100% стоимости</span>, если:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Сервер не был запущен или использовался менее 1 часа</li>
                    <li>Не были установлены плагины/моды/файлы</li>
                    <li>Не было изменений конфигурации</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    2.2. Пропорциональный возврат
                  </h3>
                  <p>
                    При удалении сервера до окончания оплаченного периода 
                    производится возврат за неиспользованные дни:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Расчет: (Стоимость ÷ 30 дней) × Неиспользованные дни</li>
                    <li>Минимальный период для возврата: 7 дней</li>
                    <li>Не применяется к промо-тарифам и специальным акциям</li>
                  </ul>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-amber-400 font-medium">
                    ⚠️ Промокоды и бонусные средства не возвращаются при возврате
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">3. Когда возврат НЕ производится</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Возврат средств невозможен в следующих случаях:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Нарушение пользовательского соглашения</li>
                  <li>Блокировка аккаунта за противозаконную деятельность</li>
                  <li>Использование сервера более 7 дней</li>
                  <li>Отказ от услуги после использования более 70% оплаченного периода</li>
                  <li>Технические проблемы по вине клиента</li>
                  <li>Несовместимость программного обеспечения клиента</li>
                  <li>Изменение мнения без объективных причин (после 24 часов)</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">4. Технические проблемы</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    4.1. По вине хостинга
                  </h3>
                  <p>Если проблема вызвана нашим оборудованием или ошибками:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Полный возврат при недоступности более 72 часов</li>
                    <li>Компенсация за downtime более 5% в месяц</li>
                    <li>Бесплатное продление на период недоступности</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    4.2. По вине клиента
                  </h3>
                  <p>Возврат не производится, если проблема связана с:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Неправильной конфигурацией сервера</li>
                    <li>Установкой несовместимого ПО</li>
                    <li>Недостатком выбранных ресурсов (нужен апгрейд тарифа)</li>
                    <li>Проблемами с интернет-соединением клиента</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">5. Процедура возврата</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Для запроса возврата:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Отправьте запрос на support@yourdomain.ru</li>
                  <li>Укажите ID сервера и причину возврата</li>
                  <li>Приложите подтверждающие материалы (скриншоты, логи)</li>
                  <li>Дождитесь рассмотрения заявки (3-5 рабочих дней)</li>
                  <li>При одобрении средства вернутся на баланс аккаунта</li>
                </ol>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                  <p className="text-blue-400">
                    💡 Средства возвращаются на внутренний баланс и могут быть использованы 
                    для оплаты других услуг или выведены на исходный способ оплаты.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">6. Сроки возврата</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>На баланс аккаунта — мгновенно после одобрения</li>
                  <li>На банковскую карту — 5-10 рабочих дней</li>
                  <li>На электронный кошелек — 1-3 рабочих дня</li>
                  <li>На криптовалютный кошелек — 1-2 рабочих дня</li>
                </ul>
                <p className="text-amber-400 font-medium">
                  Комиссия платежной системы за возврат может быть вычтена из суммы возврата.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">7. Автоматический возврат</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  При удалении сервера через панель управления автоматически рассчитывается 
                  и начисляется возврат на баланс за неиспользованные дни (если применимо).
                </p>
                <p>
                  Вы можете отслеживать все транзакции и возвраты в разделе «История платежей» 
                  личного кабинета.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">8. Споры</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Если Вы не согласны с решением по возврату, Вы можете:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Запросить повторное рассмотрение с дополнительными материалами</li>
                  <li>Обратиться к старшему менеджеру через abuse@yourdomain.ru</li>
                  <li>Использовать альтернативные способы разрешения споров</li>
                </ul>
                <p>
                  Мы всегда открыты к диалогу и стремимся найти справедливое решение.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">9. Контакты</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>По вопросам возврата средств обращайтесь:</p>
                <ul className="list-none space-y-2">
                  <li>📧 Email: support@yourdomain.ru</li>
                  <li>💰 Billing: billing@yourdomain.ru</li>
                  <li>💬 Discord: dsc.gg/avelonmy</li>
                </ul>
                <p className="text-xs text-muted-foreground/60 mt-4">
                  Fluxor Hosting Solutions LLC<br />
                  Registered in Hong Kong
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
