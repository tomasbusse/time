/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminCleanup from "../adminCleanup.js";
import type * as apiKeys from "../apiKeys.js";
import type * as archive from "../archive.js";
import type * as attendanceReports from "../attendanceReports.js";
import type * as auth from "../auth.js";
import type * as budget from "../budget.js";
import type * as calendar from "../calendar.js";
import type * as companySettings from "../companySettings.js";
import type * as crons from "../crons.js";
import type * as customerImports from "../customerImports.js";
import type * as customers from "../customers.js";
import type * as dashboardLayouts from "../dashboardLayouts.js";
import type * as debug_check from "../debug_check.js";
import type * as email from "../email.js";
import type * as equityMonitoring from "../equityMonitoring.js";
import type * as finance from "../finance.js";
import type * as flow from "../flow.js";
import type * as food from "../food.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as internal_ from "../internal.js";
import type * as invoices from "../invoices.js";
import type * as lessons from "../lessons.js";
import type * as migrations_migrateAccounts from "../migrations/migrateAccounts.js";
import type * as migrations_setIsActive from "../migrations/setIsActive.js";
import type * as migrations_updateUserInvitations from "../migrations/updateUserInvitations.js";
import type * as products from "../products.js";
import type * as settings from "../settings.js";
import type * as setup from "../setup.js";
import type * as sharing from "../sharing.js";
import type * as simpleFinance from "../simpleFinance.js";
import type * as students from "../students.js";
import type * as temp_data_clear from "../temp_data_clear.js";
import type * as timeAllocations from "../timeAllocations.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  adminCleanup: typeof adminCleanup;
  apiKeys: typeof apiKeys;
  archive: typeof archive;
  attendanceReports: typeof attendanceReports;
  auth: typeof auth;
  budget: typeof budget;
  calendar: typeof calendar;
  companySettings: typeof companySettings;
  crons: typeof crons;
  customerImports: typeof customerImports;
  customers: typeof customers;
  dashboardLayouts: typeof dashboardLayouts;
  debug_check: typeof debug_check;
  email: typeof email;
  equityMonitoring: typeof equityMonitoring;
  finance: typeof finance;
  flow: typeof flow;
  food: typeof food;
  groups: typeof groups;
  http: typeof http;
  internal: typeof internal_;
  invoices: typeof invoices;
  lessons: typeof lessons;
  "migrations/migrateAccounts": typeof migrations_migrateAccounts;
  "migrations/setIsActive": typeof migrations_setIsActive;
  "migrations/updateUserInvitations": typeof migrations_updateUserInvitations;
  products: typeof products;
  settings: typeof settings;
  setup: typeof setup;
  sharing: typeof sharing;
  simpleFinance: typeof simpleFinance;
  students: typeof students;
  temp_data_clear: typeof temp_data_clear;
  timeAllocations: typeof timeAllocations;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
