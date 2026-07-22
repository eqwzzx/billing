#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки SMTP
 * 
 * Использование:
 *   node test-smtp.js
 *   node test-smtp.js test@example.com
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = process.argv[2] || 'test@example.com';

console.log('🧪 Тест SMTP конфигурации\n');
console.log('═══════════════════════════════════════\n');

// Показать текущую конфигурацию (без пароля)
console.log('📋 Текущая конфигурация:');
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'не установлен'}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 'не установлен'}`);
console.log(`   SMTP_SECURE: ${process.env.SMTP_SECURE || 'не установлен'}`);
console.log(`   SMTP_USER: ${process.env.SMTP_USER || '(пусто)'}`);
console.log(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '***установлен***' : '(пусто)'}`);
console.log(`   SMTP_FROM: ${process.env.SMTP_FROM || 'не установлен'}`);
console.log(`   Получатель: ${testEmail}`);
console.log('\n═══════════════════════════════════════\n');

// Проверка наличия обязательных переменных
if (!process.env.SMTP_HOST) {
  console.error('❌ Ошибка: SMTP_HOST не установлен в .env');
  process.exit(1);
}

if (!process.env.SMTP_FROM) {
  console.error('❌ Ошибка: SMTP_FROM не установлен в .env');
  process.exit(1);
}

// Создание транспорта
const transportConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  debug: true,  // Включить debug
  logger: true, // Включить логирование
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false
  }
};

// Добавить auth если есть USER
if (process.env.SMTP_USER) {
  transportConfig.auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  };
}

console.log('🔌 Создание SMTP транспорта...\n');

const transporter = nodemailer.createTransport(transportConfig);

// Проверка подключения
console.log('🔍 Проверка подключения к SMTP серверу...\n');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Ошибка подключения к SMTP серверу:\n');
    console.error(error);
    console.log('\n═══════════════════════════════════════');
    console.log('💡 Рекомендации:');
    console.log('   1. Проверьте, что SMTP_SECURE=false для порта 587');
    console.log('   2. Убедитесь, что Postfix запущен: systemctl status postfix');
    console.log('   3. Проверьте логи: tail -f /var/log/mail.log');
    console.log('   4. Смотрите полную документацию: SMTP_FIX_GUIDE.md');
    console.log('═══════════════════════════════════════\n');
    process.exit(1);
  } else {
    console.log('✅ Подключение к SMTP серверу успешно!\n');
    console.log('═══════════════════════════════════════\n');
    
    // Отправка тестового письма
    console.log('📧 Отправка тестового письма...\n');
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: testEmail,
      subject: '🧪 Тест SMTP - ' + new Date().toLocaleString(),
      text: 'Это тестовое письмо из вашего SMTP сервера.\n\nЕсли вы получили это письмо, значит SMTP работает корректно!',
      html: `
        <h2>🧪 Тест SMTP</h2>
        <p>Это тестовое письмо из вашего SMTP сервера.</p>
        <p><strong>Если вы получили это письмо, значит SMTP работает корректно!</strong></p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Отправлено: ${new Date().toLocaleString()}<br>
          Сервер: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}
        </p>
      `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Ошибка отправки письма:\n');
        console.error(error);
        console.log('\n═══════════════════════════════════════');
        console.log('💡 Рекомендации:');
        console.log('   1. Проверьте настройки SMTP в .env');
        console.log('   2. Проверьте логи Postfix: tail -f /var/log/mail.log');
        console.log('   3. Проверьте очередь: mailq');
        console.log('   4. Смотрите полную документацию: SMTP_FIX_GUIDE.md');
        console.log('═══════════════════════════════════════\n');
        process.exit(1);
      } else {
        console.log('✅ Письмо успешно отправлено!\n');
        console.log('═══════════════════════════════════════');
        console.log('📬 Информация об отправке:');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        if (info.accepted && info.accepted.length > 0) {
          console.log(`   Принято: ${info.accepted.join(', ')}`);
        }
        if (info.rejected && info.rejected.length > 0) {
          console.log(`   Отклонено: ${info.rejected.join(', ')}`);
        }
        console.log('═══════════════════════════════════════\n');
        console.log('🎉 Тест завершен успешно!');
        console.log('💡 Проверьте почтовый ящик:', testEmail);
        console.log('\n');
        process.exit(0);
      }
    });
  }
});
