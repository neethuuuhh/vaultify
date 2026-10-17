# Vaultify — Threat Model & Security Policy

## Core Principle: Zero-Knowledge Architecture
Vaultify operates under a strict **Zero-Knowledge Architecture**. The backend server is designed as a "dumb storage locker" that only receives, stores, and serves encrypted blobs (`vault_blob`). At no point does the server receive, process, or store the user's plaintext Master Password or Encryption Key.

---

## 🔒 Primary Threat Analysis

### Question: What happens if the user forgets their Master Password?
**Answer:** The stored vault data is permanently lost and mathematically unrecoverable. 

### Why is this a feature, not a bug?
In traditional web applications, account recovery relies on administrative backdoors, master recovery keys stored on servers, or reset links sent via email. For a password manager, any mechanism that allows a third party or automated process to reset access implies that the server possesses (or can generate) the decryption key.

In Vaultify:
1. **No Server-Side Master Password Storage:** The Master Password never leaves the user's browser memory.
2. **Key Derivation via PBKDF2:** The Encryption Key is derived client-side using PBKDF2 with high iteration counts and a unique user salt[cite: 2]. The server only sees an Auth Key for login verification[cite: 2].
3. **AES-256-GCM Encryption:** All vault payload data is encrypted locally using AES-256-GCM before transmission[cite: 2]. Without the Master Password to re-derive the exact Encryption Key, the `vault_blob` remains unreadable mathematical noise.

Eliminating server-side recovery guarantees that even if the backend database is entirely compromised or leaked, attackers gain access to nothing more than encrypted, unreadable text blobs[cite: 1, 2].