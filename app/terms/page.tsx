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
                Пользовательское соглашение (Terms of Service)
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
                  Настоящее Пользовательское соглашение (далее — «Соглашение», «Условия») регулирует порядок использования услуг, предоставляемых Fluxor Hosting Solutions (далее — «Fluxor», «мы», «нас», «наш»).
                </p>
                <p>
                  Используя сайт, создавая аккаунт, оформляя заказ или пользуясь любой услугой Fluxor, вы подтверждаете, что ознакомились с настоящим Соглашением, понимаете его содержание и соглашаетесь соблюдать все его положения.
                </p>
                <p>
                  Если вы не согласны с настоящим Соглашением полностью или частично, вы обязаны прекратить использование наших услуг.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">2. Предоставляемые услуги</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Fluxor предоставляет услуги, включая, но не ограничиваясь:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>хостинг игровых серверов;</li>
                  <li>виртуальные серверы (VDS/VPS);</li>
                  <li>выделенные серверы;</li>
                  <li>регистрацию и обслуживание доменных имён;</li>
                  <li>другие услуги, которые могут быть добавлены в будущем.</li>
                </ul>
                <p>
                  Настоящее Соглашение распространяется на все текущие и будущие услуги Fluxor, если для отдельных услуг не опубликованы специальные условия.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">3. Аккаунт клиента</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  3.1. Клиент самостоятельно несёт ответственность за безопасность своего аккаунта, включая сохранность логина, пароля, API-ключей и иных данных доступа.
                </p>
                <p>3.2. Аккаунты запрещается:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>продавать;</li>
                  <li>передавать другим лицам;</li>
                  <li>дарить;</li>
                  <li>обменивать;</li>
                  <li>использовать совместно несколькими лицами без разрешённых механизмов управления.</li>
                </ul>
                <p>
                  3.3. Клиент вправе предоставить доступ к управлению своими услугами другим пользователям через предусмотренные Fluxor механизмы. При этом Клиент остаётся полностью ответственным за все действия таких пользователей.
                </p>
                <p>
                  3.4. При обнаружении подозрительной активности либо несанкционированного доступа Клиент обязан незамедлительно сообщить об этом службе поддержки.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">4. Допустимое использование услуг</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>При использовании услуг Fluxor запрещается:</p>
                <p>4.1. Размещать, хранить или распространять порнографические материалы.</p>
                <p>4.2. Использовать услуги для фишинга, создания поддельных сайтов, страниц авторизации, писем либо иных способов получения чужих данных обманным путём.</p>
                <p>4.3. Использовать услуги для деятельности, нарушающей законодательство государства, в котором физически размещён сервер.</p>
                <p>4.4. Совершать действия, способные нарушить работу инфраструктуры Fluxor или нанести ущерб другим клиентам, включая:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>DoS-атаки;</li>
                  <li>DDoS-атаки;</li>
                  <li>попытки взлома;</li>
                  <li>сканирование чужих систем;</li>
                  <li>распространение вредоносного программного обеспечения;</li>
                  <li>рассылку спама;</li>
                  <li>несанкционированный майнинг;</li>
                  <li>злоупотребление вычислительными ресурсами;</li>
                  <li>любые действия, угрожающие стабильности сети.</li>
                </ul>
                <p>
                  Перечень запрещённых действий не является исчерпывающим. Fluxor вправе самостоятельно определять, нарушает ли конкретная деятельность настоящее Соглашение.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">5. Нарушение условий</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>При выявлении нарушений Fluxor вправе без предварительного уведомления:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>временно приостановить предоставление услуги;</li>
                  <li>полностью прекратить предоставление услуги;</li>
                  <li>удалить запрещённый контент;</li>
                  <li>ограничить доступ к отдельным сервисам;</li>
                  <li>окончательно заблокировать аккаунт Клиента при серьёзных либо повторных нарушениях;</li>
                  <li>передать информацию компетентным государственным органам в случаях, предусмотренных законодательством.</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">6. Обязанности клиента</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Клиент самостоятельно отвечает за:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>законность размещаемого контента;</li>
                  <li>содержание своих серверов;</li>
                  <li>своевременное создание резервных копий;</li>
                  <li>безопасность собственных серверов;</li>
                  <li>установку обновлений;</li>
                  <li>использование надёжных паролей;</li>
                  <li>контроль доступа к своим услугам;</li>
                  <li>действия пользователей, которым был предоставлен доступ.</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">7. Резервное копирование</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Создание резервных копий полностью является обязанностью Клиента.</p>
                <p>Fluxor не гарантирует наличие резервных копий, их актуальность, сохранность либо возможность восстановления, даже если резервное копирование выполняется в технических целях.</p>
                <p>Fluxor не несёт ответственности за потерю данных независимо от причин возникновения такой потери.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">8. Доменные имена</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Регистрация доменных имён осуществляется исключительно при условии их доступности на момент регистрации.</p>
                <p>Fluxor не гарантирует возможность регистрации конкретного доменного имени до завершения процедуры регистрации.</p>
                <p>Клиент самостоятельно отвечает за своевременное продление доменных имён.</p>
                <p>Fluxor не несёт ответственности за утрату доменного имени вследствие его непродления.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">9. Приостановка услуг</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>При отсутствии своевременной оплаты Fluxor вправе временно приостановить предоставление услуги либо полностью прекратить её предоставление.</p>
                <p>После истечения разумного срока хранения данных Fluxor вправе удалить данные приостановленной услуги без возможности восстановления.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">10. Изменение настоящего Соглашения</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Fluxor вправе изменять настоящее Соглашение в любое время.</p>
                <p>О существенных изменениях Клиенты уведомляются не позднее чем за 30 календарных дней до даты их вступления в силу посредством электронной почты, личного кабинета либо иных доступных способов уведомления.</p>
                <p>Изменения, не затрагивающие права и обязанности Клиентов (исправление ошибок, уточнение формулировок и аналогичные изменения), вступают в силу с момента публикации.</p>
                <p>Продолжение использования услуг после вступления изменений в силу означает согласие Клиента с новой редакцией Соглашения.</p>
                <p>Если Клиент не согласен с изменениями, он обязан прекратить использование услуг.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">11. Контактная информация</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>По всем вопросам, связанным с использованием услуг Fluxor, можно обратиться:</p>
                <ul className="list-none space-y-2">
                  <li>Служба поддержки: support@fluxor.solutions</li>
                  <li>Сообщения о нарушениях (Abuse): abuse@fluxor.solutions</li>
                  <li>Юридические вопросы: legal@fluxor.solutions</li>
                </ul>
                <p className="mt-4">Используя услуги Fluxor Hosting Solutions, вы подтверждаете своё согласие с настоящим Пользовательским соглашением.</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
