/* ════════════════════════════════════════════════════════════
   THE API CLIENT — one import for the whole layer

   Screens and stores import from `@/lib/api`; only the modules inside this
   folder import each other. That keeps the surface small enough to change:
   when an API path moves, it moves in one file here and
   nowhere in the app.

   Account and link data require the backend in every deployment.
   ════════════════════════════════════════════════════════════ */

export {
  ApiError,
  isApiError,
  hasCode,
  isDeadLink,
  isAccountSuspended,
  ACCOUNT_SUSPENDED,
  DEAD_LINK_CODES,
  TRANSPORT_CODES,
} from "./errors";

export {
  accountSuspension,
  clearAccountSuspension,
  markAccountSuspended,
  onAccountSuspensionChange,
} from "./suspension";
export type { SuspensionNotice } from "./suspension";

export {
  configureApi,
  apiBaseUrl,
  apiConfigured,
  apiTimeoutMs,
  authUnavailable,
} from "./config";
export type { ApiConfig } from "./config";

export { request } from "./http";

export { warmBackend } from "./warm";
export type { RequestOptions } from "./http";

export {
  loadSession,
  saveSession,
  clearSession,
  accessToken,
  isSignedIn,
  onSessionChange,
} from "./session";
export type { Session } from "./session";

export {
  register,
  login,
  me,
  markOnboarded,
  logout,
  requestPasswordReset,
  resetPassword,
  changePassword,
} from "./auth";
export {
  beginGoogleSignIn,
  beginGoogleLink,
  completeGoogleCallback,
  googleAuthorizeUrl,
  googleSignInEnabled,
  pendingGoogleIntent,
  GoogleCallbackError,
  GOOGLE_CALLBACK_PATH,
} from "./google";
export type {
  GoogleCallbackProblem,
  GoogleCallbackResult,
  GoogleIntent,
} from "./google";
export type {
  AuthUser,
  RegisterInput,
  LoginInput,
  EmailLocale,
  PasswordResetRequestInput,
  PasswordResetInput,
  ChangePasswordInput,
} from "./auth";

export {
  listDeclarations,
  getDeclaration,
  createDeclaration,
  updateDeclaration,
  removeDeclaration,
} from "./declarations";

export {
  createSmartLink,
  getSubmissionState,
  listSubmissions,
  requestRevision,
  resolveLink,
  saveLinkState,
  submitLink,
} from "./links";
export type {
  LinkResolution,
  SmartLink,
  SubmissionSummary,
  CreateLinkInput,
  RevisionInput,
  SubmitInput,
} from "./links";
