# Firebase Setup Guide untuk Class Teknik

## Langkah 1: Import Data ke Firebase Realtime Database

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Klik "Realtime Database" di menu sebelah kiri
4. Klik tombol "Import JSON" (ikon import di sebelah kanan)
5. Upload file `firebase-data.json` yang sudah disediakan
6. Klik "Import" untuk mengimpor semua data

## Langkah 2: Setup Security Rules

1. Masih di halaman Realtime Database
2. Klik tab "Rules" di bagian atas
3. Hapus semua rules yang ada
4. Copy-paste isi dari file `firebase-rules.json` ke editor rules
5. Klik "Publish" untuk menyimpan rules

## Langkah 3: Aktivasi Authentication

1. Klik "Authentication" di menu sebelah kiri
2. Klik tab "Sign-in method"
3. Enable "Email/Password" provider
4. Klik "Save"

## Langkah 4: Buat Akun Admin

1. Klik tab "Users" di Authentication
2. Klik "Add user"
3. Email: `admin@classteknik.com`
4. Password: `admin123` (ganti dengan password yang kuat)
5. Klik "Add user"
6. **PENTING**: Copy User UID yang dihasilkan
7. Ganti `YcAkHiKAQHdFdKBqxgNElRvB3fD2` di file `firebase-data.json` dengan UID yang baru
8. Import ulang data JSON dengan UID yang benar

## Struktur Data yang Dibuat

- **users**: Data profil semua pengguna kelas
- **kas**: Data kas kelas per siswa
- **jadwal**: Jadwal pelajaran dan piket harian
- **pr**: Daftar PR/tugas kelas
- **info**: Pengumuman dan informasi kelas
- **chat**: Pesan chat real-time
- **diskusi**: Forum diskusi kelas
- **ucapan_ultah**: Ucapan ulang tahun siswa
- **games**: Link game edukasi
- **pengaturan**: Konfigurasi aplikasi

## Fitur Keamanan yang Diterapkan

✅ **Role-based Access Control**: Setiap role memiliki akses yang berbeda
✅ **Data Validation**: Semua input divalidasi format dan panjangnya
✅ **Authentication Required**: Hanya user yang login yang bisa akses
✅ **Admin Controls**: Admin dapat mengelola semua data
✅ **Anti-Spam Protection**: Batas karakter untuk mencegah spam
✅ **Secure User Management**: User hanya bisa edit data sendiri

## Role Permissions

- **Admin**: Full access ke semua fitur
- **Ketua Kelas**: Kelola jadwal, info, diskusi
- **Bendahara**: Kelola kas kelas
- **Sekretaris**: Kelola jadwal, info
- **Murid**: Akses semua fitur, tapi tidak bisa edit data sensitif

Setelah setup selesai, aplikasi Class Teknik akan berfungsi penuh tanpa error!