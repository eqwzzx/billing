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
                Политика конфиденциальности
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Последнее обновление: 14 июля 2026
              </p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-6">
            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">1. Введение</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Fluxor Hosting Solutions LLC (далее — «Компания», «Мы») серьезно относится к защите 
                  Ваших персональных данных. Настоящая Политика конфиденциальности объясняет, 
                  какие данные мы собираем, как их используем и защищаем.
                </p>
                <p>
                  Используя наш сайт fluxor.host и услуги, Вы соглашаетесь с условиями данной Политики.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">2. Собираемые данные</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">2.1. Личная информация</h3>
                  <p>При регистрации и использовании услуг мы собираем:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Email адрес</li>
                    <li>Имя пользователя</li>
                    <li>Discord ID (при привязке аккаунта)</li>
                    <li>IP-адрес</li>
                    <li>Платежные данные (обрабатываются платежными системами)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">2.2. Технические данные</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Информация о браузере и устройстве</li>
                    <li>Данные об использовании сервиса (логи доступа)</li>
                    <li>Cookie и аналогичные технологии</li>
                    <li>Данные о производительности серверов</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">2.3. Данные серверов</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Файлы и конфигурации серверов</li>
                    <li>Логи серверных приложений</li>
                    <li>Резервные копии</li>
                    <li>Статистика использования ресурсов</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">3. Использование данных</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Мы используем собранные данные для:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Предоставления и улучшения наших услуг</li>
                  <li>Обработки платежей и управления подписками</li>
                  <li>Технической поддержки клиентов</li>
                  <li>Отправки важных уведомлений и обновлений</li>
                  <li>Обеспечения безопасности и предотвращения мошенничества</li>
                  <li>Соблюдения правовых обязательств</li>
                  <li>Анализа использования сервиса для улучшения качества</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">4. Раскрытие данных третьим лицам</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Мы можем передавать Ваши данные:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong className="text-foreground">Платежным системам</strong> — 
                    для обработки платежей (CrystalPay, Heleket и др.)
                  </li>
                  <li>
                    <strong className="text-foreground">Поставщикам инфраструктуры</strong> — 
                    для размещения серверов
                  </li>
                  <li>
                    <strong className="text-foreground">Правоохранительным органам</strong> — 
                    при наличии законного требования
                  </li>
                  <li>
                    <strong className="text-foreground">Партнерам по безопасности</strong> — 
                    для защиты от DDoS и других угроз
                  </li>
                </ul>
                <p className="text-amber-400 font-medium">
                  Мы НЕ продаем и не передаем Ваши персональные данные третьим лицам для маркетинговых целей.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">5. Защита данных</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Для защиты Ваших данных мы применяем:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Шифрование данных при передаче (SSL/TLS)</li>
                  <li>Защищенное хранение паролей (bcrypt хеширование)</li>
                  <li>Регулярные резервные копии</li>
                  <li>Ограниченный доступ сотрудников к данным</li>
                  <li>Мониторинг безопасности и обнаружение аномалий</li>
                  <li>Защита от DDoS атак</li>
                </ul>
                <p>
                  Несмотря на наши усилия, ни один метод передачи данных через Интернет 
                  не является полностью безопасным. Мы рекомендуем использовать надежные пароли 
                  и включать двухфакторную аутентификацию, где это возможно.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">6. Cookie и аналитика</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Мы используем cookie для:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Аутентификации пользователей</li>
                  <li>Сохранения настроек и предпочтений</li>
                  <li>Анализа использования сайта</li>
                  <li>Улучшения функциональности</li>
                </ul>
                <p>
                  Вы можете управлять cookie в настройках браузера, 
                  но это может повлиять на функциональность сайта.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">7. Ваши права</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Вы имеете право:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Получить доступ к своим персональным данным</li>
                  <li>Исправить неточные данные</li>
                  <li>Удалить свой аккаунт и данные</li>
                  <li>Ограничить обработку данных</li>
                  <li>Экспортировать свои данные</li>
                  <li>Отозвать согласие на обработку данных</li>
                  <li>Подать жалобу в надзорный орган</li>
                </ul>
                <p>
                  Для реализации этих прав обращайтесь по адресу: support@yourdomain.ru
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">8. Хранение данных</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Мы храним Ваши данные столько, сколько необходимо для предоставления услуг 
                  и выполнения правовых обязательств:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Данные аккаунта — пока аккаунт активен</li>
                  <li>Финансовые данные — 3 года (требование законодательства)</li>
                  <li>Логи доступа — 30 дней</li>
                  <li>Данные серверов — до их удаления + 7 дней</li>
                </ul>
                <p>
                  После удаления аккаунта Ваши данные будут анонимизированы или удалены 
                  в течение 30 дней, за исключением данных, которые мы обязаны хранить по закону.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">9. Дети</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Наши услуги не предназначены для лиц младше 16 лет. 
                  Если Вам меньше 16 лет, используйте наши услуги только с согласия родителей или опекунов.
                </p>
                <p>
                  Если мы узнаем, что собрали данные ребенка младше 16 лет без согласия родителей, 
                  мы примем меры для удаления этих данных.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">10. Изменения в Политике</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Мы можем обновлять эту Политику конфиденциальности. 
                  О значительных изменениях мы уведомим Вас по электронной почте 
                  или через уведомление на сайте.
                </p>
                <p>
                  Рекомендуем периодически проверять эту страницу на предмет изменений.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">11. Контакты</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>По вопросам конфиденциальности обращайтесь:</p>
                <ul className="list-none space-y-2">
                  <li>📧 Email: support@yourdomain.ru</li>
                  <li>🛡️ Data Protection: privacy@yourdomain.ru</li>
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
