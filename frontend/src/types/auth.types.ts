export interface User {
  id: string;
  email: string;
  username: string;
  role: "ADMIN" | "OWNER" | "EDITOR" | "VIEWER";
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}
