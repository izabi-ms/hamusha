import { db } from '../db';

function generateId(): string {
  return crypto.randomUUID();
}

function generateOTP(length: number = 6): string {
  return Math.floor(10 ** (length - 1) + Math.random() * 9 * 10 ** (length - 1)).toString();
}

export async function createOTP(
  identifier: string,
  type: 'register' | 'login' | 'verify',
  expiresInMinutes: number = 10
): Promise<string> {
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await db.run(
    `INSERT INTO otp_codes (id, identifier, code, type, expires_at, used, created_at)
     VALUES (?, ?, ?, ?, ?, ?, unixepoch())`,
    generateId(), identifier, code, type, expiresAt.getTime(), 0
  );

  // In production, send via SMS/Email service
  console.log(`[OTP] ${identifier} (${type}): ${code}`);
  
  return code;
}

export async function verifyOTP(
  identifier: string,
  code: string,
  type: 'register' | 'login' | 'verify'
): Promise<boolean> {
  const result = await db.get(
    `SELECT id FROM otp_codes 
     WHERE identifier = ? AND code = ? AND type = ? AND used = 0 AND expires_at > ?
     LIMIT 1`,
    identifier, code, type, Date.now()
  );

  if (!result) return false;

  await db.run(
    `UPDATE otp_codes SET used = 1 WHERE id = ?`,
    result.id
  );

  return true;
}

export async function cleanupExpiredOTPs(): Promise<void> {
  await db.run(
    `DELETE FROM otp_codes WHERE expires_at < ?`,
    Date.now()
  );
}