export interface AwarenessUser {
  userId: string;
  username: string;
  color: string;
}

export interface AwarenessState {
  user: AwarenessUser;
  cursor?: {
    line: number;
    column: number;
  };
}
