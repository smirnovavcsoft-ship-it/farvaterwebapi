//workgroups.spec.ts
import {test, expect, APIRequestContext} from '@playwright/test';
import {v4 as uuidv4} from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();
const accessToken = process.env.ACCESS_TOKEN;
console.log ('Loaded token', accessToken);

const GROUPS_URL = '/api/farvater/data/v1/workgroups';

const GROUP_NAME1 = 'Администраторы для проверки';
const GROUP_NAME2 = 'ГИПы для проверки';
const GROUP_NAME3 = 'Архиваторы для проверки';
const GROUP_NAME4 = 'Юристы для проверки';
const GROUP_NAME1 = 'Делопроизводители для проверки';

const GROUP_PAYLOAD = {
    title: GROUP_NAME1,
    isAdmin: false,
    isArchive: false,
    isContractEditor: false,
    isFormByDomainGroup: false,
    isGip: false,
    isORDEditor: false,
    users: [
        {
            member
        }
    ]
}
