<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/Go-1.21+-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go"/>
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License"/>
</p>

<h1 align="center">🛡️ Sentry Dashboard</h1>

<p align="center">
  <strong>Platform Monitoring Keamanan Server Modern</strong><br>
  Real-time monitoring, SSH event tracking, dan security analytics dengan tampilan premium.
</p>

---

## ✨ Fitur Utama

<table>
<tr>
<td width="50%">

### 📊 **Dashboard Overview**
- Real-time server monitoring
- Visual charts (Area, Pie, Bar)
- Attack statistics & trends

### 🖥️ **Server Health**
- CPU, Memory, Disk gauges
- Online/Offline status
- Auto-refresh monitoring

### 🔐 **SSH Events Monitor**
- Login attempts tracking
- Brute force detection
- IP-based filtering

</td>
<td width="50%">

### 🗺️ **Geo Map**
- Visualisasi lokasi attacker
- Interactive world map
- Top attacking countries

### 🛡️ **IP Blocklist/Whitelist**
- Block/whitelist IP management
- Toggle status per IP
- Reason logging

### 🔔 **Notification Center**
- Real-time alerts
- Mark as read/unread
- Bulk actions

</td>
</tr>
</table>

### 📋 Fitur Lainnya
- **📈 Reports & Analytics** - Statistik serangan dengan periode custom
- **📄 Logs Viewer** - Real-time log dengan search & filter
- **👥 User Management** - RBAC (Admin, Operator, Viewer)
- **🎨 Dark Mode** - Glassmorphism design premium

---

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                     🌐 Sentry Dashboard                     |
│                      (Next.js Frontend)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     📡 API Routes                           │
│  /api/nodes  /api/events  /api/health  /api/geo  /api/logs   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    🖥️ Sentry Agent (Go)                     │
│               Installed on monitored servers                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Dashboard (Next.js)

```bash
cd sentry-dashboard
npm install
npm run dev
```

Akses: [http://localhost:3000](http://localhost:3000)

### Agent (Go)

```bash
cd sentry-agent
go build -o sentry-agent cmd/agent/main.go
./sentry-agent
```

---

## 🔑 Default Login

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@bapenda.go.id` | `admin123` |
| **Operator** | `operator@bapenda.go.id` | `operator123` |
| **Viewer** | `viewer@bapenda.go.id` | `viewer123` |

---

## 📁 Struktur Project

```
dashboard-security/
├── 📂 sentry-agent/          # Go monitoring agent
│   ├── cmd/agent/            # Main application
│   ├── internal/             # Business logic
│   └── go.mod
│
└── 📂 sentry-dashboard/      # Next.js dashboard
    ├── app/
    │   ├── api/              # Backend API routes
    │   │   ├── nodes/        # Server management
    │   │   ├── events/       # SSH events
    │   │   ├── health/       # Server health
    │   │   ├── geo/          # Geolocation data
    │   │   ├── logs/         # Log viewer
    │   │   ├── reports/      # Analytics
    │   │   ├── iplist/       # IP blocklist/whitelist
    │   │   └── notifications/# Notification center
    │   ├── components/       # Reusable UI components
    │   ├── (pages)/          # Dashboard pages
    │   └── globals.css       # Design system
    ├── lib/                  # Database adapters
    └── data/                 # JSON data storage
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | CSS Variables, Glassmorphism |
| **Charts** | Recharts, react-simple-maps |
| **Backend** | Next.js API Routes |
| **Auth** | JWT, bcryptjs |
| **Agent** | Go 1.21+ |
| **Database** | JSON files, SQLite (optional) |

---

## 🐳 Docker Deployment

### Quick Start dengan Docker

```bash
cd sentry-dashboard

# Build image
docker build -t sentry-dashboard .

# Run container
docker run -d -p 3000:3000 --name sentry-app sentry-dashboard
```

### Menggunakan Docker Compose (Recommended)

```bash
cd sentry-dashboard

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Environment Variables

Buat file `.env` di folder `sentry-dashboard/`:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
```

### Docker Commands Berguna

```bash
# Rebuild image (setelah ada perubahan code)
docker compose up -d --build

# Restart container
docker compose restart

# Check container status
docker compose ps

# Masuk ke container shell
docker exec -it sentry-dashboard sh

# Lihat resource usage
docker stats sentry-dashboard
```

### Production Tips

1. **Ganti JWT_SECRET** - Pastikan menggunakan secret yang kuat
2. **Persist Data** - Volume sudah di-mount untuk folder `/app/data`
3. **Reverse Proxy** - Gunakan Nginx untuk SSL termination:
   ```bash
   docker compose --profile with-nginx up -d
   ```

---

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

<p align="center">
  Made with ❤️ by <strong>Bintang</strong>
</p>
