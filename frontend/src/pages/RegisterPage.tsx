import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { AuthInput } from "../components/Auth/AuthInput";
import { AuthCard } from "../components/Auth/AuthCard";

export default function RegisterPage() {
  const { register, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    register({ email, username, password });
  };

  return (
    <AuthCard
      eyebrow="Start building together"
      title="Create your account"
      subtitle="A few details, then you're ready to open your first shared workspace."
      onSubmit={handleSubmit}
    >
      <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" required />
      <AuthInput label="Username" type="text" value={username} onChange={setUsername} placeholder="How your team will see you" required />
      <AuthInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Create a strong password" required />

      {error && <p className="auth-error" role="alert">{error}</p>}

      <button type="submit" disabled={loading} className="auth-submit">
        <span>{loading ? "Creating account..." : "Create account"}</span>
        {!loading && <ArrowRight size={16} />}
      </button>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthCard>
  );
}
