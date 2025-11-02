// tests/auth.spec.ts
import { test, expect } from '@playwright/test';

// Определяем данные для входа
const LOGIN_PAYLOAD = {
    username: 'SYSADMIN', // 
    password: '',
    grant_type: 'password',
    client_id: 'Web', 
    authType : 'TDMS',
};

test.describe('Authentication API Tests', () => {

    test('Successful Login should return a valid token', async ({ request }) => {
        
        // 1. Отправка POST-запроса на Login
        const response = await request.post('/token?authType=TDMS', {
            form: LOGIN_PAYLOAD,
            headers: {
            //'Authorization': `Basic ${Buffer.from('YOUR_CLIENT_ID:YOUR_CLIENT_SECRET').toString('base64')}`,
            //'authType' : 'TDMS',
            'Accept': 'application/json; charset=utf-8',
            //'Content-Type': 'application/x-www-form-urlencoded',
            //'grant_type': 'LOGIN_PAYLOAD.grant_type', 
            //'client_id': 'LOGIN_PAYLOAD.client_id',
            //'X-Custom-Header': 'RequiredValue', // <-- ПРИМЕР: если требуется
            },
            // Playwright автоматически устанавливает Content-Type: application/json
            // при использовании 'data', но вы можете добавить заголовки вручную, если нужно:
            // headers: { 'Content-Type': 'application/json' }
        });

        // 2. Проверка HTTP-статуса
        expect(response.status()).toBe(200);

        // 3. Получение тела ответа в формате JSON
        const responseBody = await response.json();

        // 4. Проверка наличия и структуры токена
        expect(responseBody).toHaveProperty('access_token');
        expect(typeof responseBody.access_token).toBe('string');
        expect(responseBody.access_token.length).toBeGreaterThan(10); // Проверка, что токен не пуст

        // Опционально: проверить другие поля
        expect(responseBody).toHaveProperty('username');
    });

    test('Failed Login should return 400 Unauthorized', async ({ request }) => {
        
        // Попытка входа с неверными данными
        const response = await request.post('token?authType=TDMS', {
         form: {
             username: 'non_existent_user', // Неверный пользователь
            password: 'wrong_password', // Неверный пароль
                // 🛑 ОБЯЗАТЕЛЬНЫЕ ПАРАМЕТРЫ ДЛЯ ПРИЛОЖЕНИЯ ДОЛЖНЫ БЫТЬ ПРАВИЛЬНЫМИ!
                grant_type: LOGIN_PAYLOAD.grant_type, 
                client_id: LOGIN_PAYLOAD.client_id,
                //client_secret: LOGIN_PAYLOAD.client_secret,
                 },
                });

        // Ожидаем статус 401 (Unauthorized) или другой код ошибки, принятый вашим API
        expect(response.status()).toBe(400);
        
        // Опционально: проверить, что ответ содержит сообщение об ошибке
        // const responseBody = await response.json();
        // expect(responseBody.message).toContain('Invalid credentials'); 
    });
});