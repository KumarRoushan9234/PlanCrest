import crypto from "crypto";

const PREFIX = "enc:v1:";

/**
 * Derive a 32-byte key. ENCRYPTION_KEY is preferred; JWT_SECRET is the
 * fallback so local setups work without extra configuration.
 */
const getKey = () =>
  crypto
    .createHash("sha256")
    .update(process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "")
    .digest();

/**
 * Encrypt a string with AES-256-GCM. Already-encrypted and empty values
 * are returned unchanged, so this is safe to use as a mongoose setter.
 */
export const encrypt = (value) => {
  if (!value || typeof value !== "string" || value.startsWith(PREFIX)) {
    return value;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, data]).toString("base64");
};

/**
 * Decrypt a value produced by encrypt(). Plaintext values stored before
 * encryption was introduced are returned as-is.
 */
export const decrypt = (value) => {
  if (!value || typeof value !== "string" || !value.startsWith(PREFIX)) {
    return value;
  }
  try {
    const raw = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
};

/** Mongoose field options that transparently encrypt a string at rest. */
export const encryptedString = { type: String, set: encrypt, get: decrypt };

/** Constant-time comparison for secrets of possibly different lengths. */
export const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};
