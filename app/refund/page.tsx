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
                Политика возврата средств (Refund Policy)
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Дата вступления в силу: 14 июля 2026 г.
              </p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-6">
            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">1. Общие положения</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Настоящая Политика возврата средств (далее — «Политика») регулирует порядок возврата денежных средств за услуги, предоставляемые Fluxor Hosting Solutions (далее — «Fluxor», «мы», «нас», «наш»).
                </p>
                <p>
                  Оформляя заказ и оплачивая услуги Fluxor, Клиент подтверждает своё согласие с настоящей Политикой.
                </p>
                <p>
                  Настоящая Политика является неотъемлемой частью Публичной оферты и Пользовательского соглашения.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">2. Право на возврат</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Клиент вправе обратиться с запросом на возврат денежных средств в течение 3 (трёх) календарных дней с момента оплаты услуги.
                </p>
                <p>
                  Возврат возможен только при соблюдении всех условий, указанных в настоящей Политике.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">3. Условия возврата</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Возврат денежных средств возможен только при одновременном соблюдении следующих условий:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>услуга была оплачена не более 3 календарных дней назад;</li>
                  <li>услуга не была использована;</li>
                  <li>отсутствуют нарушения Пользовательского соглашения;</li>
                  <li>отсутствуют основания для отказа, предусмотренные настоящей Политикой.</li>
                </ul>
                <p>
                  Если услуга была активирована, использована либо предоставлена Клиенту в полном объёме, возврат денежных средств не производится.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">4. Услуги, не подлежащие возврату</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Возврат денежных средств не производится в отношении:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>использованных услуг;</li>
                  <li>зарегистрированных доменных имён;</li>
                  <li>услуг по продлению доменных имён;</li>
                  <li>лицензий;</li>
                  <li>программного обеспечения третьих лиц;</li>
                  <li>иных услуг, возврат которых невозможен по их характеру.</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">5. Отказ в возврате</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Fluxor вправе отказать в возврате денежных средств в следующих случаях:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>нарушение Пользовательского соглашения;</li>
                  <li>блокировка или прекращение услуги вследствие нарушения условий использования;</li>
                  <li>предоставление недостоверной информации при оформлении запроса;</li>
                  <li>попытка злоупотребления Политикой возврата.</li>
                </ul>
                <p>
                  В случае прекращения либо приостановления услуги из-за нарушения Пользовательского соглашения денежные средства возврату не подлежат.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">6. Порядок подачи запроса</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Для оформления возврата Клиенту необходимо обратиться в службу поддержки Fluxor.</p>
                <p>В запросе рекомендуется указать:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>номер заказа;</li>
                  <li>адрес электронной почты аккаунта;</li>
                  <li>дату оплаты;</li>
                  <li>причину обращения.</li>
                </ul>
                <p>Fluxor вправе запросить дополнительные сведения, необходимые для рассмотрения обращения.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">7. Рассмотрение запроса</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Каждый запрос рассматривается индивидуально.</p>
                <p>После проверки соблюдения условий настоящей Политики Fluxor принимает решение:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>о полном возврате денежных средств;</li>
                  <li>об отказе в возврате.</li>
                </ul>
                <p>О результате рассмотрения Клиент уведомляется по электронной почте либо через личный кабинет.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">8. Способ возврата денежных средств</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Возврат денежных средств осуществляется тем способом, который использовался при оплате, если иное не предусмотрено законодательством либо правилами платёжного провайдера.
                </p>
                <p>
                  Срок поступления денежных средств зависит от выбранной платёжной системы и банка Клиента.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">9. Изменение настоящей Политики</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Fluxor вправе изменять настоящую Политику.</p>
                <p>Новая редакция вступает в силу с момента публикации, если иной срок не указан дополнительно.</p>
                <p>Изменения не распространяются на уже одобренные заявки на возврат.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">10. Контактная информация</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>По вопросам возврата денежных средств вы можете обратиться:</p>
                <ul className="list-none space-y-2">
                  <li>Служба поддержки: support@fluxor.solutions</li>
                  <li>Юридические вопросы: legal@fluxor.solutions</li>
                </ul>
                <p className="mt-4">
                  Оплачивая услуги Fluxor Hosting Solutions, вы подтверждаете, что ознакомились с настоящей Политикой возврата средств и соглашаетесь с её условиями.
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
