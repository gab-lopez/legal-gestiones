export const msalConfig = {
  auth: {
    clientId:    "e2d38d7a-7f10-444e-97b9-8db46c08f9c6",
    authority:   "https://login.microsoftonline.com/19759634-afdc-4bcf-93ef-660ffa7becc0",
    redirectUri: "http://localhost:5173",
  },
  cache: {
    cacheLocation:      "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};

export const apiRequest = {
  scopes: ["api://e2d38d7a-7f10-444e-97b9-8db46c08f9c6/access_as_user"],
};