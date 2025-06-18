import { useEffect, useState } from "react";
import { ref, onValue, push, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { User, Info } from "@shared/schema";
import { Info as InfoIcon, Plus, Trash2, Pin, PinOff, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InfoPage() {
  return (
    <ProtectedRoute>
      {(user) => <InfoContent user={user} />}
    </ProtectedRoute>
  );
}

function InfoContent({ user }: { user: User }) {
  const { toast } = useToast();
  const [infoList, setInfoList] = useState<Info[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newInfo, setNewInfo] = useState({
    judul: "",
    isi: ""
  });
  const [creating, setCreating] = useState(false);

  const canCreate = ["ketua_kelas", "wakil_ketua", "sekretaris", "admin"].includes(user.role) || user.isAdmin;
  const canPin = ["ketua_kelas", "wakil_ketua", "admin"].includes(user.role) || user.isAdmin;
  const canDelete = user.role === "ketua_kelas" || user.role === "admin" || user.isAdmin;

  useEffect(() => {
    // Load info data
    const infoRef = ref(database, 'info');
    const unsubscribeInfo = onValue(infoRef, (snapshot) => {
      if (snapshot.exists()) {
        const infoData = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        })) as Info[];
        // Sort by pin status first, then timestamp (newest first)
        infoData.sort((a, b) => {
          if (a.pin !== b.pin) {
            return b.pin ? 1 : -1; // Pinned items first
          }
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        setInfoList(infoData);
      } else {
        setInfoList([]);
      }
    });

    // Load all users
    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = Object.values(snapshot.val()) as User[];
        setAllUsers(usersData);
      }
    });

    return () => {
      unsubscribeInfo();
      unsubscribeUsers();
    };
  }, []);

  const getUserById = (uid: string) => {
    return allUsers.find(u => u.uid === uid);
  };

  const handleCreateInfo = async () => {
    if (!newInfo.judul.trim() || !newInfo.isi.trim() || creating) return;

    setCreating(true);
    try {
      const infoRef = ref(database, 'info');
      await push(infoRef, {
        judul: newInfo.judul.trim(),
        isi: newInfo.isi.trim(),
        pengirim: user.uid,
        timestamp: new Date().toISOString(),
        pin: false,
      });
      
      setNewInfo({ judul: "", isi: "" });
      toast({
        title: "Info berhasil dibuat",
        description: "Info baru telah ditambahkan",
      });
    } catch (error) {
      console.error("Error creating info:", error);
      toast({
        title: "Gagal membuat info",
        description: "Terjadi kesalahan saat membuat info",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePin = async (infoId: string, currentPinStatus: boolean) => {
    try {
      await update(ref(database, `info/${infoId}`), {
        pin: !currentPinStatus
      });
      toast({
        title: currentPinStatus ? "Info berhasil di-unpin" : "Info berhasil di-pin",
        description: currentPinStatus ? "Info tidak lagi ditampilkan di atas" : "Info akan ditampilkan di atas",
      });
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast({
        title: "Gagal mengubah status pin",
        description: "Terjadi kesalahan saat mengubah status pin",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInfo = async (infoId: string) => {
    try {
      await remove(ref(database, `info/${infoId}`));
      toast({
        title: "Info berhasil dihapus",
        description: "Info telah dihapus dari daftar",
      });
    } catch (error) {
      console.error("Error deleting info:", error);
      toast({
        title: "Gagal menghapus info",
        description: "Terjadi kesalahan saat menghapus info",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const pinnedInfo = infoList.filter(info => info.pin);
  const regularInfo = infoList.filter(info => !info.pin);

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <InfoIcon className="w-6 h-6 mr-2 text-primary" />
              Info Kelas
            </h1>
            <p className="text-gray-600">Informasi dan pengumuman kelas 12 C Teknik</p>
          </div>
          
          {canCreate && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Info
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Info/Pengumuman Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="judul">Judul Info</Label>
                    <Input
                      id="judul"
                      placeholder="Masukkan judul info..."
                      value={newInfo.judul}
                      onChange={(e) => setNewInfo(prev => ({ ...prev, judul: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="isi">Isi Info</Label>
                    <Textarea
                      id="isi"
                      placeholder="Detail informasi atau pengumuman..."
                      value={newInfo.isi}
                      onChange={(e) => setNewInfo(prev => ({ ...prev, isi: e.target.value }))}
                      rows={5}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateInfo} 
                    disabled={!newInfo.judul.trim() || !newInfo.isi.trim() || creating} 
                    className="w-full"
                  >
                    {creating ? "Membuat..." : "Buat Info"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Pinned Info Section */}
        {pinnedInfo.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Pin className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-900">Info Terpenting</h2>
            </div>
            {pinnedInfo.map((info) => {
              const creator = getUserById(info.pengirim);
              
              return (
                <Card key={info.id} className="border-l-4 border-yellow-500 bg-yellow-50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Megaphone className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              {info.judul}
                              <Pin className="w-4 h-4 ml-2 text-yellow-600" />
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Avatar className="w-5 h-5 bg-primary">
                                <AvatarFallback className="text-white text-xs">
                                  {creator?.nama?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{creator?.nama || "Unknown"}</span>
                              <span>•</span>
                              <span>{formatTime(info.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{info.isi}</p>
                        
                        <div className="flex items-center justify-between mt-4">
                          <Badge className="bg-yellow-600">
                            📌 Info Penting
                          </Badge>
                          
                          <div className="flex space-x-2">
                            {canPin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTogglePin(info.id, info.pin)}
                                className="text-yellow-600 hover:text-yellow-700"
                              >
                                <PinOff className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteInfo(info.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Regular Info Section */}
        <div className="space-y-4">
          {pinnedInfo.length > 0 && (
            <div className="flex items-center space-x-2">
              <InfoIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Info Lainnya</h2>
            </div>
          )}
          
          {infoList.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <InfoIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada info atau pengumuman</p>
                {canCreate && (
                  <p className="text-sm text-gray-400 mt-2">Klik tombol "Tambah Info" untuk membuat yang pertama</p>
                )}
              </CardContent>
            </Card>
          ) : regularInfo.length === 0 && pinnedInfo.length > 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Semua info sedang di-pin sebagai info penting</p>
              </CardContent>
            </Card>
          ) : (
            regularInfo.map((info) => {
              const creator = getUserById(info.pengirim);
              
              return (
                <Card key={info.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <InfoIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{info.judul}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Avatar className="w-5 h-5 bg-primary">
                                <AvatarFallback className="text-white text-xs">
                                  {creator?.nama?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{creator?.nama || "Unknown"}</span>
                              <span>•</span>
                              <span>{formatTime(info.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{info.isi}</p>
                        
                        <div className="flex items-center justify-between mt-4">
                          <Badge variant="outline">
                            Info Kelas
                          </Badge>
                          
                          <div className="flex space-x-2">
                            {canPin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTogglePin(info.id, info.pin)}
                                className="text-yellow-600 hover:text-yellow-700"
                              >
                                <Pin className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteInfo(info.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Guidelines */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <InfoIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Panduan Info Kelas</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Info Penting:</strong> Gunakan fitur pin untuk info yang sangat penting</li>
                  <li>• Ketua Kelas, Wakil Ketua, dan Sekretaris dapat menambah info</li>
                  <li>• Ketua Kelas dan Wakil Ketua dapat mem-pin/unpin info</li>
                  <li>• Info yang di-pin akan selalu tampil di bagian atas</li>
                  <li>• Pastikan info yang dibagikan relevan dan bermanfaat untuk semua</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
