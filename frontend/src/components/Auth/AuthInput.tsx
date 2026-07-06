interface AuthInputProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function AuthInput({ label, type, value, onChange, placeholder, required }: AuthInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-ink">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="bg-hover border border-border rounded-md px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
