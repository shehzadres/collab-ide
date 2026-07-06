export interface TerminalInputMessage {
  type: "input";
  data: string;
}

export interface TerminalResizeMessage {
  type: "resize";
  cols: number;
  rows: number;
}

export type TerminalClientMessage = TerminalInputMessage | TerminalResizeMessage;

export interface TerminalOutputMessage {
  type: "output";
  data: string;
}

export interface TerminalExitMessage {
  type: "exit";
  code: number;
}

export type TerminalServerMessage = TerminalOutputMessage | TerminalExitMessage;
