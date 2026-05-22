/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lib_middleware from "../lib/middleware.js";
import type * as lib_utils from "../lib/utils.js";
import type * as oauth from "../oauth.js";
import type * as secured_users from "../secured/users.js";
import type * as shots from "../shots.js";
import type * as socials_instagram from "../socials/instagram.js";
import type * as socials_snapchat from "../socials/snapchat.js";
import type * as socials_youtube from "../socials/youtube.js";
import type * as studios from "../studios.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  files: typeof files;
  http: typeof http;
  "lib/middleware": typeof lib_middleware;
  "lib/utils": typeof lib_utils;
  oauth: typeof oauth;
  "secured/users": typeof secured_users;
  shots: typeof shots;
  "socials/instagram": typeof socials_instagram;
  "socials/snapchat": typeof socials_snapchat;
  "socials/youtube": typeof socials_youtube;
  studios: typeof studios;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
