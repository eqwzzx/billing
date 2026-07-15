import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Shield } from "lucide-react"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="px-4 py-24 sm:px-8 md:px-16 lg:px-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Политика конфиденциальности (Privacy Policy)
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
                  Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок сбора, обработки, хранения, использования и защиты персональных данных пользователей услуг Fluxor Hosting Solutions (далее — «Fluxor», «мы», «нас», «наш»).
                </p>
                <p>
                  Используя сайт, создавая аккаунт, оформляя заказ или пользуясь услугами Fluxor, вы подтверждаете своё согласие с настоящей Политикой.
                </p>
                <p>
                  Настоящая Политика является неотъемлемой частью Пользовательского соглашения и Публичной оферты.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">2. Какие данные мы собираем</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>В зависимости от используемых услуг Fluxor может собирать следующие категории данных.</p>
                
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">2.1. Данные аккаунта</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>имя, фамилия или наименование организации;</li>
                    <li>адрес электронной почты;</li>
                    <li>пароль (хранится исключительно в виде криптографического хэша);</li>
                    <li>контактные данные, предоставленные пользователем добровольно (номер телефона, страна и другие сведения).</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">2.2. Платёжные данные</h3>
                  <p>Мы можем хранить:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>историю заказов;</li>
                    <li>историю платежей;</li>
                    <li>сумму оплаты;</li>
                    <li>дату оплаты;</li>
                    <li>используемый способ оплаты;</li>
                    <li>сведения, необходимые для выставления счетов.</li>
                  </ul>
                  <p className="mt-2">Полные реквизиты банковских карт Fluxor не хранит. Все платежи обрабатываются сторонними платёжными провайдерами.</p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">2.3. Технические данные</h3>
                  <p>Для обеспечения безопасности и стабильной работы сервисов мы можем автоматически собирать:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>IP-адреса;</li>
                    <li>дату и время входа;</li>
                    <li>журналы действий в панели управления;</li>
                    <li>User-Agent;</li>
                    <li>сведения об используемом устройстве;</li>
                    <li>сведения о браузере;</li>
                    <li>технические журналы работы сервисов.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">2.4. Данные при регистрации доменов</h3>
                  <p>
                    При регистрации доменного имени необходимые сведения могут передаваться регистратору или соответствующему реестру доменной зоны.
                  </p>
                  <p>
                    Передаваемые данные определяются требованиями конкретного регистратора или правилами доменной зоны.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">2.5. Переписка со службой поддержки</h3>
                  <p>При обращении в службу поддержки мы можем хранить:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>содержание переписки;</li>
                    <li>прикреплённые файлы;</li>
                    <li>сведения, добровольно предоставленные пользователем.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">2.6. Данные, размещённые на серверах</h3>
                  <p>Fluxor не осуществляет постоянный мониторинг содержимого серверов клиентов.</p>
                  <p>Доступ к данным возможен исключительно:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>по запросу самого Клиента;</li>
                    <li>при расследовании нарушений Пользовательского соглашения;</li>
                    <li>при исполнении требований законодательства;</li>
                    <li>при устранении технических неисправностей, если это необходимо для оказания поддержки.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">3. Цели обработки данных</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Персональные данные используются исключительно для:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>создания и обслуживания аккаунта;</li>
                  <li>предоставления заказанных услуг;</li>
                  <li>регистрации доменных имён;</li>
                  <li>обработки платежей;</li>
                  <li>выставления счетов;</li>
                  <li>оказания технической поддержки;</li>
                  <li>обеспечения безопасности сервисов;</li>
                  <li>предотвращения мошенничества и злоупотреблений;</li>
                  <li>выполнения требований законодательства;</li>
                  <li>уведомления пользователей об изменениях услуг, тарифов и документов;</li>
                  <li>отправки информационных и маркетинговых сообщений (только при наличии согласия пользователя).</li>
                </ul>
                <p>Пользователь вправе отказаться от получения маркетинговых сообщений в любое время.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">4. Передача данных третьим лицам</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Fluxor не продаёт и не передаёт персональные данные пользователей третьим лицам, за исключением случаев, необходимых для оказания услуг.</p>
                <p>Передача данных возможна:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>платёжным провайдерам;</li>
                  <li>регистраторам доменных имён;</li>
                  <li>реестрам доменных зон;</li>
                  <li>дата-центрам;</li>
                  <li>техническим подрядчикам;</li>
                  <li>государственным органам — при наличии законного требования;</li>
                  <li>иным лицам — только с согласия пользователя.</li>
                </ul>
                <p>Все подрядчики обязаны обеспечивать защиту персональных данных в объёме, необходимом для исполнения своих обязательств.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">5. Хранение и защита данных</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Fluxor принимает разумные технические и организационные меры для защиты персональных данных.</p>
                <p>В частности используются:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>защищённое соединение (TLS);</li>
                  <li>хэширование паролей;</li>
                  <li>ограничение доступа сотрудников;</li>
                  <li>журналирование действий;</li>
                  <li>иные меры обеспечения безопасности.</li>
                </ul>
                <p>Данные аккаунта могут храниться в течение срока существования аккаунта и после его удаления в течение срока, необходимого для исполнения требований законодательства.</p>
                <p>Технические журналы хранятся ограниченный период времени и впоследствии удаляются либо обезличиваются.</p>
                <p>Несмотря на принимаемые меры, ни один способ передачи либо хранения информации не может гарантировать абсолютную безопасность.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">6. Права пользователя</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>В зависимости от применимого законодательства пользователь вправе:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>запросить информацию о своих персональных данных;</li>
                  <li>получить доступ к своим данным;</li>
                  <li>потребовать исправления неточных сведений;</li>
                  <li>потребовать удаления данных, если их хранение больше не требуется по закону;</li>
                  <li>ограничить обработку данных;</li>
                  <li>возразить против обработки данных;</li>
                  <li>получить свои данные в машиночитаемом формате;</li>
                  <li>отозвать ранее предоставленное согласие на обработку данных;</li>
                  <li>обратиться в уполномоченный орган по защите персональных данных.</li>
                </ul>
                <p>Для реализации своих прав пользователь может обратиться по адресу: legal@fluxor.solutions</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">7. Файлы Cookie</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Fluxor использует файлы Cookie и аналогичные технологии для:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>авторизации пользователей;</li>
                  <li>поддержания активной сессии;</li>
                  <li>сохранения пользовательских настроек;</li>
                  <li>повышения удобства использования сайта;</li>
                  <li>анализа использования сайта в обобщённом виде.</li>
                </ul>
                <p>Пользователь может изменить параметры использования Cookie в настройках своего браузера.</p>
                <p>Отключение обязательных Cookie может привести к ограничению работы отдельных функций сайта.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">8. Данные несовершеннолетних</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Услуги Fluxor не предназначены для лиц, которые не достигли возраста, позволяющего самостоятельно заключать договоры в соответствии с применимым законодательством.
                </p>
                <p>
                  Fluxor сознательно не собирает персональные данные таких лиц.
                </p>
                <p>
                  Если станет известно, что несовершеннолетний предоставил свои данные без необходимого согласия, такие данные будут удалены в разумный срок.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">9. Международная передача данных</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Серверы Fluxor и серверы наших подрядчиков могут располагаться в различных странах.
                </p>
                <p>
                  Заказывая услуги, пользователь соглашается с тем, что его персональные данные могут обрабатываться в стране расположения соответствующей инфраструктуры с соблюдением применимого законодательства.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">10. Изменение Политики</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Fluxor вправе изменять настоящую Политику конфиденциальности.</p>
                <p>О существенных изменениях пользователи уведомляются не менее чем за 30 календарных дней до даты их вступления в силу.</p>
                <p>Изменения редакционного характера или изменения, не затрагивающие права пользователей, вступают в силу с момента публикации.</p>
                <p>Продолжение использования услуг после вступления изменений означает согласие пользователя с новой редакцией Политики.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">11. Контактная информация</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>По вопросам обработки персональных данных можно обратиться:</p>
                <ul className="list-none space-y-2">
                  <li>Служба поддержки: support@fluxor.solutions</li>
                  <li>Сообщения о нарушениях (Abuse): abuse@fluxor.solutions</li>
                  <li>Юридические вопросы: legal@fluxor.solutions</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
