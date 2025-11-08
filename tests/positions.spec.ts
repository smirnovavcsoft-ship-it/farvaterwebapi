// tests/positions.spec.ts
import { test, expect, APIRequestContext } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid'; // Для уникальных кодов
import * as dotenv from 'dotenv';
dotenv.config();
const accessToken = process.env.ACCESS_TOKEN;
console.log('🔑 Loaded token:', accessToken);




// 💡 Загружаем токен из переменной окружения, установленной в global-setup.ts
//const accessToken = process.env.ACCESS_TOKEN; 
// 🛑 Эндпоинт для должностей (из DevTools)
const POSITIONS_URL = '/api/farvater/data/v1/positions'; 

// --- Данные для тестирования ---
const TARGET_POSITION_NAME = 'Тестировщик';
const TARGET_POSITION_CODE = 'TESTER_DEF';

const PERMANENT_POSITION_PAYLOAD = {
    Name: TARGET_POSITION_NAME,
    Code: TARGET_POSITION_CODE,
    // Используем 'description' для проверки в теле POST запроса
    description: 'Постоянная должность для автоматизации',
    // Добавьте другие обязательные поля, если они есть
};

// Временная должность, которую мы удалим
const TEMP_POSITION_PAYLOAD = {
    // 💡 ИСПОЛЬЗУЕМ ТОЛЬКО description
    description: `Временная должность для теста ${uuidv4().substring(0, 8)}`, 
};
// ------------------------------

if (!accessToken) {
    throw new Error('ACCESS_TOKEN не установлен. Убедитесь, что global-setup.ts отработал.');
}

// ----------------------------------------------------
// 🚀 ТЕСТОВЫЙ СЦЕНАРИЙ: Условное управление должностями
// ----------------------------------------------------

test.describe('Positions API Conditional Testing', () => {

    let request: APIRequestContext;

    // Авторизуем все запросы в этом блоке
    test.beforeAll(async ({ playwright, baseURL }) => {
        request = await playwright.request.newContext({
            extraHTTPHeaders: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            baseURL: baseURL,
        });
    });

    test('should conditionally create or manage the target position "Тестировщик"', async () => {
        let positionIdToDelete: string | null = null;
        
        // --- 1. GET: Получить все должности ---
        const getResponse = await request.get(POSITIONS_URL);
        expect(getResponse.status()).toBe(200);

        const allPositions = await getResponse.json();
        
        // --- 2. Check: Проверить существование целевой должности по 'description' или 'code' ---
        const targetPosition = allPositions.find(
            (p: any) => p.description === TARGET_POSITION_NAME || p.code === TARGET_POSITION_CODE
        );
        // Примечание: В ответе поле должности называется 'description'.

        if (targetPosition) {
            // --- СЦЕНАРИЙ 1: Должность "Тестировщик" СУЩЕСТВУЕТ ---
            console.log(`\nДолжность '${TARGET_POSITION_NAME}' уже существует. Создаем и удаляем временную.`);
            
            // 2.1 POST: Создание временной должности
            const createTempResponse = await request.post(POSITIONS_URL, {
                data: TEMP_POSITION_PAYLOAD,
            });
            
            expect(createTempResponse.status()).toBe(200); // Ожидаем 200 Created

            const tempPosition = await createTempResponse.json();
            // ID в ответе на POST часто называется 'Id' или 'id'
            positionIdToDelete = tempPosition.Id || tempPosition.id;

            // 2.2 DELETE: Удаление временной должности (Cleanup)
            if (positionIdToDelete) {
                const deleteResponse = await request.delete(`${POSITIONS_URL}/${positionIdToDelete}`);
                // Ожидаем 200 OK или 204 No Content
                expect(deleteResponse.status()).toBeGreaterThanOrEqual(200); 
                expect(deleteResponse.status()).toBeLessThan(205); 
                
                console.log(`✅ Временная должность ID:${positionIdToDelete} успешно создана и удалена.`);
            } else {
                throw new Error("Не удалось получить ID временной должности для удаления.");
            }

        } else {
            // --- СЦЕНАРИЙ 2: Должности "Тестировщик" НЕТ ---
            console.log(`\nДолжность '${TARGET_POSITION_NAME}' не найдена. Создаем постоянную.`);
            
            // 3.1 POST: Создание постоянной должности
            const createPermanentResponse = await request.post(POSITIONS_URL, {
                data: PERMANENT_POSITION_PAYLOAD,
            });

            const createTempResponse = await request.post(POSITIONS_URL, {
            data: TEMP_POSITION_PAYLOAD,
            });

            // >>> ДОБАВЛЯЕМ ЛОГИРОВАНИЕ ОШИБКИ 400/200 <<
            if (createTempResponse.status() !== 201) {
                const status = createTempResponse.status();
                const errorBody = await createTempResponse.text();
                
                console.error(`\n🚨 ОШИБКА POST-запроса: Статус ${status} (Ожидался 201)`);
                console.error(`   Тело ответа при ошибке: ${errorBody.substring(0, 500)}...`); // Ограничим длину

                // Для случаев, когда приходит 200, но ожидается 201, мы можем просто принять 200/201
                // (см. Шаг 3). Если приходит 400, тело ответа скажет вам, какое поле неверно.
            }
            // >>> КОНЕЦ ЛОГИРОВАНИЯ ОШИБКИ <<

            expect(createPermanentResponse.status()).toBe(200); // Ожидаем 200 Created

            const newPermanentPosition = await createPermanentResponse.json();
            
            // Проверка, что должность создана
            expect(newPermanentPosition).toHaveProperty('Id');
            // Проверка по полю, которое вы отправляли
            expect(newPermanentPosition.description).toBe(PERMANENT_POSITION_PAYLOAD.description); 

            console.log(`✅ Постоянная должность ID:${newPermanentPosition.Id} успешно создана.`);
        }
    });
});