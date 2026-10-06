/**
 * 9 Core Roles as specified in SOW Section 2
 */
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  GYM_OWNER: 'GYM_OWNER',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  RECEPTIONIST: 'RECEPTIONIST',
  TRAINER: 'TRAINER',
  NUTRITIONIST: 'NUTRITIONIST',
  SALES_EXEC: 'SALES_EXEC',
  ACCOUNTANT: 'ACCOUNTANT',
  MEMBER: 'MEMBER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ALL_ROLES: UserRole[] = Object.values(USER_ROLES);

export const STAFF_ROLES: UserRole[] = [
  USER_ROLES.GYM_OWNER,
  USER_ROLES.BRANCH_MANAGER,
  USER_ROLES.RECEPTIONIST,
  USER_ROLES.TRAINER,
  USER_ROLES.NUTRITIONIST,
  USER_ROLES.SALES_EXEC,
  USER_ROLES.ACCOUNTANT,
];

export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.SUPER_ADMIN]: 'Super Admin / Platform Administrator',
  [USER_ROLES.GYM_OWNER]: 'Gym Owner',
  [USER_ROLES.BRANCH_MANAGER]: 'Branch Manager',
  [USER_ROLES.RECEPTIONIST]: 'Receptionist',
  [USER_ROLES.TRAINER]: 'Fitness Trainer',
  [USER_ROLES.NUTRITIONIST]: 'Dietitian / Nutritionist',
  [USER_ROLES.SALES_EXEC]: 'Sales Executive',
  [USER_ROLES.ACCOUNTANT]: 'Accountant',
  [USER_ROLES.MEMBER]: 'Gym Member',
};
