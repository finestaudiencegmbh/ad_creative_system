import crypto from "crypto";

/**
 * Generate a secure random password
 * Format: 4 words separated by hyphens + 2 digits
 * Example: "blue-mountain-river-sky-42"
 * 
 * This format is:
 * - Easy to remember
 * - Easy to type
 * - Secure (high entropy)
 * - User-friendly
 */
export function generateSecurePassword(): string {
  const wordList = [
    "blue", "red", "green", "yellow", "purple", "orange", "pink", "brown",
    "mountain", "river", "ocean", "forest", "desert", "valley", "lake", "hill",
    "sun", "moon", "star", "cloud", "rain", "snow", "wind", "storm",
    "lion", "tiger", "bear", "wolf", "eagle", "hawk", "fox", "deer",
    "apple", "banana", "cherry", "grape", "lemon", "mango", "peach", "plum",
    "spring", "summer", "autumn", "winter", "morning", "evening", "night", "dawn",
  ];

  // Pick 4 random words
  const words: string[] = [];
  for (let i = 0; i < 4; i++) {
    const randomIndex = crypto.randomInt(0, wordList.length);
    words.push(wordList[randomIndex]);
  }

  // Add 2 random digits
  const digits = crypto.randomInt(10, 100);

  return `${words.join("-")}-${digits}`;
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
