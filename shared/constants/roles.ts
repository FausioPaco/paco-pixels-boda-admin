export const SUPER_ADMINISTRATOR_ROLE = 'Super Administrador';
export const ADMINISTRATOR_ROLE = 'Administrador';
export const MANAGER_ROLE = 'Gestor';
export const PHOTOGRAPHER_ROLE = 'Fotógrafo';
export const PROTOCOL_ROLE = 'Protocolo';

export const isStaffUser = (roleName?: string): boolean =>
  roleName === SUPER_ADMINISTRATOR_ROLE ||
  roleName === ADMINISTRATOR_ROLE ||
  roleName === MANAGER_ROLE ||
  roleName === PHOTOGRAPHER_ROLE ||
  roleName === PROTOCOL_ROLE;

export const isAdministrator = (roleName?: string): boolean =>
  roleName === ADMINISTRATOR_ROLE;

export const isSuperAdministrator = (roleName?: string): boolean =>
  roleName === SUPER_ADMINISTRATOR_ROLE;
