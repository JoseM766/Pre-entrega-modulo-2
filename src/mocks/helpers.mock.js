import { fakerES as faker } from "@faker-js/faker";

export const fakeObjectId = () => faker.database.mongodbObjectId();
export const pickRandom = (list) => faker.helpers.arrayElement(list);
export const times = (qty, generator) => Array.from({ length: qty }, generator);
