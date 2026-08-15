/**
 * Real-world Form Validation, Input Formatting & Data Sanitization Utilities
 * EagleEye React Native Application
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Sanitizes generic text:
 * - Prevents leading spaces
 * - Replaces consecutive spaces with a single space
 */
export const sanitizeText = (val: string): string => {
  if (!val) return '';
  return val.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
};

/**
 * Sanitizes name input:
 * - Allows alphabets, single spaces, apostrophe, and hyphen only
 */
export const sanitizeName = (val: string): string => {
  const sanitized = sanitizeText(val);
  return sanitized.replace(/[^a-zA-Z\s'-]/g, '');
};

/**
 * Sanitizes numeric input:
 * - Strips non-digit characters
 */
export const sanitizeNumeric = (val: string): string => {
  if (!val) return '';
  return val.replace(/[^0-9]/g, '');
};

/**
 * Sanitizes alphanumeric uppercase input:
 * - Strips special characters and converts to uppercase (RC No, License No, ASN No, Ref ID)
 */
export const sanitizeAlphanumericUpper = (val: string): string => {
  if (!val) return '';
  return val.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
};

/**
 * Validates Full Name (min 2, max 50 chars, alphabets/spaces only)
 */
export const validateName = (name: string, label: string = 'Full Name'): ValidationResult => {
  const trimmed = name ? name.trim() : '';
  if (!trimmed) {
    return { isValid: false, error: `${label} is required.` };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: `${label} must be at least 2 characters.` };
  }
  if (trimmed.length > 50) {
    return { isValid: false, error: `${label} cannot exceed 50 characters.` };
  }
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: `${label} can contain letters and spaces only.` };
  }
  return { isValid: true };
};

/**
 * Validates Mobile Number (exactly 10 digits)
 */
export const validatePhone = (phone: string, label: string = 'Mobile Number'): ValidationResult => {
  const digitsOnly = phone ? phone.replace(/[^0-9]/g, '') : '';
  if (!digitsOnly) {
    return { isValid: false, error: `${label} is required.` };
  }
  if (digitsOnly.length !== 10) {
    return { isValid: false, error: `${label} must be exactly 10 digits.` };
  }
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(digitsOnly)) {
    return { isValid: false, error: `Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.` };
  }
  return { isValid: true };
};

/**
 * Validates Email Address
 */
export const validateEmail = (email: string): ValidationResult => {
  const trimmed = email ? email.trim() : '';
  if (!trimmed) {
    return { isValid: false, error: 'Email Address is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. user@domain.com).' };
  }
  return { isValid: true };
};

/**
 * Validates Blood Group against standard options
 */
export const ALLOWED_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const validateBloodGroup = (bloodGroup: string): ValidationResult => {
  const trimmed = bloodGroup ? bloodGroup.trim().toUpperCase() : '';
  if (!trimmed) {
    return { isValid: true }; // Optional field if not provided
  }
  if (!ALLOWED_BLOOD_GROUPS.includes(trimmed)) {
    return { isValid: false, error: `Blood Group must be one of: ${ALLOWED_BLOOD_GROUPS.join(', ')}.` };
  }
  return { isValid: true };
};

/**
 * Validates Vehicle RC Number
 */
export const validateRcNumber = (rcNo: string): ValidationResult => {
  const cleaned = rcNo ? rcNo.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
  if (!cleaned) {
    return { isValid: false, error: 'Vehicle RC / Registration Number is required.' };
  }
  if (cleaned.length < 6 || cleaned.length > 15) {
    return { isValid: false, error: 'Vehicle RC Number must be between 6 and 15 alphanumeric characters.' };
  }
  return { isValid: true };
};

/**
 * Validates Payment Reference Number
 */
export const validatePaymentReference = (ref: string, paymentMode: string): ValidationResult => {
  if (paymentMode === 'Cash') {
    return { isValid: true }; // Optional for Cash mode
  }
  const trimmed = ref ? ref.trim() : '';
  if (!trimmed) {
    return { isValid: false, error: `Payment Reference / UTR Number is required for ${paymentMode} mode.` };
  }
  if (trimmed.length < 4) {
    return { isValid: false, error: 'Payment Reference must be at least 4 characters long.' };
  }
  return { isValid: true };
};

/**
 * Validates Amount
 */
export const validateAmount = (amount: string): ValidationResult => {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: 'Please enter a valid positive payment amount.' };
  }
  return { isValid: true };
};
