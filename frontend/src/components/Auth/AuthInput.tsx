interface AuthInputProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function AuthInput({ label, type, value, onChange, placeholder, required }: AuthInputProps) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  const autoComplete = type === "password" ? (label === "Password" ? "current-password" : "new-password") : type === "email" ? "email" : "username";

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="auth-input"
      />
    </div>
  );
}
