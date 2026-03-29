import type { Role } from "@prisma/client";

export const REVEL_ROLES: Role[] = [
  "SUPER_ADMIN",
  "REVEL_ADMIN",
  "REVEL_TEAM",
];

export const CLIENT_ROLES: Role[] = ["CLIENT_ADMIN", "CLIENT_USER"];

export const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "REVEL_ADMIN"];

export function isRevelUser(role: Role): boolean {
  return REVEL_ROLES.includes(role);
}

export function isClientUser(role: Role): boolean {
  return CLIENT_ROLES.includes(role);
}

export function isAdminUser(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

export function canManageClients(role: Role): boolean {
  return ["SUPER_ADMIN", "REVEL_ADMIN"].includes(role);
}

export function canManageUsers(role: Role): boolean {
  return ["SUPER_ADMIN", "REVEL_ADMIN"].includes(role);
}

export function canUploadProofs(role: Role): boolean {
  return ["SUPER_ADMIN", "REVEL_ADMIN", "REVEL_TEAM"].includes(role);
}

export function canApproveProofs(role: Role): boolean {
  return ["SUPER_ADMIN", "REVEL_ADMIN", "CLIENT_ADMIN", "CLIENT_USER"].includes(role);
}

export function canManageBudget(role: Role): boolean {
  return ["SUPER_ADMIN", "REVEL_ADMIN", "REVEL_TEAM"].includes(role);
}

export function canManageTasks(role: Role): boolean {
  return ["SUPER_ADMIN", "REVEL_ADMIN", "REVEL_TEAM"].includes(role);
}

export function canUploadDocuments(role: Role): boolean {
  return ["SUPER_ADMIN", "REVEL_ADMIN", "REVEL_TEAM"].includes(role);
}
