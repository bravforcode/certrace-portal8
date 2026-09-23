/* ════════════════════════════════════════════════════════════
   THE API CLIENT — one import for the whole layer

   Screens and stores import from `@/lib/api`; only the modules inside this
   folder import each other. That keeps the surface small enough to change:
   when a path in docs/API-CONTRACT.md moves, it moves in one file here and
   nowhere in the app.

   Migration order, so a reader knows where this is going:

     1. This layer lands with nothing calling it yet (here).
     2. Screens call it behind `apiConfigured()`, keeping the localStorage
        path for a laptop with no backend pointed at it.
     3. Once every store has moved and the backend is live, the localStorage
        fallbacks come out.
   ════════════════════════════════════════════════════════════ */

export { ApiError, isApiError, hasCode, isDeadLink, DEAD_LINK_CODES, TRANSPORT_CODES } from "./errors";

export { configureApi, apiBaseUrl, apiConfigured, apiTimeoutMs, demoModeEnabled, authUnavailable } from "./config";
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
export type { GoogleCallbackProblem, GoogleCallbackResult, GoogleIntent } from "./google";
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
