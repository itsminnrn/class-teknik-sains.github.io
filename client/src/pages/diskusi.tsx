import { useEffect, useState } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { User, Diskusi } from "@shared/schema";
import { MessageSquare, Plus, Reply, Pin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DiskusiPage() {
  return (
    <ProtectedRoute>
      {(user) => <DiskusiContent user={user} />}
    </ProtectedRoute>
  );
}

function DiskusiContent({ user }: { user: User }) {
  const { toast } = useToast();
  const [diskusiList, setDiskusiList] = useState<Diskusi[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedDiskusi, setSelectedDiskusi] = useState<Diskusi | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newReply, setNewReply] = useState("");
  const [creating, setCreating] = useState(false);
  const [replying, setReplying] = useState(false);

  const canPin = user.role === "ketua_kelas" || user.role === "wakil_ketua" || user.role === "admin" || user.isAdmin;

  useEffect(() => {
    // Load diskusi data
    const diskusiRef = ref(database, 'diskusi');
    const unsubscribeDiskusi = onValue(diskusiRef, (snapshot) => {
      if (snapshot.exists()) {
        const diskusiData = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        })) as Diskusi[];
        // Sort by timestamp, newest first
        diskusiData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setDiskusiList(diskusiData);
      } else {
        setDiskusiList([]);
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
      unsubscribeDiskusi();
      unsubscribeUsers();
    };
  }, []);

  const getUserById = (uid: string) => {
    return allUsers.find(u => u.uid === uid);
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || creating) return;

    setCreating(true);
    try {
      const diskusiRef = ref(database, 'diskusi');
      await push(diskusiRef, {
        judul: newTopicTitle.trim(),
        dibuat_oleh: user.uid,
        timestamp: new Date().toISOString(),
        isi: {}
      });
      setNewTopicTitle("");
      toast({
        title: "Topik diskusi berhasil dibuat",
        description: "Topik diskusi baru telah ditambahkan",
      });
    } catch (error) {
      console.error("Error creating topic:", error);
      toast({
        title: "Gagal membuat topik",
        description: "Terjadi kesalahan saat membuat topik diskusi",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async (diskusiId: string) => {
    if (!newReply.trim() || replying) return;

    setReplying(true);
    try {
      const diskusi = diskusiList.find(d => d.id === diskusiId);
      if (!diskusi) return;

      const replyRef = ref(database, `diskusi/${diskusiId}/isi`);
      const newReplyId = Date.now().toString();
      const updatedIsi = {
        ...diskusi.isi,
        [newReplyId]: {
          from: user.uid,
          pesan: newReply.trim(),
          timestamp: new Date().toISOString(),
        }
      };
      
      await set(replyRef, updatedIsi);
      setNewReply("");
      toast({
        title: "Balasan berhasil dikirim",
        description: "Balasan Anda telah ditambahkan ke diskusi",
      });
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({
        title: "Gagal mengirim balasan",
        description: "Terjadi kesalahan saat mengirim balasan",
        variant: "destructive",
      });
    } finally {
      setReplying(false);
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

  const getRepliesCount = (diskusi: Diskusi) => {
    return Object.keys(diskusi.isi || {}).length;
  };

  const getLatestReply = (diskusi: Diskusi) => {
    const replies = Object.values(diskusi.isi || {});
    if (replies.length === 0) return null;
    return replies.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="w-6 h-6 mr-2 text-primary" />
              Diskusi Kelas
            </h1>
            <p className="text-gray-600">Forum diskusi kelas 12 C Teknik</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Buat Topik
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Topik Diskusi Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Judul topik diskusi..."
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateTopic} disabled={!newTopicTitle.trim() || creating} className="w-full">
                  {creating ? "Membuat..." : "Buat Topik"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Discussion List */}
        <div className="space-y-4">
          {diskusiList.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada diskusi. Buat topik diskusi pertama!</p>
              </CardContent>
            </Card>
          ) : (
            diskusiList.map((diskusi) => {
              const creator = getUserById(diskusi.dibuat_oleh);
              const repliesCount = getRepliesCount(diskusi);
              const latestReply = getLatestReply(diskusi);
              const latestReplyUser = latestReply ? getUserById(latestReply.from) : null;

              return (
                <Card key={diskusi.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{diskusi.judul}</h3>
                          {canPin && (
                            <Button variant="ghost" size="sm">
                              <Pin className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6 bg-primary">
                              <AvatarFallback className="text-white text-xs">
                                {creator?.nama?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{creator?.nama || "Unknown"}</span>
                          </div>
                          <span>•</span>
                          <span>{formatTime(diskusi.timestamp)}</span>
                          <span>•</span>
                          <Badge variant="outline">{repliesCount} balasan</Badge>
                        </div>

                        {latestReply && latestReplyUser && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <div className="flex items-center space-x-2 mb-1">
                              <Avatar className="w-5 h-5 bg-primary">
                                <AvatarFallback className="text-white text-xs">
                                  {latestReplyUser.nama.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{latestReplyUser.nama}</span>
                            </div>
                            <p className="text-sm text-gray-600">{latestReply.pesan}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatTime(latestReply.timestamp)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedDiskusi(diskusi)}>
                            <Reply className="w-4 h-4 mr-2" />
                            Lihat & Balas
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{diskusi.judul}</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            {/* Original Topic */}
                            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-primary">
                              <div className="flex items-center space-x-2 mb-2">
                                <Avatar className="w-6 h-6 bg-primary">
                                  <AvatarFallback className="text-white text-xs">
                                    {creator?.nama?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{creator?.nama || "Unknown"}</span>
                                <Badge variant="secondary">Pembuat Topik</Badge>
                              </div>
                              <p className="text-sm text-gray-500">{formatTime(diskusi.timestamp)}</p>
                            </div>

                            {/* Replies */}
                            <div className="space-y-3">
                              {Object.entries(diskusi.isi || {}).map(([replyId, reply]) => {
                                const replyUser = getUserById(reply.from);
                                return (
                                  <div key={replyId} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Avatar className="w-6 h-6 bg-primary">
                                        <AvatarFallback className="text-white text-xs">
                                          {replyUser?.nama?.charAt(0) || "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium">{replyUser?.nama || "Unknown"}</span>
                                    </div>
                                    <p className="text-sm text-gray-900 mb-2">{reply.pesan}</p>
                                    <p className="text-xs text-gray-500">{formatTime(reply.timestamp)}</p>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Reply Form */}
                            <div className="border-t pt-4">
                              <Textarea
                                placeholder="Tulis balasan Anda..."
                                value={newReply}
                                onChange={(e) => setNewReply(e.target.value)}
                                rows={3}
                              />
                              <Button 
                                onClick={() => handleReply(diskusi.id)} 
                                disabled={!newReply.trim() || replying}
                                className="mt-2"
                              >
                                {replying ? "Mengirim..." : "Kirim Balasan"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Guidelines */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Panduan Diskusi</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Gunakan judul yang jelas dan deskriptif untuk topik diskusi</li>
                  <li>• Pastikan diskusi relevan dengan kegiatan kelas atau akademik</li>
                  <li>• Berikan balasan yang konstruktif dan membantu</li>
                  <li>• Hindari diskusi yang dapat menimbulkan konflik</li>
                  <li>• Ketua dan Wakil Ketua dapat mem-pin diskusi penting</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
