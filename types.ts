export enum UserRole {
  SUPERVISOR = 'SUPERVISOR',
  OPERATOR = 'OPERATOR'
}

export interface User {
  id: string;
  name: string;
  login: string;
  password?: string; // Optional for security in display
  role: UserRole;
  active: boolean;
}

export interface RouteGroup {
  id: string;
  name: string;
  ceps: string[]; // List of CEP prefixes or full CEPs
  category: string; // New field for grouping (A, B, C...)
  completed: boolean;
}

export interface PackageData {
  trackingCode: string;
  cep: string;
}

export enum ScanStatus {
  SUCCESS = 'SUCCESS',
  MANUAL = 'MANUAL',
  ERROR_ROUTE = 'ERROR_ROUTE',
  ERROR_NOT_FOUND = 'ERROR_NOT_FOUND',
  ERROR_DUPLICATE = 'ERROR_DUPLICATE',
  ERROR_INVALID = 'ERROR_INVALID' // e.g. not starting with BR
}

export interface ScanLog {
  id: string;
  timestamp: number;
  operatorId: string;
  operatorName: string;
  routeId: string;
  routeName: string;
  trackingCode: string;
  status: ScanStatus;
  message?: string;
}

export interface OperatorStats {
  operatorId: string;
  name: string;
  currentRoute: string | null;
  totalScans: number;
  successfulScans: number;
  scansPerMinute: number;
  lastActive: number;
}