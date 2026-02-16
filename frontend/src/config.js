export const FEATURES = {
  resources: process.env.REACT_APP_FEATURE_RESOURCES !== "false",
  admin_tools: process.env.REACT_APP_FEATURE_ADMIN_TOOLS === "true",
  password_reset: process.env.REACT_APP_FEATURE_PASSWORD_RESET !== "false",
};
