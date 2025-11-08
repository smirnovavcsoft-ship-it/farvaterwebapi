// global-setup.ts
import { APIRequestContext, chromium, expect } from '@playwright/test'; // 💡 Добавили APIRequestContext
import { request as playwrightRequest } from 'playwright';
import path from 'path';
import * as dotenv from 'dotenv'; 
import fs from 'fs';




// Загрузка переменных окружения
dotenv.config();

// ... (остальной LOGIN_PAYLOAD) ...

const LOGIN_PAYLOAD = {
     username: 'SYSADMIN', 
     password: '', // 
     grant_type: 'password',
     client_id: 'Web', 
};

async function globalSetup() {
    
    // 1. 🛑 ИСПРАВЛЕНИЕ: Используем 'chromium.request.newContext()' напрямую 
    const requestContext: APIRequestContext = await playwrightRequest.newContext({
        // 💡 Здесь можно указать baseURL, чтобы не повторять его в post-запросе
        baseURL: 'https://farvater.mcad.dev/', 
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

    await requestContext.storageState({ path: 'auth/user.json' });

    // 3. Сохраняем токен
    const responseBody = await response.json();
    const accessToken = responseBody.access_token;
    
    process.env.ACCESS_TOKEN = accessToken;

    fs.writeFileSync('.env', `ACCESS_TOKEN=${accessToken}`);
    
    console.log(`✅ Access Token obtained and saved to environment.`);

    console.log(`✅ Authentication state (including cookies) saved to auth/user.json.`);


    if (response.status() !== 200) {
        const errorBody = await response.text();
        
        // 🚨 КРИТИЧЕСКОЕ ЛОГИРОВАНИЕ: Теперь мы увидим точную причину сбоя
        console.error(`\n======================================================`);
        console.error(`🚨 СБОЙ АВТОРИЗАЦИИ В global-setup.ts`);
        console.error(`🚨 Запрос URL: ${response.url()}`);
        console.error(`🚨 Статус ответа: ${response.status()}`);
        console.error(`🚨 Тело ответа при ошибке: ${errorBody}`);
        console.error(`======================================================\n`);
        
        throw new Error(`Global setup failed: Could not authenticate. Status: ${response.status()}, Body: ${errorBody}`);
    }
}



export default globalSetup;