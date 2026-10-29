import jwt from "jsonwebtoken";
import { isProduction } from "../config/env.js";

const SESSION_DAYS = 7;

export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  // Cross-site cookies are needed when the client and API live on different domains
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export const signSessionToken = (user) =>
  jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: `${SESSION_DAYS}d`,
  });

export const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    ...cookieOptions,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie("token", cookieOptions);
};
