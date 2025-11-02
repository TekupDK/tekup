export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = "Friday AI Chat";

export const APP_LOGO = "/logo.png";

// Login URL - Always use local dev-login (no OAuth redirect)
export const getLoginUrl = () => {
  // Development login endpoint (auto-login as OWNER)
  return "/api/auth/login";
};
