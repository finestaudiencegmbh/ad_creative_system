import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // OAuth disabled - all OAuth routes redirect to login
  app.get("/api/oauth/callback", (req, res) => {
    res.redirect(302, "/login?error=oauth_disabled");
  });

  app.get("/api/oauth/logout", (req, res) => {
    res.clearCookie(COOKIE_NAME);
    res.redirect(302, "/login");
  });
}

export function handleOAuthCallback(sdk: any) {
  return async (req: Request, res: Response) => {
    // OAuth disabled - redirect to login page
    res.redirect(302, "/login?error=oauth_disabled");
  };
}
