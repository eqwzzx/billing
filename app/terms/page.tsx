import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FileText } from "lucide-react"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="px-4 py-24 sm:px-8 md:px-16 lg:px-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Пользовательское соглашение
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
                  Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между 
                  Fluxor Hosting Solutions LLC (далее — «Компания», «Мы»), зарегистрированной в Гонконге, 
                  и пользователем (далее — «Клиент», «Вы») при использовании услуг хостинга, предоставляемых 
                  через сайт fluxor.host (далее — «Сервис»).
                </p>
                <p>
                  Регистрируясь на сайте и используя наши услуги, Вы подтверждаете, что прочитали, поняли 
                  и согласны соблюдать условия данного Соглашения.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">2. Предоставляемые услуги</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Компания предоставляет следующие услуги:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Хостинг игровых серверов (Minecraft и другие)</li>
                  <li>VDS/VPS серверы для различных задач</li>
                  <li>Hosting для кодинга и разработки</li>
                  <li>Техническая поддержка 24/7</li>
                  <li>Защита от DDoS-атак</li>
                  <li>Панель управления Pterodactyl</li>
                </ul>
                <p>
                  Все услуги предоставляются на условиях выбранного тарифного плана с ежемесячной оплатой.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">3. Регистрация и аккаунт</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>При регистрации Вы обязуетесь:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Предоставить достоверную и актуальную информацию</li>
                  <li>Обеспечить конфиденциальность учетных данных</li>
                  <li>Немедленно уведомить нас о любом несанкционированном доступе</li>
                  <li>Не передавать свой аккаунт третьим лицам</li>
                  <li>Быть старше 16 лет или иметь согласие родителей/опекунов</li>
                </ul>
                <p>
                  Вы несете полную ответственность за все действия, совершенные с использованием Вашего аккаунта.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">4. Оплата и тарифы</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Все цены указаны в российских рублях (₽) и действительны на момент публикации. 
                  Компания оставляет за собой право изменять тарифы с уведомлением за 7 дней.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Оплата производится авансом на период, указанный в тарифе</li>
                  <li>Услуги активируются после подтверждения платежа</li>
                  <li>При просрочке оплаты более 3 дней сервер может быть приостановлен</li>
                  <li>При просрочке более 7 дней сервер может быть удален без возможности восстановления</li>
                  <li>Промокоды и скидки не суммируются, если не указано иное</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">5. Запрещенное использование</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>При использовании наших услуг запрещено:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Размещение противозаконного контента (вредоносное ПО, фишинг, спам)</li>
                  <li>Проведение DDoS-атак и других кибератак</li>
                  <li>Нарушение авторских прав и интеллектуальной собственности</li>
                  <li>Майнинг криптовалют (если не указано иное в тарифе)</li>
                  <li>Использование ресурсов для незаконной деятельности</li>
                  <li>Перепродажа услуг без письменного согласия Компании</li>
                  <li>Действия, создающие чрезмерную нагрузку на инфраструктуру</li>
                </ul>
                <p className="text-amber-400 font-medium">
                  При нарушении данных правил Компания имеет право немедленно приостановить 
                  или прекратить предоставление услуг без возврата средств.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">6. Гарантии и ответственность</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Компания обязуется:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Обеспечивать доступность услуг на уровне не менее 99% в месяц</li>
                  <li>Предоставлять техническую поддержку 24/7</li>
                  <li>Защищать данные клиентов в соответствии с политикой конфиденциальности</li>
                  <li>Уведомлять о плановых технических работах заранее</li>
                </ul>
                <p>Компания не несет ответственности за:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Потерю данных, вызванную действиями клиента</li>
                  <li>Ущерб от DDoS-атак, если они превышают мощность защиты</li>
                  <li>Проблемы, вызванные программным обеспечением третьих лиц</li>
                  <li>Форс-мажорные обстоятельства</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">7. Резервное копирование</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Компания предоставляет автоматические бэкапы в рамках тарифных планов. 
                  Однако Клиент самостоятельно несет ответственность за сохранность своих данных 
                  и должен создавать собственные резервные копии критически важной информации.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">8. Прекращение услуг</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Клиент может прекратить использование услуг в любое время:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Через панель управления</li>
                  <li>Обратившись в службу поддержки</li>
                  <li>Просто не продлевая подписку</li>
                </ul>
                <p>
                  При удалении сервера все данные безвозвратно удаляются. 
                  Возврат средств производится в соответствии с политикой возврата.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">9. Изменения в Соглашении</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Компания оставляет за собой право вносить изменения в данное Соглашение. 
                  Об изменениях Вы будете уведомлены по электронной почте или через уведомление на сайте 
                  не менее чем за 7 дней до вступления изменений в силу.
                </p>
                <p>
                  Продолжая использовать услуги после вступления изменений в силу, 
                  Вы соглашаетесь с новой редакцией Соглашения.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">10. Контактная информация</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>По всем вопросам, связанным с данным Соглашением, обращайтесь:</p>
                <ul className="list-none space-y-2">
                  <li>📧 Email: support@yourdomain.ru</li>
                  <li>🛡️ Abuse: abuse@yourdomain.ru</li>
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
