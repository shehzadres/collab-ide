export interface TerminalOutputMessage {
  type: "output";
  data: string;
}

export interface TerminalExitMessage {
  type: "exit";
  code: number;
}

export type TerminalServerMessage = TerminalOutputMessage | TerminalExitMessage;
