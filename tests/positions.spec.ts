// tests/positions.spec.ts
import { test, expect, APIRequestContext } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid'; // Для уникальных кодов
import * as dotenv from 'dotenv';

// ----------------------------------------------------
// ⚠️ КОНФИГУРАЦИЯ И ПЕРЕМЕННЫЕ СОСТОЯНИЯ
// ----------------------------------------------------

// Загрузка .env 
dotenv.config(); 
const accessToken = process.env.ACCESS_TOKEN;
console.log('🔑 Loaded token:', accessToken);

// 🛑 Эндпоинт для должностей
const POSITIONS_URL = '/api/farvater/data/v1/positions'; 

// --- Данные для тестирования ---
const TARGET_POSITION_NAME = 'Тестировщик';
//const TARGET_POSITION_CODE = 'TESTER_DEF';

const PERMANENT_POSITION_PAYLOAD = {
    // В успешном запросе из DevTools было только description. 
    // Если Name и Code обязательны, добавьте их обратно.
    description: TARGET_POSITION_NAME, 
};

// Временная должность, которую мы удаляем сразу в тесте (если целевая существует)
const TEMP_POSITION_PAYLOAD = {
    description: `Временная должность для теста ${uuidv4().substring(0, 8)}`, 
};
// ------------------------------

if (!accessToken) {
    throw new Error('ACCESS_TOKEN не установлен. Убедитесь, что global-setup.ts отработал.');
}

// 💡 Глобальные переменные для использования в хуках
let request: APIRequestContext;
// ID постоянной должности, созданной в Scenario 2, которую нужно удалить в afterAll
let permanentPositionIdToClean: string | null = null; 

// ----------------------------------------------------
// 🚀 ТЕСТОВЫЙ СЦЕНАРИЙ: Условное управление должностями
// ----------------------------------------------------

test.describe('Positions API Conditional Testing', () => {

    // 1. 🎣 Хук: Настройка контекста и авторизации (Выполняется 1 раз перед всеми тестами)
    test.beforeAll(async ({ playwright, baseURL }) => {
        request = await playwright.request.newContext({
            extraHTTPHeaders: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            baseURL: baseURL,
        });
    });

    // 🧪 Основной тест
    test('should conditionally create or manage the target position "Тестировщик"', async () => {
        
        // --- 1. GET: Получить все должности ---
        const getResponse = await request.get(POSITIONS_URL);
        expect(getResponse.status()).toBe(200);

        const allPositions = await getResponse.json();
        
        // --- 2. Check: Проверить существование целевой должности ---
        const targetPosition = allPositions.find(
            (p: any) => p.description === TARGET_POSITION_NAME //|| p.code === TARGET_POSITION_CODE
        );

        if (targetPosition) {
            // --- СЦЕНАРИЙ 1: Должность "Тестировщик" СУЩЕСТВУЕТ (Создаем и удаляем временную) ---
            console.log(`\nДолжность '${TARGET_POSITION_NAME}' уже существует. Создаем и удаляем временную.`);
            
            // 2.1 POST: Создание временной должности
            const createTempResponse = await request.post(POSITIONS_URL, {
                data: TEMP_POSITION_PAYLOAD,
            });
            
            expect(createTempResponse.status()).toBe(200); // Ожидаем 200 OK

            const tempPosition = await createTempResponse.json();
            const tempIdToDelete = tempPosition.Id || tempPosition.id; // Локальный ID для немедленной очистки

            // 2.2 DELETE: Удаление временной должности (Cleanup)
            if (tempIdToDelete) {
                const deleteResponse = await request.delete(`${POSITIONS_URL}/${tempIdToDelete}`);
                // Ожидаем 200 OK или 204 No Content
                expect(deleteResponse.status()).toBeGreaterThanOrEqual(200); 
                expect(deleteResponse.status()).toBeLessThan(205); 
                
                console.log(`✅ Временная должность ID:${tempIdToDelete} успешно создана и удалена.`);
            } else {
                throw new Error("Не удалось получить ID временной должности для удаления.");
            }

        } else {
            // --- СЦЕНАРИЙ 2: Должности "Тестировщик" НЕТ (Создаем постоянную) ---
            console.log(`\nДолжность '${TARGET_POSITION_NAME}' не найдена. Создаем постоянную.`);
            
            // 3.1 POST: Создание постоянной должности
            const createPermanentResponse = await request.post(POSITIONS_URL, {
                data: PERMANENT_POSITION_PAYLOAD,
            });

            expect(createPermanentResponse.status()).toBe(200); // Ожидаем 200 OK

            const newPermanentPosition = await createPermanentResponse.json();
            
            // 💾 СОХРАНЯЕМ ID для очистки в afterAll
            permanentPositionIdToClean = newPermanentPosition.Id || newPermanentPosition.id;
            
            // Проверка, что должность создана
            expect(permanentPositionIdToClean).toBeTruthy();
            expect(newPermanentPosition.description).toBe(PERMANENT_POSITION_PAYLOAD.description); 

            console.log(`✅ Постоянная должность ID:${permanentPositionIdToClean} успешно создана.`);
        }
    });

    // 3. 🧹 Хук: Очистка (Выполняется 1 раз после всех тестов)
    test.afterAll(async () => {
        
        // 3.1 Удаление контекста запроса
        if (request) {
            await request.dispose(); 
        }

        // 3.2 Удаление ПОСТОЯННОЙ должности, созданной в Scenario 2
        if (permanentPositionIdToClean) {
            console.log(`\n🧹 Очистка: Удаление постоянной должности с ID: ${permanentPositionIdToClean}`);
            
            const deleteResponse = await request.delete(`${POSITIONS_URL}/${permanentPositionIdToClean}`);
            
            if (deleteResponse.status() === 200 || deleteResponse.status() === 204) {
                 console.log(`✅ Постоянная должность ${permanentPositionIdToClean} успешно удалена.`);
            } else {
                 const errorBody = await deleteResponse.text();
                 console.error(`❌ Ошибка при удалении постоянной должности. Статус: ${deleteResponse.status()}. Тело: ${errorBody.substring(0, 200)}...`);
            }
        }
    });
});