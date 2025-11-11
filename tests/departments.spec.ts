//tests/departments.spec.ts
import { test, expect, APIRequestContext } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid'; //Для уникальных кодов
import * as dotenv from 'dotenv';

//---------------------------------------------------------
// КОНФИГУРАЦИЯ И ПЕРЕМЕННЫЕ СОСТОЯНИЯ
//------------------------------------------

// Загрузка .env 
dotenv.config();
const accessToken = process.env.ACCESS_TOKEN;
console.log('Loaded token', accessToken);

// Эндпойнт для подразделений
const DEPARTMENTS_URL = '/api/farvater/data/v1/departments';

// Данные для тестирования
const TARGET_DEPARTMENT_NAME = 'Отдел архитектуры и градостроительства';
const TARGET_DEPARTMENT_CODE = 'ОАГ'

const PERMANENT_DEPARTMENT_PAYLOAD = {
    description: TARGET_DEPARTMENT_NAME,
    code: TARGET_DEPARTMENT_CODE,
};

const TEMP_DEPARTMENT_PAYLOAD = {
    description: `Временное наименование подразделения ${uuidv4().substring(0, 8)}`,
    code: `Временный код подразделения ${uuidv4().substring(0, 8)}`,
};

if(!accessToken) {
    throw new Error ('ACCESS_TOKEN не установлен. Убедитесь, что global-setup.ts отработал.');
}

// Глобальные переменные для использования в хуках
let request: APIRequestContext;

let permanentDepartmentIdToClean: string | null = null;

// Тестовый сценарий

test.describe('Department API Conditional Testing', () => {
    // 1. Хук: Настройка контекста и авторизации (Выполняется 1 раз перед всеми тестами)
    test.beforeAll(async({ playwright, baseURL }) => {
        request = await playwright.request.newContext({
            extraHTTPHeaders: {
                'Authorization' : `Bearer ${accessToken}`,
                'Content-Type': 'application/json', 
            },
            baseURL: baseURL,

        })
    })

    // Основной тест
    test('sould conditionally create or manage the target department', async () => {
        // 1. GET: Получить все подразделения
        const getResponse = await request.get(DEPARTMENTS_URL);
        expect(getResponse.status()).toBe(200);
        const allDepartments = await getResponse.json();
        // 2. Check: Проверить существование целевого подразделения
        const targetDepartment = allDepartments.find(
            (p: any) => p.description === TARGET_DEPARTMENT_NAME || p.code === TARGET_DEPARTMENT_CODE
        );
        if (targetDepartment) {
            // Сценарий 1: Целевое подразделение существует (создаем и удаляем временное)
            console.log(`\nПодразделение '{TARGET_DEPARTMENT_NAME}' уже существует. Создаем и удаляем временное.`);
            // 2.1 POST: Создание временной должности
            const createTempResponse = await request.post(DEPARTMENTS_URL, {
                data: TEMP_DEPARTMENT_PAYLOAD,
            });
            expect(createTempResponse.status()).toBe(200);
            const tempDepartment = await createTempResponse.json();
            const tempIdToDelete = tempDepartment.Id || tempDepartment.id;

            // 2.2 DELETE: Удаление временной должности
            if (tempIdToDelete) {
                const deleteResponse = await request.delete(`${DEPARTMENTS_URL}/${tempIdToDelete}`);
                // Ожидаем 200 ОК или 204 No Content
                expect(deleteResponse.status()).toBeGreaterThanOrEqual(200);
                expect(deleteResponse.status()).toBeLessThan(205);
                console.log(`Временное подразделение ID: ${tempIdToDelete} успешно создана и удалена.`);
                } else {
                    // Сценарий 2: Целевой должности нет (создаем)
                    console.log (`\nПодразделение '${TARGET_DEPARTMENT_NAME}' не найдена. Создаем постоянную.`);
                    // 3.1 POST: Создание постоянной должности
                    const createPermanentResponse = await request.post(DEPARTMENTS_URL, {
                        data: PERMANENT_DEPARTMENT_PAYLOAD,
                    });
                    expect(createPermanentResponse.status()).toBe(200);
                    const newPermanentDepartment = await createPermanentResponse.json();
                    // Сохраняем ID для очистки в afterALL
                    permanentDepartmentIdToClean = newPermanentDepartment.Id || newPermanentDepartment.id;
                    // Проверка, что должность создана
                    expect(permanentDepartmentIdToClean).toBeTruthy();
                    expect(newPermanentDepartment.description).toBe(PERMANENT_DEPARTMENT_PAYLOAD.description);
                    console.log(`Постоянное подразделение ID:${permanentDepartmentIdToClean} успешно создана. `);

                }
        }

        // 3. Хук: Очистка (выполняется один раз после всех тестов)

        test.afterAll(async () => {
            // 3.1 Удаление контекста запроса
            if (request) {
                await request.dispose();
            }
            // 3.2 Удаление постоянной должностиб созданной в Сценарии 2
            if (permanentDepartmentIdToClean) {
                console.log(`n\ Очистка: Удаление постоянной должности с ID: ${permanentDepartmentIdToClean}`);
                const deleteResponse = await request.delete(`${DEPARTMENTS_URL}/${permanentDepartmentIdToClean}`);

                if (deleteResponse.status() === 200 || deleteResponse.status() === 204) {
                    console.log(`Постоянная должность ${permanentDepartmentIdToClean} успешно удалена.`);
                } else {
                    const errorBody = await deleteResponse.text();
                    console.error(`Ошибка при удалении постоянного подразделения. Статус: ${deleteResponse.status()}. Тело: ${errorBody.substring(0, 200)}...`);
                    
                }
            }
        })


    
    });
});


