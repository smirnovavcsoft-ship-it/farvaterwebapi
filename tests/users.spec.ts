// tests/users.spec.ts
import { test, expect, APIRequestContext } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid'; // Для уникальных кодов
import * as dotenv from 'dotenv';

 //КОНФИГУРАЦИЯ И ПЕРЕМЕННЫЕ СОСТОЯНИЯ

dotenv.config(); 
const accessToken = process.env.ACCESS_TOKEN;
console.log('🔑 Loaded token:', accessToken);

//Эндпоинт для должностей

const POSITIONS_URL = '/api/farvater/data/v1/users';


// Данные для тестирования
const user1Lastname = 'Делон', user1Firstname = 'Ален';
const user2Lastname = 'Бельмондо', user2Firstname = 'Жан-Поль';
const user3Lastname = 'Депардье', user3Firstname = 'Жерар';
const user4Lastname = 'Ришар', user4Firstname = 'Пьер';
const user5Lastname = 'Рено', user5Firstname = 'Жан';
const user6Lastname = 'Габен', user6Firstname = 'Жан';

const NEW_USER_PAYLOAD = {
    firstName: "Ален",
    lastName: "Делон",
    login: UNIQUE_LOGIN, // Используем уникальный логин для предотвращения конфликтов
    
    // Поля с пустыми значениями или булевыми флагами
    middleName: "",
    phone: "",
    mail: "",
    isDisabled: false,
    isDomainUser: false,
    isLeader: false,
    personnelNumber: "",
    rightToSign: false,
    
    // Объекты, которые могут быть пустыми или содержать ID (если известно)
    department: {},
    position: {},
};