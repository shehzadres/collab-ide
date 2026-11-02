import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
    <AuthCard
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Pick up where you left off. Your team is right where you left it."
      onSubmit={handleSubmit}
    >
      <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" required />
      <AuthInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter your password" required />

      {error && <p className="auth-error" role="alert">{error}</p>}

      <button type="submit" disabled={loading} className="auth-submit">
        <span>{loading ? "Signing in..." : "Continue to workspace"}</span>
        {!loading && <ArrowRight size={16} />}
      </button>

      <p className="auth-switch">
        New to Collab IDE? <Link to="/register">Create an account</Link>
      </p>
    </AuthCard>
  );
}
