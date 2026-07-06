import bcrypt from "bcryptjs";
import { prisma } from "../../utils/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { RegisterDto, LoginDto, AuthTokens } from "./auth.types";

const SALT_ROUNDS = 10;

export class AuthService {
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim();

    if (!email || !username || !dto.password || dto.password.length < 8) {
      throw new Error("Invalid registration payload");
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await prisma.user.create({
        data: { email, username, passwordHash },
      });
      const tokens = this.issueTokens(user.id, user.role);
      await this.storeRefreshToken(user.id, tokens.refreshToken);
      return { user: this.sanitize(user), tokens };
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new Error("Email or username already in use");
      }
      throw err;
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await bcrypt.compare(dto.password, "$2b$10$invalidsaltinvalidsaltinv");
      throw new Error("Invalid credentials");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new Error("Invalid credentials");

    const tokens = this.issueTokens(user.id, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return { user: this.sanitize(user), tokens };
  }

  async refresh(token: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new Error("Invalid refresh token");

    const tokens = this.issueTokens(user.id, user.role);

    // Atomically consume the presented token and rotate it in one
    // conditional write, instead of a separate check-then-write pair. Two
    // round-trips left a window where a second concurrent /refresh call
    // (same cookie) could read the old token as still valid after the first
    // call had already rotated it, corrupting whichever response the
    // browser applied last.
    const updated = await prisma.user.updateMany({
      where: { id: payload.userId, refreshToken: token },
      data: { refreshToken: tokens.refreshToken },
    });
    if (updated.count === 0) throw new Error("Invalid refresh token");

    return tokens;
  }

  async logout(userId: string) {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    return this.sanitize(user);
  }

  private issueTokens(userId: string, role: string): AuthTokens {
    const payload = { userId, role };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken } });
  }

  private sanitize(user: { passwordHash: string; refreshToken: string | null; [k: string]: unknown }) {
    const { passwordHash, refreshToken, ...safe } = user;
    return safe;
  }
}

export const authService = new AuthService();
