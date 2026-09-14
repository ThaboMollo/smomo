/**
 * Client-side SA ID validation — mirrors the server-side `validate_sa_id` DB function.
 * Gives instant feedback during onboarding; the database re-checks on insert.
 *
 * A South African ID number is 13 digits: YYMMDD SSSS C A Z
 *  - YYMMDD : date of birth
 *  - SSSS   : gender sequence (>= 5000 male, else female)
 *  - C      : citizenship (0 = citizen, 1 = permanent resident)
 *  - Z      : Luhn check digit over all 13 digits
 */
export type SaIdResult =
  | { valid: false; reason: string }
  | { valid: true; dob: string; gender: 'male' | 'female'; citizenship: string };

export function validateSaId(input: string): SaIdResult {
  const digits = (input ?? '').replace(/\D/g, '');
  if (digits.length !== 13) return { valid: false, reason: 'ID must be 13 digits' };

  // Luhn checksum
  let sum = 0;
  let double = false;
  for (let i = 12; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  if (sum % 10 !== 0) return { valid: false, reason: 'Invalid ID number (checksum failed)' };

  const yy = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const dd = Number(digits.slice(4, 6));
  const century = yy <= new Date().getFullYear() % 100 ? 2000 : 1900;
  const dob = new Date(century + yy, mm - 1, dd);
  if (
    dob.getFullYear() !== century + yy ||
    dob.getMonth() !== mm - 1 ||
    dob.getDate() !== dd
  ) {
    return { valid: false, reason: 'Invalid date of birth in ID' };
  }

  const seq = Number(digits.slice(6, 10));
  const gender = seq >= 5000 ? 'male' : 'female';
  const cDigit = digits[10];
  const citizenship =
    cDigit === '0' ? 'citizen' : cDigit === '1' ? 'permanent_resident' : 'unknown';

  return {
    valid: true,
    dob: dob.toISOString().slice(0, 10),
    gender,
    citizenship,
  };
}

/** Passports: basic format check only (6–12 alphanumerics). */
export function validatePassport(input: string): boolean {
  return /^[A-Za-z0-9]{6,12}$/.test((input ?? '').trim());
}
