export interface TerminalOutputMessage {
  type: "output";
  data: string;
}

export interface TerminalExitMessage {
  type: "exit";
  code: number;
}

export interface TerminalReadyMessage {
  type: "ready";
  resumed: boolean;
}

export type TerminalServerMessage =
  | TerminalOutputMessage
  | TerminalExitMessage
  | TerminalReadyMessage;
