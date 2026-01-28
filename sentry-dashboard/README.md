# Sentry Dashboard

**Sentry Dashboard** adalah aplikasi monitoring server modern yang dibangun dengan Next.js. Dashboard ini dirancang untuk memantau status server, aktivitas SSH, dan memberikan visualisasi data secara real-time dengan tampilan antarmuka yang premium (Glassmorphism).

![Sentry Dashboard](https://via.placeholder.com/800x400?text=Sentry+Dashboard+Preview)

## 🚀 Fitur Utama

### 1. 📊 Real-time Monitoring
- **Server Grid**: Monitor status multiple server (Active/Offline) dalam tampilan grid (`/nodes`).
- **Visual Charts**: 
  - **Area Chart**: Visualisasi traffic/aktivitas SSH dalam rentang waktu tertentu.
  - **Pie Chart**: Distribusi status server (Active vs Offline).
- **Time Filter**: Filter data grafik berdasarkan waktu (1 Jam, 6 Jam, 24 Jam, dll).

### 2. 🔐 Autentikasi & Keamanan
- **Secure Login**: Sistem login dengan JWT (JSON Web Token).
- **Split Layout Design**: Halaman login modern dengan animasi visual.
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Akses penuh (termasuk kelola user).
  - **Operator**: Akses monitoring dan setup agent.
  - **Viewer**: Hanya akses read-only (lihat dashboard).

### 3. 👥 Manajemen User (CRUD)
- **Kelola User**: Admin dapat menambah, mengedit, dan menghapus user.
- **Support Multi-Database**: Sistem user backend mendukung berbagai database melalui **Adapter Pattern**:
  - **Memory** (Default): Data hilang saat restart (cocok untuk demo).
  - **SQLite**: Database file ringan.
  - **MySQL**: Database relasional standar.
  - **PostgreSQL**: Database enterprise.

### 4. 🎨 Design System Premium
- **Glassmorphism**: Efek blur dan transparansi modern.
- **Dark Mode**: Tema gelap yang nyaman di mata.
- **Responsive**: Tampilan optimal di desktop dan mobile.
- **Micro-animations**: Interaksi UI yang halus dan menarik.

---

## 🛠️ Teknologi

- **Frontend**: Next.js 14+, React, Tailwind CSS (Custom Variables).
- **Charts**: Recharts.
- **Backend API**: Next.js API Routes.
- **Auth**: JWT (jsonwebtoken), bcryptjs.
- **Database**: 
  - `better-sqlite3` (SQLite)
  - `mysql2` (MySQL)
  - `pg` (PostgreSQL)

---

## 📦 Instalasi & Menjalankan

### Persyaratan
- Node.js v18+
- npm / yarn / pnpm

### 1. Setup Environment
Copy file `.env.example` ke `.env`:

```bash
cp .env.example .env
```
Secara default, dashboard menggunakan **Memory Database** (tidak perlu setup database eksternal).

### 2. Install Dependencies
```bash
npm install
```

### 3. Jalankan Mode Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser.

### Login Default:
- **Admin**: `admin@bapenda.go.id` / `admin123`
- **Operator**: `operator@bapenda.go.id` / `operator123`
- **Viewer**: `viewer@bapenda.go.id` / `viewer123`

---

## ⚙️ Konfigurasi Database (Opsional)

Jika ingin menggunakan database persisten (bukan Memory), edit file `.env`:

### Menggunakan SQLite
```env
DB_TYPE=sqlite
DB_FILENAME=sentry.db
```

### Menggunakan MySQL
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sentry
DB_USER=root
DB_PASSWORD=password
```
*(Pastikan sudah meng-uncomment `case 'mysql'` di file `lib/db/index.ts`)*

---

## 📂 Struktur Project

```
sentry-dashboard/
├── app/
│   ├── api/             # Backend API Routes (Auth, Users, Nodes)
│   ├── components/      # Reusable UI Components (Sidebar, Charts)
│   ├── login/           # Halaman Login
│   ├── users/           # Halaman Manajemen User
│   ├── globals.css      # Global Styles & Design System
│   └── layout.tsx       # Main Layout (Sidebar wrapper)
├── lib/
│   └── db/              # Database Logic
│       ├── index.ts     # DB Manager (Factory Pattern)
│       ├── types.ts     # Interfaces
│       └── *-adapter.ts # Adapters (Memory, SQLite, MySQL, PG)
├── public/              # Static Assets (Images, Icons)
└── next.config.ts       # Next.js Config (External Packages)
```

---

## 🛡️ Catatan Deployment (Docker)

Jika mendeploy menggunakan Docker, pastikan untuk merebuild image setiap kali ada perubahan konfigurasi database atau kode.

```bash
docker build -t sentry-dashboard .
docker run -d -p 3000:3000 sentry-dashboard
```
