export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// Accepts 0803 123 4567, 803 123 4567, +234 803 123 4567 and 234803...
export function isValidNigerianPhone(phone: string) {
  const digits = phone.replace(/[\s()-]/g, '');
  return /^(\+?234|0)?[789][01]\d{8}$/.test(digits);
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/[\s()-]/g, '').replace(/^\+?234/, '').replace(/^0/, '');
  return `+234 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  valid: boolean;
  hints: string[];
}

export function passwordStrength(pw: string): PasswordStrength {
  const hints: string[] = [];
  if (pw.length < 8) hints.push('At least 8 characters');
  if (!/[a-zA-Z]/.test(pw)) hints.push('One letter');
  if (!/\d/.test(pw)) hints.push('One number');
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pw) || pw.length >= 12) score += 1;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return {
    score: score as PasswordStrength['score'],
    label: pw ? labels[score] : '',
    valid: pw.length >= 8 && /[a-zA-Z]/.test(pw) && /\d/.test(pw),
    hints,
  };
}
