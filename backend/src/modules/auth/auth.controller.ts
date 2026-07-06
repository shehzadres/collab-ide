import { Request, Response } from "express";
import { authService } from "./auth.service";
import { logger } from "../../utils/logger";

const REFRESH_COOKIE = "refreshToken";

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { user, tokens } = await authService.register(req.body);
      this.setRefreshCookie(res, tokens.refreshToken);
      res.status(201).json({ user, accessToken: tokens.accessToken });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { user, tokens } = await authService.login(req.body);
      this.setRefreshCookie(res, tokens.refreshToken);
      res.status(200).json({ user, accessToken: tokens.accessToken });
    } catch (err) {
      this.handleError(res, err, 401);
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const token = req.cookies?.[REFRESH_COOKIE];
      if (!token) return res.status(401).json({ message: "No refresh token" });

      const tokens = await authService.refresh(token);
      this.setRefreshCookie(res, tokens.refreshToken);
      res.status(200).json({ accessToken: tokens.accessToken });
    } catch (err) {
      this.handleError(res, err, 401);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      await authService.logout(userId);
      res.clearCookie(REFRESH_COOKIE, { path: "/", httpOnly: true, sameSite: "lax" });
      res.status(204).send();
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async me(req: Request, res: Response) {
    try {
      const user = await authService.me(req.user!.userId);
      res.status(200).json({ user });
    } catch (err) {
      this.handleError(res, err, 404);
    }
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private handleError(res: Response, err: unknown, status = 400) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    logger.error(message);
    res.status(status).json({ message });
  }
}

export const authController = new AuthController();
