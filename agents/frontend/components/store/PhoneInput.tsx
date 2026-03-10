'use client';

interface PhoneInputProps {
  value: string;
  onChange: (digits: string) => void;
  onBlur?: () => void;
  error?: string;
}

export default function PhoneInput({ value, onChange, onBlur, error }: PhoneInputProps) {
  const maxTel = value.startsWith('3') ? 10 : 15;

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const limit = digits.startsWith('3') ? 10 : 15;
    onChange(digits.slice(0, limit));
  };

  return (
    <div>
      <input
        type="tel"
        inputMode="numeric"
        placeholder="3001234567"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={onBlur}
        maxLength={maxTel}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}`}
        aria-label="Número de teléfono"
      />
      <div className="flex justify-between mt-1">
        {error ? <p className="text-xs text-red-500">{error}</p> : <span />}
        <span className={`text-xs ${value.length >= maxTel - 2 ? 'text-orange-500' : 'text-gray-400'}`}>
          {value.length}/{maxTel}
        </span>
      </div>
    </div>
  );
}
