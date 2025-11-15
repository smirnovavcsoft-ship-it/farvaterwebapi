// tests/users.spec.ts
import { test, expect, APIRequestContext } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid'; // Для уникальных кодов
import * as dotenv from 'dotenv';
import *as fs from 'fs';

 //КОНФИГУРАЦИЯ И ПЕРЕМЕННЫЕ СОСТОЯНИЯ

dotenv.config(); 
const accessToken = process.env.ACCESS_TOKEN;
console.log('🔑 Loaded token:', accessToken);

//Эндпоинт для должностей

//const USERS_URL = '/api/farvater/data/v1/users';
const DELETE_USER_URL = "/api/farvater/data/v1/users?filter=all";


// Данные для тестирования
const user1Lastname = 'Пупкин', user1Firstname = 'Василий';
//const user2Lastname = 'Бельмондо', user2Firstname = 'Жан-Поль';
//const user3Lastname = 'Депардье', user3Firstname = 'Жерар';
////const user4Lastname = 'Ришар', user4Firstname = 'Пьер';
//const user5Lastname = 'Рено', user5Firstname = 'Жан';
//const user6Lastname = 'Габен', user6Firstname = 'Жан';

const NEW_USER_PAYLOAD = {
    firstName: user1Firstname,
    lastName: user1Lastname,
    login: user1Lastname, 
    middleName: "",
    phone: "",
    mail: "",
    isDisabled: true,
    isDomainUser: false,
    isLeader: false,
    personnelNumber: "",
    rightToSign: false,
    
    // Объекты, которые могут быть пустыми или содержать ID (если известно)
    department: {},
    position: {},
};

if (!accessToken) {
    throw new Error('ACCESS_TOKEN не установлен. Убедитесь, что global-setup.ts отработал.')
}

let request: APIRequestContext;

let permanentPositionIdToClean: string | null = null;

test.describe('Users API Conditional Testing', () => {
    test.beforeAll(async ({ playwright, baseURL }) => {
            request = await playwright.request.newContext({
                extraHTTPHeaders: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                baseURL: baseURL,
            });
        });

         test('should delete yesterday\'s user', async () => {
    // 1. GET: Получить всех пользователей (у вас это уже есть)
    const getResponse = await request.get(DELETE_USER_URL);
    expect(getResponse.status()).toBe(200);
    const allUsers = await getResponse.json();

    // 2. 🔎 ИЩЕМ ВАШЕГО ВЧЕРАШНЕГО ПОЛЬЗОВАТЕЛЯ ПО ИМЕНИ И ФАМИЛИИ
    const userToDelete = allUsers.find(
        (u: any) => u.firstName === user1Firstname && u.lastName === user1Lastname
    );

    if (userToDelete) {
        // 3. 💣 УДАЛЯЕМ, используя найденный ID
        const userId = userToDelete.id;
        console.log(`🧹 Найден вчерашний пользователь ${user1Firstname} ${user1Lastname}. Удаляем ID: ${userId}`);

        const deleteResponse = await request.delete(`${DELETE_USER_URL}/${userId}`); 
        
        expect(deleteResponse.ok()).toBeTruthy(); 
        console.log(`✅ Пользователь успешно удален. Статус: ${deleteResponse.status()}`);
    } else {
        console.log(`❕ Пользователь ${user1Firstname} ${user1Lastname} не найден. Возможно, он уже удален.`);
    }

    // ❌ ВАЖНО: Удалите или закомментируйте блоки POST и DELETE, которые вы использовали ранее,
    // чтобы они не создавали нового пользователя и не пытались удалить его сразу же.
    });
        
        
        




 })