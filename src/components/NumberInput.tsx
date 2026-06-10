import { Input } from '@/components/ui/input';

interface NumberInputProps {
  /** Raw numeric value as string, e.g. "10000" */
  value: string;
  /** Called with the raw numeric string (digits only), e.g. "10000" */
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const formatThousands = (raw: string) => {
  if (!raw) return '';
  return Number(raw).toLocaleString('id-ID');
};

/**
 * Text input that displays a thousands-separated number (id-ID: 10.000)
 * while exposing the raw digit string ("10000") via onChange.
 */
export default function NumberInput({ value, onChange, placeholder, className }: NumberInputProps) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      value={formatThousands(value)}
      onChange={e => {
        const raw = e.target.value.replace(/\D/g, '');
        onChange(raw);
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}
