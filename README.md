# 🎭 Playwright Grid + Jenkins CI/CD

Proyek automation testing menggunakan **Playwright** yang dijalankan di atas **Docker Grid** (Chromium & Firefox), terintegrasi dengan **Jenkins CI/CD** dan **GitHub**, serta menghasilkan laporan **Allure** dan **Playwright HTML Report**.

---

## 📋 Daftar Isi

1. [Arsitektur & Alur Kerja](#arsitektur--alur-kerja)
2. [Prasyarat](#prasyarat)
3. [Struktur Proyek](#struktur-proyek)
4. [Setup Lokal](#setup-lokal)
5. [Menjalankan Test Secara Lokal](#menjalankan-test-secara-lokal)
6. [Setup Jenkins](#setup-jenkins)
7. [Setup Credentials di Jenkins](#setup-credentials-di-jenkins)
8. [Membuat Pipeline Job di Jenkins](#membuat-pipeline-job-di-jenkins)
9. [Alur Pipeline Jenkins (CI/CD)](#alur-pipeline-jenkins-cicd)
10. [Melihat Laporan](#melihat-laporan)
11. [Troubleshooting](#troubleshooting)

---

## Arsitektur & Alur Kerja

```
GitHub (push/trigger)
        │
        ▼
   Jenkins Pipeline
        │
        ├─► Checkout kode dari GitHub
        ├─► npm ci (install dependencies)
        ├─► docker-compose up (jalankan Grid)
        │       ├─ playwright-chromium  (ws://localhost:3001)
        │       └─ playwright-firefox   (ws://localhost:3002)
        ├─► npx playwright test (jalankan semua test di Grid)
        ├─► Generate Allure Report
        ├─► docker-compose down (matikan Grid)
        └─► Push report ke GitHub
```

---

## Prasyarat

Pastikan semua tools berikut sudah terinstall di mesin Jenkins / lokal kamu:

| Tool | Versi Minimum | Cek Instalasi |
|------|--------------|---------------|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| Docker | 20+ | `docker -v` |
| Docker Compose | 2+ | `docker compose version` |
| Git | 2+ | `git --version` |
| Java (untuk Jenkins) | 17+ | `java -version` |
| Jenkins | 2.400+ | — |
| Allure CLI | 2.25+ | `allure --version` |

---

## Struktur Proyek

```
playwright-grid/
├── login.spec.js          # File test utama (OrangeHRM login tests)
├── playwright.config.js   # Konfigurasi Playwright + Grid endpoints
├── docker-compose.yml     # Definisi service Chromium & Firefox Grid
├── Dockerfile             # (opsional) custom image
├── Jenkinsfile            # Definisi pipeline CI/CD Jenkins
├── package.json           # Dependensi & npm scripts
├── allure-results/        # Hasil mentah test (di-generate otomatis)
├── allure-report/         # Laporan Allure HTML (di-generate otomatis)
└── playwright-report/     # Laporan Playwright HTML (di-generate otomatis)
```

---

## Setup Lokal

### 1. Clone Repositori

```bash
git clone https://github.com/hilman-firdd/playwright-grid-jenkins.git
cd playwright-grid-jenkins
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Jalankan Docker Grid

```bash
# Jalankan Chromium Grid (port 3001) dan Firefox Grid (port 3002)
npm run grid:up

# Verifikasi container berjalan
docker ps
```

Kamu akan melihat dua container aktif:
- `playwright-chromium` → `ws://localhost:3001`
- `playwright-firefox` → `ws://localhost:3002`

---

## Menjalankan Test Secara Lokal

> **Pastikan Docker Grid sudah berjalan** sebelum menjalankan test.

```bash
# Jalankan semua test (Chromium + Firefox)
npm test

# Jalankan hanya di Chromium
npm run test:chromium

# Jalankan hanya di Firefox
npm run test:firefox
```

### Melihat Laporan Lokal

```bash
# Playwright HTML Report
npm run test:report

# Generate & buka Allure Report
npm run allure:generate
npm run allure:open
```

### Matikan Grid setelah selesai

```bash
npm run grid:down
```

---

## Setup Jenkins

### 1. Install Jenkins

```bash
# macOS (Homebrew)
brew install jenkins-lts
brew services start jenkins-lts

# Akses Jenkins di: http://localhost:8080
```

### 2. Install Plugin yang Diperlukan

Di Jenkins → **Manage Jenkins** → **Manage Plugins** → tab **Available**, install:

- ✅ **NodeJS Plugin** — untuk menjalankan `npm`
- ✅ **HTML Publisher Plugin** — untuk Playwright HTML Report
- ✅ **Allure Jenkins Plugin** — untuk Allure Report
- ✅ **Git Plugin** — untuk checkout dari GitHub
- ✅ **Pipeline Plugin** — untuk membaca `Jenkinsfile`
- ✅ **Credentials Binding Plugin** — untuk menyimpan token GitHub

Klik **Install without restart** lalu restart Jenkins.

### 3. Konfigurasi NodeJS di Jenkins

Pergi ke **Manage Jenkins** → **Global Tool Configuration** → bagian **NodeJS**:

- Klik **Add NodeJS**
- **Name**: `NodeJS` _(harus sama persis dengan di Jenkinsfile)_
- **Version**: pilih versi LTS terbaru
- Klik **Save**

### 4. Konfigurasi Allure di Jenkins

Pergi ke **Manage Jenkins** → **Global Tool Configuration** → bagian **Allure Commandline**:

- Klik **Add Allure Commandline**
- **Name**: `allure`
- **Version**: pilih versi terbaru
- Klik **Save**

---

## Setup Credentials di Jenkins

Token GitHub dibutuhkan agar Jenkins bisa push report ke repositori.

### 1. GitHub Personal Access Token (PAT)

1. **Buat Personal Access Token (PAT) di GitHub**
   - Pergi ke GitHub → **Settings** → **Developer Settings** → **Personal access tokens** → **Tokens (classic)**
   - Klik **Generate new token**
   - Beri nama token (contoh: `jenkins-ci`)
   - Centang scope: `repo` (full control of private repositories)
   - Klik **Generate token** dan **simpan tokennya** (hanya tampil sekali!)

2. **Tambahkan Credentials ke Jenkins**
   - Pergi ke **Jenkins** → **Manage Jenkins** → **Manage Credentials**
   - Pilih scope **Global** → klik **Add Credentials**
   - **Kind**: `Username with password`
   - **Username**: username GitHub kamu (contoh: `hilman-firdd`)
   - **Password**: tempel Personal Access Token yang sudah dibuat
   - **ID**: `github-credentials` _(harus sama persis dengan di Jenkinsfile)_
   - Klik **Save**

### 2. Neo Object Storage (NOS) S3 Credentials

Laporan akan di-upload ke NOS S3. Simpan Access Key di Jenkins:

1. Pergi ke **Jenkins** → **Manage Jenkins** → **Manage Credentials**
2. Pilih scope **Global** → klik **Add Credentials**
3. **Kind**: `Username with password`
4. **Username**: isi dengan `AWS_ACCESS_KEY_ID` kamu
5. **Password**: isi dengan `AWS_SECRET_ACCESS_KEY` kamu
6. **ID**: `nos-s3-credentials` _(harus sama persis dengan di Jenkinsfile)_
7. Klik **Save**

> ⚠️ **Jangan pernah** menyimpan kredensial langsung di `Jenkinsfile` atau commit file `.env` ke GitHub.
> Salin `.env.example` → `.env` untuk penggunaan lokal.

### 3. Install AWS CLI di mesin Jenkins

```bash
# macOS
brew install awscli

# Ubuntu/Debian (mesin Jenkins)
sudo apt-get install -y awscli

# Verifikasi
aws --version
```

---

## Membuat Pipeline Job di Jenkins

1. Dari dashboard Jenkins, klik **New Item**
2. Masukkan nama job, pilih **Pipeline**, klik **OK**
3. Di bagian **Pipeline**:
   - **Definition**: pilih `Pipeline script from SCM`
   - **SCM**: pilih `Git`
   - **Repository URL**: `https://github.com/hilman-firdd/playwright-grid-jenkins.git`
   - **Branch**: `*/master`
   - **Script Path**: `Jenkinsfile`
4. _(Opsional)_ Di bagian **Build Triggers**, centang **Poll SCM** atau **GitHub hook trigger for GITScm polling** agar pipeline otomatis berjalan saat ada push ke GitHub
5. Klik **Save**
6. Klik **Build Now** untuk menjalankan pipeline pertama kali

---

## Alur Pipeline Jenkins (CI/CD)

Pipeline terdiri dari **8 stage**:

| # | Stage | Deskripsi |
|---|-------|-----------|
| 1 | **Checkout** | Ambil kode terbaru dari branch `master` di GitHub |
| 2 | **Install Dependencies** | Jalankan `npm ci` untuk install semua package |
| 3 | **Start Playwright Grid** | Jalankan `docker-compose up -d` → aktifkan Chromium & Firefox server |
| 4 | **Run Playwright Tests** | Jalankan semua test spec, hasilkan Playwright HTML Report |
| 5 | **Generate Allure Report** | Generate laporan Allure dari hasil test |
| 6 | **Stop Playwright Grid** | Jalankan `docker-compose down` → matikan container |
| 7 | **Upload Report to NOS S3** | Upload `playwright-report/` & `allure-report/` ke Neo Object Storage |
| 8 | **Push Allure Report to GitHub** | Commit & push hasil report ke branch `master` |

---

## Melihat Laporan

Setelah pipeline selesai, laporan tersedia di:

| Laporan | Lokasi |
|---------|--------|
| Playwright HTML (Jenkins) | Tab **Playwright HTML Report** di halaman build Jenkins |
| Allure (Jenkins) | Tab **Allure Report** di halaman build Jenkins |
| Playwright HTML (Public) | `https://nos.jkt-1.neo.id/playwright-report/playwright-report/index.html` |
| Allure (Public) | `https://nos.jkt-1.neo.id/playwright-report/allure-report/index.html` |
| GitHub | Folder `allure-report/` dan `playwright-report/` di branch `master` |

---

## Troubleshooting

### Docker tidak bisa dijalankan dari Jenkins
Pastikan user Jenkins memiliki akses ke Docker:
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### `npm ci` gagal karena tidak ada `package-lock.json`
Jalankan dulu secara lokal:
```bash
npm install
git add package-lock.json
git commit -m "add package-lock.json"
git push
```

### Credential ID tidak ditemukan
Pastikan **ID** di Jenkins Credentials persis sama dengan yang ada di `Jenkinsfile`: `github-credentials`.

### Port 3001/3002 sudah dipakai
Hentikan container yang lama terlebih dahulu:
```bash
docker-compose down
docker ps -a  # cek container yang masih hidup
docker rm -f <container_id>
```

### Test gagal karena Grid belum siap
Naikkan nilai `sleep` di Jenkinsfile pada stage **Start Playwright Grid**:
```groovy
sh 'sleep 10' // tambah waktu tunggu
```
