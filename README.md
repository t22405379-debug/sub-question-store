# 🎓 CSE Question-Paper Archive Web Application

A modern, high-performance web application designed for Computer Science & Engineering departments to archive, manage, search, and download question papers across academic years, semesters, subjects, and exam types.

---

## 🛠️ Technology Stack

* **Language:** TypeScript
* **Frontend:** React 18 + Vite
* **Styling:** Tailwind CSS + shadcn/ui aesthetics
* **Backend:** Cloudflare Workers (TypeScript Edge API)
* **Database:** Cloudflare D1 (SQLite)
* **File Storage:** Cloudflare R2 (S3-compatible zero-egress object storage)
* **Authentication:** Multi-Layer Security (PBKDF2/SHA-256 salted credentials, rate limiting, secure sessions)
* **Deployment:** Cloudflare Pages / Workers

---

## 🧭 Academic Syllabus Hierarchy

$$\text{Department} \longrightarrow \text{Year (1st–4th)} \longrightarrow \text{Semester (1st–2nd)} \longrightarrow \text{Subject} \longrightarrow \text{Course Code} \longrightarrow \text{Exam Type} \longrightarrow \text{Question Paper}$$

**Example:**  
`CSE` $\to$ `1st Year` $\to$ `1st Semester` $\to$ `Programming Fundamentals` $\to$ `CSE 1101` $\to$ `Midterm` $\to$ `Question Paper (PDF/Image)`

---

## 🔒 Enterprise Security Features

1. **Cryptographic Key Derivation**: PBKDF2 with SHA-256 and 100,000 iterations + 128-bit unique salts for admin authentication.
2. **Timing Attack Protection**: Constant-time byte-level comparison prevents timing side-channel attacks.
3. **Magic Byte Verification**: Verifies binary headers for `%PDF-`, `\xFF\xD8\xFF` (JPEG), `\x89PNG` to block malicious file spoofing.
4. **Path Traversal Prevention**: Storage keys are generated using randomized UUID hashes and sanitized slugs (`papers/{course_code}/{uuid}_{filename}`).
5. **SQL Injection Immunity**: 100% prepared statements with parameterized inputs (`?`) across all D1 queries.
6. **Automatic Client-Side Compression & Privacy**: Strips camera EXIF GPS/metadata and compresses large phone scans down to ~300KB–600KB WebP before upload.

---

## 💰 100% Free Tier Storage & Hosting Details

| Service | Cloudflare Free Allowance | 400–500 Papers Usage | Cost |
|---|---|---|---|
| **Cloudflare R2** | **10 GB / month free** + 1M writes + 10M reads | ~0.5 GB – 1.2 GB | **$0.00** |
| **Cloudflare D1** | **5 GB storage** + 5M reads/day + 100k writes/day | < 2 MB | **$0.00** |
| **Cloudflare Workers** | **100,000 requests / day free** | ~1k–5k / day | **$0.00** |
| **Cloudflare Pages** | **Unlimited requests & bandwidth** | Unlimited | **$0.00** |

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open your browser at: `http://localhost:3000`

### 3. Default Admin Credentials
* **Username:** `admin`
* **Password:** `admin123`
*(You can change the password at any time inside the Admin Portal)*

---

## ☁️ Production Deployment (Cloudflare)

### 1. Initialize D1 Database
```bash
wrangler d1 create cse_papers_db
# Paste the generated database_id into wrangler.toml
npm run db:init
```

### 2. Create R2 Bucket
```bash
wrangler r2 bucket create cse-question-papers
```

### 3. Build & Deploy
```bash
npm run build
npm run worker:deploy
```
