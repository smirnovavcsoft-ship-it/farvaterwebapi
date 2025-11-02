// global-setup.ts
import { APIRequestContext, chromium, expect } from '@playwright/test'; // 💡 Добавили APIRequestContext
import * as dotenv from 'dotenv'; 

// Загрузка переменных окружения
dotenv.config();

// ... (остальной LOGIN_PAYLOAD) ...

async function globalSetup() {
    
    // 1. 🛑 ИСПРАВЛЕНИЕ: Используем 'chromium.request.newContext()' напрямую 
    const requestContext: APIRequestContext = await chromium.request.newContext({
        // 💡 Здесь можно указать baseURL, чтобы не повторять его в post-запросе
        baseURL: 'https://fairvater.mcad.dev/fairvater/', 
    });
    
    // 2. Отправляем запрос на аутентификацию
    // URL теперь короче, т.к. baseURL установлен выше
    const response = await requestContext.post('/token?authType=TDMS', { 
        form: LOGIN_PAYLOAD,
    });

    if (response.status() !== 200) {
        const errorBody = await response.text();
        throw new Error(`Global setup failed: Could not authenticate. Status: ${response.status()}, Body: ${errorBody}`);
    }

    // 3. Сохраняем токен
    const responseBody = await response.json();
    const accessToken = responseBody.access_token;
    
    process.env.ACCESS_TOKEN = accessToken;
    
    console.log(`✅ Access Token obtained and saved to environment.`);
}

export default globalSetup;