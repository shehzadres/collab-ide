import { Request, Response } from "express";
import { filesService } from "./files.service";
import { logger } from "../../utils/logger";

const MAX_CONTENT_BYTES = 2 * 1024 * 1024;

export class FilesController {
  async create(req: Request, res: Response) {
    try {
      const { name, path, isFolder, parentId, sessionId } = req.body;
      if (typeof name !== "string" || typeof path !== "string" || typeof sessionId !== "string") {
        return res.status(400).json({ message: "Invalid payload" });
      }
      const file = await filesService.create(req.user!.userId, {
        name,
        path,
        isFolder: Boolean(isFolder),
        parentId: typeof parentId === "string" ? parentId : null,
        sessionId,
      });
      res.status(201).json({ file });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async getTree(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({ message: "sessionId is required" });
      }
      const tree = await filesService.getTree(sessionId);
      res.status(200).json({ tree });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const file = await filesService.getById(req.params.id);
      res.status(200).json({ file });
    } catch (err) {
      this.handleError(res, err, 404);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { name, content, path } = req.body;
      if (typeof content === "string" && Buffer.byteLength(content, "utf8") > MAX_CONTENT_BYTES) {
        return res.status(413).json({ message: "File content too large" });
      }
      const file = await filesService.update(req.params.id, {
        name: typeof name === "string" ? name : undefined,
        content: typeof content === "string" ? content : undefined,
        path: typeof path === "string" ? path : undefined,
      });
      res.status(200).json({ file });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await filesService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async move(req: Request, res: Response) {
    try {
      const { parentId, path } = req.body;
      if (typeof path !== "string" || !path.trim()) {
        return res.status(400).json({ message: "path is required" });
      }
      const file = await filesService.move(req.params.id, typeof parentId === "string" ? parentId : null, path);
      res.status(200).json({ file });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown, status = 400) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    logger.error(message);
    res.status(status).json({ message });
  }
}

export const filesController = new FilesController();
