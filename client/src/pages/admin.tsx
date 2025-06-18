import { useEffect, useState } from "react";
import { ref, onValue, set, remove } from "firebase/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { database, auth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { User, userRoles, UserRole, Pengaturan } from "@shared/schema";
import { 
  Settings, 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  Palette,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly>
      {(user) => <AdminContent user={user} />}
    </ProtectedRoute>
  );
}

function AdminContent({ user }: { user: User }) {
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pengaturan, setPengaturan] = useState<Pengaturan>({
    nama_kelas: "12 C Teknik",
    warna_tema: "#1E3A8A",
    versi_aplikasi: "v1.0.0"
  });
  const [newUser, setNewUser] = useState({
    nama: "",
    email: "",
    password: "",
    kelas: "12 C Teknik",
    tanggal_lahir: "",
    role: "murid" as UserRole,
    isAdmin: false
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Load all users
    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = Object.values(snapshot.val()) as User[];
        setAllUsers(usersData.sort((a, b) => a.nama.localeCompare(b.nama)));
      }
    });

    // Load pengaturan
    const pengaturanRef = ref(database, 'pengaturan');
    const unsubscribePengaturan = onValue(pengaturanRef, (snapshot) => {
      if (snapshot.exists()) {
        setPengaturan(snapshot.val() as Pengaturan);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribePengaturan();
    };
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.nama.trim() || !newUser.email.trim() || !newUser.password.trim() || creating) return;

    setCreating(true);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      const uid = userCredential.user.uid;
      
      // Create user data in Realtime Database
      const userData: User = {
        uid,
        nama: newUser.nama.trim(),
        email: newUser.email.trim(),
        kelas: newUser.kelas,
        tanggal_lahir: newUser.tanggal_lahir,
        role: newUser.role,
        isAdmin: newUser.isAdmin,
      };
      
      await set(ref(database, `users/${uid}`), userData);
      
      // Initialize kas data for new user
      await set(ref(database, `kas/${uid}`), {
        uid,
        total: 0,
        status: "belum",
        riwayat: {}
      });
      
      setNewUser({
        nama: "",
        email: "",
        password: "",
        kelas: "12 C Teknik",
        tanggal_lahir: "",
        role: "murid",
        isAdmin: false
      });
      
      toast({
        title: "User berhasil dibuat",
        description: `${userData.nama} telah ditambahkan ke kelas`,
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Gagal membuat user",
        description: error.message || "Terjadi kesalahan saat membuat user",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser || updating) return;

    setUpdating(true);
    try {
      await set(ref(database, `users/${editingUser.uid}`), editingUser);
      setEditingUser(null);
      toast({
        title: "User berhasil diperbarui",
        description: `Data ${editingUser.nama} telah diperbarui`,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Gagal memperbarui user",
        description: "Terjadi kesalahan saat memperbarui user",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (userToDelete.uid === user.uid) {
      toast({
        title: "Tidak dapat menghapus",
        description: "Anda tidak dapat menghapus akun sendiri",
        variant: "destructive",
      });
      return;
    }

    try {
      await remove(ref(database, `users/${userToDelete.uid}`));
      await remove(ref(database, `kas/${userToDelete.uid}`));
      toast({
        title: "User berhasil dihapus",
        description: `${userToDelete.nama} telah dihapus dari sistem`,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Gagal menghapus user",
        description: "Terjadi kesalahan saat menghapus user",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePengaturan = async () => {
    try {
      await set(ref(database, 'pengaturan'), pengaturan);
      toast({
        title: "Pengaturan berhasil disimpan",
        description: "Perubahan pengaturan telah diterapkan",
      });
    } catch (error) {
      console.error("Error updating pengaturan:", error);
      toast({
        title: "Gagal menyimpan pengaturan",
        description: "Terjadi kesalahan saat menyimpan pengaturan",
        variant: "destructive",
      });
    }
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

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-primary" />
            Admin Panel
          </h1>
          <p className="text-gray-600">Manajemen pengguna dan pengaturan sistem Class Teknik</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Manajemen User</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Pengaturan</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total User</p>
                      <p className="text-2xl font-bold text-gray-900">{allUsers.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Admin</p>
                      <p className="text-2xl font-bold text-red-600">
                        {allUsers.filter(u => u.isAdmin).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pengurus</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {allUsers.filter(u => u.role !== "murid" && u.role !== "admin").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Murid</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {allUsers.filter(u => u.role === "murid").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Add User Button */}
            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Tambah User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Tambah User Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nama">Nama Lengkap</Label>
                      <Input
                        id="nama"
                        placeholder="Nama lengkap..."
                        value={newUser.nama}
                        onChange={(e) => setNewUser(prev => ({ ...prev, nama: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Password..."
                        value={newUser.password}
                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                      <Input
                        id="tanggal_lahir"
                        type="date"
                        value={newUser.tanggal_lahir}
                        onChange={(e) => setNewUser(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {userRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {getRoleDisplayName(role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isAdmin"
                        checked={newUser.isAdmin}
                        onCheckedChange={(checked) => setNewUser(prev => ({ ...prev, isAdmin: checked }))}
                      />
                      <Label htmlFor="isAdmin">Admin Access</Label>
                    </div>
                    <Button 
                      onClick={handleCreateUser} 
                      disabled={creating || !newUser.nama.trim() || !newUser.email.trim() || !newUser.password.trim()}
                      className="w-full"
                    >
                      {creating ? "Membuat..." : "Buat User"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers.map((userData) => (
                    <div key={userData.uid} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-10 h-10 bg-primary">
                          <AvatarFallback className="text-white">
                            {userData.nama.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{userData.nama}</p>
                          <p className="text-sm text-gray-500">{userData.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <Badge className={getRoleColor(userData.role)}>
                            {getRoleDisplayName(userData.role)}
                          </Badge>
                          {userData.isAdmin && (
                            <Badge className="ml-1 bg-red-100 text-red-800">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex space-x-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingUser(userData)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit User - {userData.nama}</DialogTitle>
                              </DialogHeader>
                              {editingUser && (
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="edit-nama">Nama Lengkap</Label>
                                    <Input
                                      id="edit-nama"
                                      value={editingUser.nama}
                                      onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, nama: e.target.value }) : null)}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-role">Role</Label>
                                    <Select 
                                      value={editingUser.role} 
                                      onValueChange={(value: UserRole) => setEditingUser(prev => prev ? ({ ...prev, role: value }) : null)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {userRoles.map((role) => (
                                          <SelectItem key={role} value={role}>
                                            {getRoleDisplayName(role)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id="edit-isAdmin"
                                      checked={editingUser.isAdmin}
                                      onCheckedChange={(checked) => setEditingUser(prev => prev ? ({ ...prev, isAdmin: checked }) : null)}
                                    />
                                    <Label htmlFor="edit-isAdmin">Admin Access</Label>
                                  </div>
                                  <Button 
                                    onClick={handleUpdateUser} 
                                    disabled={updating}
                                    className="w-full"
                                  >
                                    {updating ? "Menyimpan..." : "Simpan Perubahan"}
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(userData)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={userData.uid === user.uid}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Pengaturan Aplikasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nama_kelas">Nama Kelas</Label>
                  <Input
                    id="nama_kelas"
                    value={pengaturan.nama_kelas}
                    onChange={(e) => setPengaturan(prev => ({ ...prev, nama_kelas: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="warna_tema">Warna Tema (Hex)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="warna_tema"
                      value={pengaturan.warna_tema}
                      onChange={(e) => setPengaturan(prev => ({ ...prev, warna_tema: e.target.value }))}
                      placeholder="#1E3A8A"
                    />
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: pengaturan.warna_tema }}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="versi_aplikasi">Versi Aplikasi</Label>
                  <Input
                    id="versi_aplikasi"
                    value={pengaturan.versi_aplikasi}
                    onChange={(e) => setPengaturan(prev => ({ ...prev, versi_aplikasi: e.target.value }))}
                  />
                </div>
                <Button onClick={handleUpdatePengaturan}>
                  Simpan Pengaturan
                </Button>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Info className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Informasi Sistem</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Total User: {allUsers.length} orang</li>
                      <li>• Admin: {allUsers.filter(u => u.isAdmin).length} orang</li>
                      <li>• Versi: {pengaturan.versi_aplikasi}</li>
                      <li>• Database: Firebase Realtime Database</li>
                      <li>• Autentikasi: Firebase Authentication</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
