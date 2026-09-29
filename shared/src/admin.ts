// Roles & permissions shared by admin server code and UI.
export type AdminRole = "owner" | "manager" | "staff";

export const ROLES: AdminRole[] = ["owner", "manager", "staff"];

export type Permission =
  | "revenue:view"
  | "orders:update"
  | "orders:cancel"
  | "payments:verify"
  | "products:edit"
  | "inventory:adjust"
  | "customers:view"
  | "coupons:edit"
  | "activity:view"
  | "settings:edit"
  | "staff:manage";

const MATRIX: Record<Permission, AdminRole[]> = {
  "revenue:view": ["owner", "manager"],
  "orders:update": ["owner", "manager", "staff"],
  "orders:cancel": ["owner", "manager"],
  "payments:verify": ["owner", "manager"],
  "products:edit": ["owner", "manager"],
  "inventory:adjust": ["owner", "manager", "staff"],
  "customers:view": ["owner", "manager"],
  "coupons:edit": ["owner", "manager"],
  "activity:view": ["owner", "manager"],
  "settings:edit": ["owner"],
  "staff:manage": ["owner"],
};

export function can(role: AdminRole, permission: Permission) {
  return MATRIX[permission].includes(role);
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
};

export const ROLE_HINT: Record<AdminRole, string> = {
  owner: "Everything, including staff accounts and store settings",
  manager: "Orders, payments, catalogue, coupons, customers & revenue",
  staff: "Packing & dispatch: order status & stock counts",
};

/** Admin passwords: long enough to resist guessing, short enough to type on a phone. */
export const MIN_PASSWORD = 10;

/** Safe admin shape passed to pages and client components. */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}
