import { z } from "zod";

// User types based on Firebase Auth and Realtime Database structure
export const userRoles = [
  "murid",
  "ketua_kelas", 
  "wakil_ketua",
  "bendahara",
  "sekretaris",
  "seksi_kebersihan",
  "seksi_keamanan",
  "admin"
] as const;

export type UserRole = typeof userRoles[number];

export const userSchema = z.object({
  uid: z.string(),
  nama: z.string(),
  email: z.string().email(),
  kelas: z.string(),
  tanggal_lahir: z.string(),
  role: z.enum(userRoles),
  isAdmin: z.boolean().default(false),
});

export const kasSchema = z.object({
  uid: z.string(),
  total: z.number(),
  status: z.enum(["sudah", "belum"]),
  riwayat: z.record(z.number()),
});

export const jadwalSchema = z.object({
  pelajaran: z.record(z.array(z.string())),
  piket: z.record(z.array(z.string())),
});

export const prSchema = z.object({
  id: z.string(),
  judul: z.string(),
  isi: z.string(),
  pengirim: z.string(),
  timestamp: z.string(),
  priority: z.enum(["urgent", "normal", "ringan"]).default("normal"),
});

export const infoSchema = z.object({
  id: z.string(),
  judul: z.string(),
  isi: z.string(),
  pengirim: z.string(),
  timestamp: z.string(),
  pin: z.boolean().default(false),
});

export const chatSchema = z.object({
  id: z.string(),
  from: z.string(),
  message: z.string(),
  timestamp: z.string(),
});

export const diskusiSchema = z.object({
  id: z.string(),
  judul: z.string(),
  dibuat_oleh: z.string(),
  timestamp: z.string(),
  isi: z.record(z.object({
    from: z.string(),
    pesan: z.string(),
    timestamp: z.string(),
  })),
});

export const ucapanUltahSchema = z.object({
  uid: z.string(),
  tanggal_lahir: z.string(),
  ucapan: z.record(z.object({
    from: z.string(),
    pesan: z.string(),
    timestamp: z.string(),
  })),
});

export const gameSchema = z.object({
  id: z.string(),
  judul: z.string(),
  link: z.string(),
});

export const pengaturanSchema = z.object({
  nama_kelas: z.string(),
  warna_tema: z.string(),
  versi_aplikasi: z.string(),
});

export type User = z.infer<typeof userSchema>;
export type Kas = z.infer<typeof kasSchema>;
export type Jadwal = z.infer<typeof jadwalSchema>;
export type PR = z.infer<typeof prSchema>;
export type Info = z.infer<typeof infoSchema>;
export type Chat = z.infer<typeof chatSchema>;
export type Diskusi = z.infer<typeof diskusiSchema>;
export type UcapanUltah = z.infer<typeof ucapanUltahSchema>;
export type Game = z.infer<typeof gameSchema>;
export type Pengaturan = z.infer<typeof pengaturanSchema>;
