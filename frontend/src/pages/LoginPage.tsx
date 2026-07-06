import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthInput } from "../components/Auth/AuthInput";
import { AuthCard } from "../components/Auth/AuthCard";

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <AuthCard title="Sign in" onSubmit={handleSubmit}>
      <AuthInput label="Email" type="email" value={email} onChange={setEmail} required />
      <AuthInput label="Password" type="password" value={password} onChange={setPassword} required />

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-fg rounded-md py-2 text-sm font-medium transition"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-sm text-muted text-center">
        No account?{" "}
        <Link to="/register" className="text-accent hover:underline">
          Register
        </Link>
      </p>
    </AuthCard>
  );
}
