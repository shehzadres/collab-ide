import { prisma } from "../../utils/prisma";
import { logger } from "../../utils/logger";
import { RecordingEventType } from "./sessions.types";

interface BufferedEvent {
  recordingId: string;
  type: RecordingEventType;
  fileId?: string;
  payload: Buffer;
  offsetMs: number;
}

const FLUSH_INTERVAL_MS = 2000;
const FLUSH_BATCH_SIZE = 200;
const MAX_QUEUE_SIZE = 20000;

class RecordingBuffer {
  private queue: BufferedEvent[] = [];
  private timer: NodeJS.Timeout;
  private flushing = false;

  constructor() {
    this.timer = setInterval(() => {
      this.flush().catch((err) => logger.error("Interval flush failed", err));
    }, FLUSH_INTERVAL_MS);
  }

  push(event: BufferedEvent): void {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      logger.error("Recording buffer overflow — dropping oldest event");
      this.queue.shift();
    }
    this.queue.push(event);
    if (this.queue.length >= FLUSH_BATCH_SIZE) {
      this.flush().catch((err) => logger.error("Threshold flush failed", err));
    }
  }

  async flush(): Promise<void> {
    if (this.flushing) return;
    if (this.queue.length === 0) return;

    this.flushing = true;
    const batch = this.queue.splice(0, this.queue.length);

    try {
      await prisma.recordingEvent.createMany({
        data: batch.map((e) => ({
          recordingId: e.recordingId,
          type: e.type,
          fileId: e.fileId ?? null,
          payload: e.payload,
          offsetMs: e.offsetMs,
        })),
      });
    } catch (err) {
      logger.error("Failed to flush recording events — requeueing batch", err);
      this.queue.unshift(...batch);
    } finally {
      this.flushing = false;
    }
  }

  shutdown(): void {
    clearInterval(this.timer);
  }
}

export const recordingBuffer = new RecordingBuffer();
