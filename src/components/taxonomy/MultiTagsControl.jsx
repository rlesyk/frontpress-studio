import { Input } from '../ui/index.js';

// Multi-value, free-form tags. The user types comma-separated values; we
// store an array. The visible string is rebuilt by joining with ", ".
export default function MultiTagsControl({ value, onChange }) {
  const arr = Array.isArray(value) ? value : value ? [String(value)] : [];
  return (
    <Input
      value={arr.join(', ')}
      onChange={(e) => onChange(
        e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
      )}
      placeholder="comma, separated"
    />
  );
}
