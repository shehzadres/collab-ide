import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
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
    <AuthCard title="Create account" onSubmit={handleSubmit}>
      <AuthInput label="Email" type="email" value={email} onChange={setEmail} required />
      <AuthInput label="Username" type="text" value={username} onChange={setUsername} required />
      <AuthInput label="Password" type="password" value={password} onChange={setPassword} required />

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-fg rounded-md py-2 text-sm font-medium transition"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>

      <p className="text-sm text-muted text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
