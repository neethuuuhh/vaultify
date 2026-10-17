# 🛡️ Vaultify — Zero-Knowledge Password Manager

Vaultify is a secure, lightweight, client-side encrypted password manager built as a zero-knowledge web application. 

## 🏗️ Architecture & Security Design
Vaultify operates under a strict **Zero-Knowledge Architecture**. The backend server functions solely as a "dumb storage locker" that stores encrypted data blobs (`vault_blob`). The server never has access to the user's plaintext master password or encryption keys.

- **Client-Side Cryptography:** Uses PBKDF2 for key derivation and AES-256-GCM for encryption/decryption entirely in the browser.
- **Dual-Key Separation:** Splits authentication and encryption keys so the server can verify identity without ever seeing encryption materials.

### Cryptographic Flow Diagram│ 
                         ┌───────────────────────────────┐
                         │     User Master Password      │
                         └──────────────┬────────────────┘
                                        │
                              PBKDF2 (Key Derivation)
                                        │
                ┌───────────────────────┴───────────────────────┐
                ▼                                               ▼
      ┌───────────────────┐                           ┌───────────────────┐
      │     Auth Key      │                           │  Encryption Key   │
      └─────────┬─────────┘                           └─────────┬─────────┘
                │                                               │
         Sent to Server                                  Kept in Memory
                │                                               │
                ▼                                               ▼
     ┌─────────────────────┐                         ┌─────────────────────┐
     │  Server Verification│                         │  AES-256-GCM Local  │
     │     & JWT Issue     │                         │ Encrypt / Decrypt   │
     └─────────────────────┘                         └─────────────────────┘
     ---

## 🛠️ Tech Stack
- **Frontend:** React, Vite
- **Backend:** Node.js, Express
- **Database:** SQLite (storing encrypted blobs and authentication salts)
- **Security:** Web Crypto API (SubtleCrypto), PBKDF2, AES-GCM

---

## 🚀 Getting Started

### 1. Clone the repository
\`\`\`bash
git clone <your-repository-url>
cd vaultify
\`\`\`

### 2. Run the Backend Server
\`\`\`bash
cd server
npm install
node server.js
\`\`\`

### 3. Run the Frontend Client
\`\`\`bash
cd client
npm install
npm run dev
\`\`\`