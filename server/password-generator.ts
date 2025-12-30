import crypto from "crypto";

/**
 * Generate a secure random password
 * Format: 8-character alphanumeric code (letters + numbers)
 * Example: "a7K9mP2x"
 * 
 * This format is:
 * - Easy to type
 * - Secure (high entropy)
 * - No special characters (better for email compatibility)
 */
export function generateSecurePassword(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const allChars = uppercase + lowercase + numbers;

  let password = "";

  // Ensure at least one uppercase, one lowercase, and one number
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];

  // Fill the rest randomly (5 more characters to make 8 total)
  for (let i = 3; i < 8; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  // Shuffle the password to randomize position of guaranteed characters
  return password
    .split("")
    .sort(() => crypto.randomInt(-1, 2))
    .join("");
}

/**
 * Alternative: Generate a traditional strong password
 * Format: 16 characters with uppercase, lowercase, numbers, and symbols
 * Example: "aB3$xY9#mK2@pL5!"
 */
export function generateStrongPassword(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = "";

  // Ensure at least one of each type
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += symbols[crypto.randomInt(0, symbols.length)];

  // Fill the rest randomly
  for (let i = 4; i < 16; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => crypto.randomInt(-1, 2))
    .join("");
}
