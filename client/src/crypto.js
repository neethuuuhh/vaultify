const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function generateSalt() {
  const array = window.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function deriveKeys(masterPassword, saltHex) {
  const salt = Uint8Array.from(saltHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const encryptionKey = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const authKeyBuffer = await window.crypto.subtle.digest(
    "SHA-256",
    encoder.encode(masterPassword + saltHex)
  );
  const authKey = Array.from(new Uint8Array(authKeyBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return { encryptionKey, authKey };
}

export async function encryptVault(vaultData, encryptionKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(JSON.stringify(vaultData));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    encryptionKey,
    encoded
  );
  return {
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    data: Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, '0')).join('')
  };
}

export async function decryptVault(encryptedPayload, encryptionKey) {
  if (!encryptedPayload || !encryptedPayload.iv || !encryptedPayload.data) return [];
  const iv = Uint8Array.from(encryptedPayload.iv.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  const data = Uint8Array.from(encryptedPayload.data.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    encryptionKey,
    data
  );
  return JSON.parse(decoder.decode(decrypted));
}

export function generatePassword(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  let result = "";
  const array = window.crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}