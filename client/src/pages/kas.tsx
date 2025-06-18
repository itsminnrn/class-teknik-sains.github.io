import { useEffect, useState } from "react";
import { ref, onValue, set, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { User, Kas } from "@shared/schema";
import { DollarSign, Edit, Plus, TrendingUp, Users, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function KasPage() {
  return (
    <ProtectedRoute>
      {(user) => <KasContent user={user} />}
    </ProtectedRoute>
  );
}

function KasContent({ user }: { user: User }) {
  const { toast } = useToast();
  const [kasData, setKasData] = useState<Record<string, Kas>>({});
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState("");
  const [newStatus, setNewStatus] = useState<"sudah" | "belum">("sudah");

  const canEdit = user.role === "bendahara" || user.role === "ketua_kelas" || user.role === "admin" || user.isAdmin;

  useEffect(() => {
    // Load kas data
    const kasRef = ref(database, 'kas');
    const unsubscribeKas = onValue(kasRef, (snapshot) => {
      if (snapshot.exists()) {
        setKasData(snapshot.val() as Record<string, Kas>);
      }
    });

    // Load all users
    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = Object.values(snapshot.val()) as User[];
        setAllUsers(usersData);
        
        // Initialize kas data for users who don't have it
        const kasRef = ref(database, 'kas');
        onValue(kasRef, (kasSnapshot) => {
          const existingKas = kasSnapshot.exists() ? kasSnapshot.val() : {};
          const newKasData: Record<string, Kas> = { ...existingKas };
          
          usersData.forEach(userData => {
            if (!newKasData[userData.uid]) {
              newKasData[userData.uid] = {
                uid: userData.uid,
                total: 0,
                status: "belum",
                riwayat: {}
              };
            }
          });
          
          if (Object.keys(newKasData).length !== Object.keys(existingKas).length) {
            set(ref(database, 'kas'), newKasData);
          }
        }, { onlyOnce: true });
      }
    });

    return () => {
      unsubscribeKas();
      unsubscribeUsers();
    };
  }, []);

  const getUserById = (uid: string) => {
    return allUsers.find(u => u.uid === uid);
  };

  const getTotalKas = () => {
    return Object.values(kasData).reduce((sum, kas) => sum + kas.total, 0);
  };

  const getSudahBayar = () => {
    return Object.values(kasData).filter(kas => kas.status === "sudah").length;
  };

  const getBelumBayar = () => {
    return Object.values(kasData).filter(kas => kas.status === "belum").length;
  };

  const getPercentage = () => {
    const total = Object.keys(kasData).length;
    if (total === 0) return 0;
    return (getSudahBayar() / total) * 100;
  };

  const handleUpdateKas = async (uid: string) => {
    if (!newAmount) {
      toast({
        title: "Error",
        description: "Masukkan jumlah yang valid",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(newAmount);
    const currentKas = kasData[uid] || { uid, total: 0, status: "belum", riwayat: {} };
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const updatedKas: Kas = {
      ...currentKas,
      total: currentKas.total + amount,
      status: newStatus,
      riwayat: {
        ...currentKas.riwayat,
        [currentMonth]: (currentKas.riwayat[currentMonth] || 0) + amount
      }
    };

    try {
      await set(ref(database, `kas/${uid}`), updatedKas);
      setEditingUser(null);
      setNewAmount("");
      setNewStatus("sudah");
      toast({
        title: "Kas berhasil diperbarui",
        description: `Kas ${getUserById(uid)?.nama} telah diperbarui`,
      });
    } catch (error) {
      console.error("Error updating kas:", error);
      toast({
        title: "Gagal memperbarui kas",
        description: "Terjadi kesalahan saat memperbarui kas",
        variant: "destructive",
      });
    }
  };

  const sortedKasData = Object.values(kasData).sort((a, b) => {
    const userA = getUserById(a.uid);
    const userB = getUserById(b.uid);
    return (userA?.nama || "").localeCompare(userB?.nama || "");
  });

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-primary" />
              Kas Kelas
            </h1>
            <p className="text-gray-600">Manajemen kas kelas 12 C Teknik</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Kas</p>
                  <p className="text-3xl font-bold text-green-600">Rp {getTotalKas().toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sudah Bayar</p>
                  <p className="text-3xl font-bold text-primary">{getSudahBayar()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Belum Bayar</p>
                  <p className="text-3xl font-bold text-red-600">{getBelumBayar()}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Persentase</p>
                  <p className="text-3xl font-bold text-yellow-600">{getPercentage().toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Progress Pembayaran Kas</h3>
              <span className="text-sm text-gray-500">{getSudahBayar()} dari {Object.keys(kasData).length} siswa</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-green-600 h-4 rounded-full transition-all duration-500" 
                style={{ width: `${getPercentage()}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Kas List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Kas Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedKasData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Belum ada data kas</p>
              ) : (
                sortedKasData.map((kas) => {
                  const userData = getUserById(kas.uid);
                  if (!userData) return null;

                  return (
                    <div key={kas.uid} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-10 h-10 bg-primary">
                          <AvatarFallback className="text-white">
                            {userData.nama.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{userData.nama}</p>
                          <p className="text-sm text-gray-500">{userData.role}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">Rp {kas.total.toLocaleString()}</p>
                          <Badge variant={kas.status === "sudah" ? "default" : "destructive"}>
                            {kas.status === "sudah" ? "Sudah Bayar" : "Belum Bayar"}
                          </Badge>
                        </div>
                        
                        {canEdit && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Kas - {userData.nama}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="amount">Jumlah Tambahan</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    placeholder="Masukkan jumlah"
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="status">Status</Label>
                                  <Select value={newStatus} onValueChange={(value: "sudah" | "belum") => setNewStatus(value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="sudah">Sudah Bayar</SelectItem>
                                      <SelectItem value="belum">Belum Bayar</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Riwayat Pembayaran</Label>
                                  <div className="max-h-32 overflow-y-auto space-y-1">
                                    {Object.entries(kas.riwayat).length === 0 ? (
                                      <p className="text-sm text-gray-500">Belum ada riwayat pembayaran</p>
                                    ) : (
                                      Object.entries(kas.riwayat).map(([month, amount]) => (
                                        <div key={month} className="flex justify-between text-sm">
                                          <span>{month}</span>
                                          <span>Rp {amount.toLocaleString()}</span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                                <Button onClick={() => handleUpdateKas(kas.uid)} className="w-full">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Update Kas
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Information */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Informasi Kas</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Kas kelas dikelola oleh Bendahara, Ketua Kelas, atau Admin</li>
                  <li>• Status pembayaran akan terupdate secara real-time</li>
                  <li>• Riwayat pembayaran disimpan per bulan untuk transparansi</li>
                  <li>• Untuk pertanyaan terkait kas, hubungi Bendahara kelas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
