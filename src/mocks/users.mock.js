import { fakerES as faker } from "@faker-js/faker";
import { USER_ROLES } from "../constants/index.js";
import { pickRandom, times } from "./helpers.mock.js";

// Roles que tiene sentido simular (el admin no se genera).
export const MOCK_USER_ROLES = [USER_ROLES.USER, USER_ROLES.DRIVER];

const clean = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();

// Sin password: el service la agrega (hasheada) solo al insertar en la base.
export const generateMockUser = (role = pickRandom(MOCK_USER_ROLES)) => {
  const first_name = faker.person.firstName();
  const last_name = faker.person.lastName();
  const suffix = faker.string.alphanumeric({ length: 4, casing: "lower" });

  const user = {
    first_name,
    last_name,
    email: `${clean(first_name)}.${clean(last_name)}.${suffix}@test.com`,
    role,
  };

  if (role === USER_ROLES.DRIVER) {
    user.isAvailable = faker.datatype.boolean();
  }

  return user;
};

export const generateMockUsers = (qty, role) => times(qty, () => generateMockUser(role));
