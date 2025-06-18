import { useEffect, useState } from "react";
import { ref, onValue, push, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { User, PR } from "@shared/schema";
import { FileText, Plus, Trash2, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PRPage() {
  return (
    <ProtectedRoute>
      {(user) => <PRContent user={user} />}
    </ProtectedRoute>
  );
}

function PRContent({ user }: { user: User }) {
  const { toast } = useToast();
  const [prList, setPrList] = useState<PR[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newPR, setNewPR] = useState({
    judul: "",
    isi: "",
    priority: "normal" as "urgent" | "normal" | "ringan"
  });
  const [creating, setCreating] = useState(false);

  const canCreate = ["ketua_kelas", "wakil_ketua", "sekretaris", "admin"].includes(user.role) || user.isAdmin;
  const canDelete = user.role === "ketua_kelas" || user.role === "admin" || user.isAdmin;

  useEffect(() => {
    // Load PR data
    const prRef = ref(database, 'pr');
    const unsubscribePR = onValue(prRef, (snapshot) => {
      if (snapshot.exists()) {
        const prData = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        })) as PR[];
        // Sort by priority (urgent first) then timestamp (newest first)
        prData.sort((a, b) => {
          const priorityOrder = { urgent: 3, normal: 2, ringan: 1 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        setPrList(prData);
      } else {
        setPrList([]);
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
      unsubscribePR();
      unsubscribeUsers();
    };
  }, []);

  const getUserById = (uid: string) => {
    return allUsers.find(u => u.uid === uid);
  };

  const handleCreatePR = async () => {
    if (!newPR.judul.trim() || !newPR.isi.trim() || creating) return;

    setCreating(true);
    try {
      const prRef = ref(database, 'pr');
      await push(prRef, {
        judul: newPR.judul.trim(),
        isi: newPR.isi.trim(),
        priority: newPR.priority,
        pengirim: user.uid,
        timestamp: new Date().toISOString(),
      });
      
      setNewPR({ judul: "", isi: "", priority: "normal" });
      toast({
        title: "PR berhasil dibuat",
        description: "PR baru telah ditambahkan ke daftar",
      });
    } catch (error) {
      console.error("Error creating PR:", error);
      toast({
        title: "Gagal membuat PR",
        description: "Terjadi kesalahan saat membuat PR",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePR = async (prId: string) => {
    try {
      await remove(ref(database, `pr/${prId}`));
      toast({
        title: "PR berhasil dihapus",
        description: "PR telah dihapus dari daftar",
      });
    } catch (error) {
      console.error("Error deleting PR:", error);
      toast({
        title: "Gagal menghapus PR",
        description: "Terjadi kesalahan saat menghapus PR",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "normal": return "bg-yellow-500";
      case "ringan": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-50 border-red-200";
      case "normal": return "bg-yellow-50 border-yellow-200";
      case "ringan": return "bg-blue-50 border-blue-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return <AlertTriangle className="w-4 h-4" />;
      case "normal": return <Clock className="w-4 h-4" />;
      case "ringan": return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
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

  const getPriorityStats = () => {
    const urgent = prList.filter(pr => pr.priority === "urgent").length;
    const normal = prList.filter(pr => pr.priority === "normal").length;
    const ringan = prList.filter(pr => pr.priority === "ringan").length;
    return { urgent, normal, ringan };
  };

  const stats = getPriorityStats();

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-primary" />
              PR & Tugas
            </h1>
            <p className="text-gray-600">Daftar pekerjaan rumah dan tugas kelas 12 C Teknik</p>
          </div>
          
          {canCreate && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah PR
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah PR/Tugas Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="judul">Judul PR/Tugas</Label>
                    <Input
                      id="judul"
                      placeholder="Masukkan judul PR/tugas..."
                      value={newPR.judul}
                      onChange={(e) => setNewPR(prev => ({ ...prev, judul: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="isi">Deskripsi</Label>
                    <Textarea
                      id="isi"
                      placeholder="Deskripsi detail PR/tugas..."
                      value={newPR.isi}
                      onChange={(e) => setNewPR(prev => ({ ...prev, isi: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Prioritas</Label>
                    <Select value={newPR.priority} onValueChange={(value: "urgent" | "normal" | "ringan") => setNewPR(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">🔴 Urgent - Deadline dekat</SelectItem>
                        <SelectItem value="normal">🟡 Normal - Biasa</SelectItem>
                        <SelectItem value="ringan">🟢 Ringan - Santai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleCreatePR} 
                    disabled={!newPR.judul.trim() || !newPR.isi.trim() || creating} 
                    className="w-full"
                  >
                    {creating ? "Membuat..." : "Buat PR/Tugas"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Normal</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.normal}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Ringan</p>
                  <p className="text-2xl font-bold text-green-600">{stats.ringan}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PR List */}
        <div className="space-y-4">
          {prList.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada PR atau tugas yang dibuat</p>
                {canCreate && (
                  <p className="text-sm text-gray-400 mt-2">Klik tombol "Tambah PR" untuk membuat yang pertama</p>
                )}
              </CardContent>
            </Card>
          ) : (
            prList.map((pr) => {
              const creator = getUserById(pr.pengirim);
              
              return (
                <Card key={pr.id} className={`border-l-4 ${getPriorityBgColor(pr.priority)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-8 h-8 ${getPriorityColor(pr.priority)} rounded-full flex items-center justify-center text-white`}>
                            {getPriorityIcon(pr.priority)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{pr.judul}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Avatar className="w-5 h-5 bg-primary">
                                <AvatarFallback className="text-white text-xs">
                                  {creator?.nama?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{creator?.nama || "Unknown"}</span>
                              <span>•</span>
                              <span>{formatTime(pr.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4 leading-relaxed">{pr.isi}</p>
                        
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="outline" 
                            className={`capitalize ${
                              pr.priority === "urgent" ? "border-red-500 text-red-700" :
                              pr.priority === "normal" ? "border-yellow-500 text-yellow-700" :
                              "border-green-500 text-green-700"
                            }`}
                          >
                            {pr.priority}
                          </Badge>
                          
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePR(pr.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
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
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Panduan PR & Tugas</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Urgent:</strong> PR dengan deadline dalam 1-2 hari atau sangat penting</li>
                  <li>• <strong>Normal:</strong> PR biasa dengan deadline normal (3-7 hari)</li>
                  <li>• <strong>Ringan:</strong> Tugas yang tidak terlalu berat atau deadline masih lama</li>
                  <li>• Ketua Kelas, Wakil Ketua, dan Sekretaris dapat menambah PR</li>
                  <li>• Ketua Kelas dan Admin dapat menghapus PR</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
