import { useEffect, useState } from "react";
import { ref, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { User } from "@shared/schema";
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Shield, 
  Edit, 
  Save, 
  X,
  School,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      {(user) => <ProfileContent user={user} />}
    </ProtectedRoute>
  );
}

function ProfileContent({ user }: { user: User }) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState<User>(user);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setEditingUser(user);
  }, [user]);

  const handleSaveProfile = async () => {
    if (!editingUser.nama.trim() || updating) return;

    setUpdating(true);
    try {
      await update(ref(database, `users/${user.uid}`), {
        nama: editingUser.nama.trim(),
        tanggal_lahir: editingUser.tanggal_lahir,
      });
      
      setEditMode(false);
      toast({
        title: "Profile berhasil diperbarui",
        description: "Perubahan profile Anda telah disimpan",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Gagal memperbarui profile",
        description: "Terjadi kesalahan saat menyimpan perubahan",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(user);
    setEditMode(false);
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800",
      ketua_kelas: "bg-purple-100 text-purple-800",
      wakil_ketua: "bg-blue-100 text-blue-800",
      bendahara: "bg-green-100 text-green-800",
      sekretaris: "bg-yellow-100 text-yellow-800",
      seksi_kebersihan: "bg-teal-100 text-teal-800",
      seksi_keamanan: "bg-orange-100 text-orange-800",
      murid: "bg-gray-100 text-gray-800"
    };
    return colors[role] || colors.murid;
  };

  const getRoleDisplayName = (role: string) => {
    const names: Record<string, string> = {
      admin: "Admin",
      ketua_kelas: "Ketua Kelas",
      wakil_ketua: "Wakil Ketua",
      bendahara: "Bendahara",
      sekretaris: "Sekretaris",
      seksi_kebersihan: "Seksi Kebersihan",
      seksi_keamanan: "Seksi Keamanan",
      murid: "Murid"
    };
    return names[role] || role;
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getBirthdayStatus = (birthDate: string) => {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    
    const timeDiff = thisYearBirthday.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff === 0) return "🎉 Selamat ulang tahun!";
    if (daysDiff === 1) return "🎂 Besok ulang tahun!";
    if (daysDiff > 0 && daysDiff <= 7) return `🎈 ${daysDiff} hari lagi ulang tahun`;
    if (daysDiff < 0 && daysDiff >= -7) return `🎁 Baru saja ulang tahun ${Math.abs(daysDiff)} hari lalu`;
    
    return null;
  };

  const age = calculateAge(user.tanggal_lahir);
  const birthdayStatus = getBirthdayStatus(user.tanggal_lahir);

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserIcon className="w-6 h-6 mr-2 text-primary" />
              Profile Saya
            </h1>
            <p className="text-gray-600">Kelola informasi profile Anda</p>
          </div>
          
          {!editMode ? (
            <Button onClick={() => setEditMode(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleSaveProfile} disabled={updating}>
                <Save className="w-4 h-4 mr-2" />
                {updating ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button onClick={handleCancelEdit} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Batal
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4 bg-primary">
                    <AvatarFallback className="text-white text-2xl">
                      {user.nama.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{user.nama}</h3>
                  
                  <div className="space-y-2">
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                    
                    {user.isAdmin && (
                      <Badge className="bg-red-100 text-red-800 ml-2">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  
                  {birthdayStatus && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg">
                      <p className="text-sm font-medium text-pink-800">{birthdayStatus}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Statistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member sejak</span>
                  <span className="text-sm font-medium">2024</span>
                </div>
                {age && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Usia</span>
                    <span className="text-sm font-medium">{age} tahun</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant="outline" className="text-xs">
                    Aktif
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Informasi Pribadi
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nama">Nama Lengkap</Label>
                      {editMode ? (
                        <Input
                          id="nama"
                          value={editingUser.nama}
                          onChange={(e) => setEditingUser(prev => ({ ...prev, nama: e.target.value }))}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded border">
                          {user.nama}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="mt-1 flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                      {editMode ? (
                        <Input
                          id="tanggal_lahir"
                          type="date"
                          value={editingUser.tanggal_lahir}
                          onChange={(e) => setEditingUser(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {formatDate(user.tanggal_lahir)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label>Kelas</Label>
                      <div className="mt-1 flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                        <School className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{user.kelas}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Role Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Peran & Akses
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Role</Label>
                      <div className="mt-1 flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Status Admin</Label>
                      <div className="mt-1 flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                        {user.isAdmin ? (
                          <Badge className="bg-red-100 text-red-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin Access
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            User Biasa
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">Hak Akses Anda:</h5>
                    <ul className="text-xs text-blue-800 space-y-1">
                      {user.role === "ketua_kelas" && (
                        <>
                          <li>• Dapat membuat dan menghapus PR/tugas</li>
                          <li>• Dapat mem-pin info penting</li>
                          <li>• Dapat mengatur jadwal piket</li>
                          <li>• Dapat mengelola kas kelas</li>
                        </>
                      )}
                      {user.role === "wakil_ketua" && (
                        <>
                          <li>• Dapat mengatur jadwal pelajaran dan piket</li>
                          <li>• Dapat mem-pin diskusi penting</li>
                          <li>• Dapat membuat PR/tugas</li>
                        </>
                      )}
                      {user.role === "bendahara" && (
                        <>
                          <li>• Dapat mengelola kas kelas</li>
                          <li>• Dapat melihat dan mengubah status pembayaran</li>
                          <li>• Dapat mengirim pengingat pembayaran</li>
                        </>
                      )}
                      {user.role === "sekretaris" && (
                        <>
                          <li>• Dapat mengupload file penting</li>
                          <li>• Dapat mengarsipkan PR/tugas</li>
                          <li>• Dapat membuat info kelas</li>
                        </>
                      )}
                      {user.role === "seksi_kebersihan" && (
                        <>
                          <li>• Dapat mengatur jadwal piket</li>
                          <li>• Dapat mengirim pengingat piket</li>
                        </>
                      )}
                      {user.role === "seksi_keamanan" && (
                        <>
                          <li>• Dapat memonitor chat dan diskusi</li>
                          <li>• Dapat mengaktifkan mode moderasi</li>
                        </>
                      )}
                      {user.role === "murid" && (
                        <>
                          <li>• Dapat melihat semua informasi kelas</li>
                          <li>• Dapat berpartisipasi dalam chat dan diskusi</li>
                          <li>• Dapat melihat status kas dan jadwal</li>
                        </>
                      )}
                      {user.isAdmin && (
                        <li>• <strong>Admin:</strong> Akses penuh ke semua fitur dan manajemen user</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Notice */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Keamanan & Privasi</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Jaga kerahasiaan login Anda dan jangan bagikan dengan orang lain</li>
                  <li>• Untuk mengubah email atau password, hubungi admin kelas</li>
                  <li>• Laporkan aktivitas mencurigakan segera ke admin</li>
                  <li>• Data pribadi Anda hanya digunakan untuk keperluan kelas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
