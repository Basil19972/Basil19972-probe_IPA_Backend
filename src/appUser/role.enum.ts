export enum UserRole {
  Dev = 'Dev',
  User = 'User',
  Employee = 'Employee',
  Owner = 'Owner',
  SilverOwner = 'SilverOwner',
  GoldOwner = 'GoldOwner',
  PlatinumOwner = 'PlatinumOwner',
}

export const amountOfCards = new Map<UserRole, number>([
  [UserRole.Dev, 4],
  [UserRole.User, 4],
  [UserRole.Employee, 4],
  [UserRole.Owner, 4],
  [UserRole.SilverOwner, 4],
  [UserRole.GoldOwner, 4],
  [UserRole.PlatinumOwner, 4],
]);
