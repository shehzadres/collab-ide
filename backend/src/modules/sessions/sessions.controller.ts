import { Request, Response } from "express";
import { sessionsService } from "./sessions.service";
import { logger } from "../../utils/logger";

export class SessionsController {
  async start(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const result = await sessionsService.startRecording(sessionId, req.user!.userId);
      res.status(201).json(result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async stop(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const result = await sessionsService.stopRecording(sessionId);
      res.status(200).json({ recording: result });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const recordings = await sessionsService.listRecordings(sessionId);
      res.status(200).json({ recordings });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async replay(req: Request, res: Response) {
    try {
      const { recordingId } = req.params;
      const events = await sessionsService.getReplayEvents(recordingId);
      res.status(200).json({ events });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await sessionsService.deleteRecording(req.params.recordingId);
      res.status(204).send();
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

export const sessionsController = new SessionsController();
