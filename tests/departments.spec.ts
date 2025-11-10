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
const POSITION_URL = '/api/farvater/data/v1/departments';

// Данные для тестирования
const DEPARTMENT_NAME = 'Отдел архитектуры и градостроительства';
const DEPARTMENT_CODE = 'ОАГ'

const PERMANENT_DEPARTMENT_PAYLOAD = {
    description: DEPARTMENT_NAME,
    code: DEPARTMENT_CODE,
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
