import { useEffect, useState } from "react";
import { ref, onValue, set, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { User, UcapanUltah } from "@shared/schema";
import { Cake, Heart, Send, Gift, Sparkles, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UcapanUltahPage() {
  return (
    <ProtectedRoute>
      {(user) => <UcapanUltahContent user={user} />}
    </ProtectedRoute>
  );
}

function UcapanUltahContent({ user }: { user: User }) {
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [ucapanData, setUcapanData] = useState<Record<string, UcapanUltah>>({});
  const [newUcapan, setNewUcapan] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Load all users
    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = Object.values(snapshot.val()) as User[];
        setAllUsers(usersData.sort((a, b) => a.nama.localeCompare(b.nama)));
      }
    });

    // Load ucapan data
    const ucapanRef = ref(database, 'ultah');
    const unsubscribeUcapan = onValue(ucapanRef, (snapshot) => {
      if (snapshot.exists()) {
        setUcapanData(snapshot.val() as Record<string, UcapanUltah>);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeUcapan();
    };
  }, []);

  const getUserById = (uid: string) => {
    return allUsers.find(u => u.uid === uid);
  };

  const handleSendUcapan = async (targetUserId: string) => {
    if (!newUcapan.trim() || sending) return;

    setSending(true);
    try {
      const targetUser = getUserById(targetUserId);
      if (!targetUser) return;

      const ucapanRef = ref(database, `ultah/${targetUserId}/ucapan`);
      await push(ucapanRef, {
        from: user.uid,
        pesan: newUcapan.trim(),
        timestamp: new Date().toISOString(),
      });

      // Initialize user data if not exists
      if (!ucapanData[targetUserId]) {
        await set(ref(database, `ultah/${targetUserId}`), {
          uid: targetUserId,
          tanggal_lahir: targetUser.tanggal_lahir,
          ucapan: {}
        });
      }

      setNewUcapan("");
      setSelectedUser(null);
      toast({
        title: "Ucapan berhasil dikirim! 🎉",
        description: `Ucapan untuk ${targetUser.nama} telah terkirim`,
      });
    } catch (error) {
      console.error("Error sending ucapan:", error);
      toast({
        title: "Gagal mengirim ucapan",
        description: "Terjadi kesalahan saat mengirim ucapan",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long'
    });
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

  const isBirthdayToday = (birthDate: string) => {
    if (!birthDate) return false;
    const today = new Date();
    const birth = new Date(birthDate);
    return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
  };

  const isBirthdayThisWeek = (birthDate: string) => {
    if (!birthDate) return false;
    const today = new Date();
    const birth = new Date(birthDate);
    const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    
    const timeDiff = thisYearBirthday.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff >= 0 && daysDiff <= 7;
  };

  const getUcapanCount = (userId: string) => {
    const userData = ucapanData[userId];
    return userData?.ucapan ? Object.keys(userData.ucapan).length : 0;
  };

  const getLatestUcapan = (userId: string) => {
    const userData = ucapanData[userId];
    if (!userData?.ucapan) return null;
    
    const ucapanList = Object.values(userData.ucapan);
    return ucapanList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const todayBirthdays = allUsers.filter(u => isBirthdayToday(u.tanggal_lahir));
  const upcomingBirthdays = allUsers.filter(u => isBirthdayThisWeek(u.tanggal_lahir) && !isBirthdayToday(u.tanggal_lahir));
  const allBirthdays = allUsers.filter(u => u.tanggal_lahir).sort((a, b) => {
    const monthA = new Date(a.tanggal_lahir).getMonth();
    const monthB = new Date(b.tanggal_lahir).getMonth();
    const dayA = new Date(a.tanggal_lahir).getDate();
    const dayB = new Date(b.tanggal_lahir).getDate();
    
    if (monthA !== monthB) return monthA - monthB;
    return dayA - dayB;
  });

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center">
            <Cake className="w-8 h-8 mr-3 text-pink-600" />
            Ucapan Ulang Tahun
          </h1>
          <p className="text-gray-600 mt-2">Bagikan kebahagiaan dan ucapan terbaik untuk teman sekelas 🎉</p>
        </div>

        {/* Today's Birthdays */}
        {todayBirthdays.length > 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-pink-600 flex items-center justify-center">
                <PartyPopper className="w-6 h-6 mr-2" />
                Ulang Tahun Hari Ini! 🎂
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {todayBirthdays.map((birthdayUser) => {
                const age = calculateAge(birthdayUser.tanggal_lahir);
                const ucapanCount = getUcapanCount(birthdayUser.uid);
                const latestUcapan = getLatestUcapan(birthdayUser.uid);
                const latestUcapanSender = latestUcapan ? getUserById(latestUcapan.from) : null;

                return (
                  <Card key={birthdayUser.uid} className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <div className="relative inline-block">
                          <Avatar className="w-20 h-20 mx-auto bg-pink-500">
                            <AvatarFallback className="text-white text-2xl">
                              {birthdayUser.nama.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-2 -right-2">
                            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-yellow-800" />
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-900 mt-4">{birthdayUser.nama}</h3>
                        {age && (
                          <p className="text-pink-600 font-medium">Berusia {age} tahun</p>
                        )}
                        
                        <div className="flex justify-center space-x-4 mt-4">
                          <Badge className="bg-pink-100 text-pink-800">
                            <Heart className="w-3 h-3 mr-1" />
                            {ucapanCount} ucapan
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800">
                            <Cake className="w-3 h-3 mr-1" />
                            Hari ini
                          </Badge>
                        </div>
                      </div>

                      {latestUcapan && latestUcapanSender && (
                        <div className="bg-white bg-opacity-70 rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-600 mb-2">Ucapan terbaru:</p>
                          <p className="text-sm text-gray-900 italic">"{latestUcapan.pesan}"</p>
                          <p className="text-xs text-gray-500 mt-2">
                            - {latestUcapanSender.nama} • {formatTime(latestUcapan.timestamp)}
                          </p>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full bg-pink-600 hover:bg-pink-700"
                              onClick={() => setSelectedUser(birthdayUser)}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Kirim Ucapan
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center">
                                <Gift className="w-5 h-5 mr-2 text-pink-600" />
                                Kirim Ucapan untuk {birthdayUser.nama}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="text-center p-4 bg-pink-50 rounded-lg">
                                <Cake className="w-12 h-12 text-pink-600 mx-auto mb-2" />
                                <p className="text-pink-800 font-medium">
                                  Selamat ulang tahun ke-{age} untuk {birthdayUser.nama}! 🎉
                                </p>
                              </div>
                              <Textarea
                                placeholder="Tulis ucapan terbaik Anda..."
                                value={newUcapan}
                                onChange={(e) => setNewUcapan(e.target.value)}
                                rows={4}
                              />
                              <Button 
                                onClick={() => handleSendUcapan(birthdayUser.uid)}
                                disabled={!newUcapan.trim() || sending}
                                className="w-full bg-pink-600 hover:bg-pink-700"
                              >
                                {sending ? "Mengirim..." : "Kirim Ucapan 🎁"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {ucapanCount > 0 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full">
                                Lihat Semua Ucapan ({ucapanCount})
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Ucapan untuk {birthdayUser.nama}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {ucapanData[birthdayUser.uid]?.ucapan && 
                                  Object.entries(ucapanData[birthdayUser.uid].ucapan)
                                    .sort(([,a], [,b]) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                    .map(([ucapanId, ucapan]) => {
                                      const sender = getUserById(ucapan.from);
                                      return (
                                        <div key={ucapanId} className="bg-pink-50 rounded-lg p-4">
                                          <div className="flex items-start space-x-3">
                                            <Avatar className="w-8 h-8 bg-primary">
                                              <AvatarFallback className="text-white text-sm">
                                                {sender?.nama?.charAt(0) || "?"}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                              <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-medium text-gray-900">{sender?.nama || "Unknown"}</span>
                                                <span className="text-xs text-gray-500">{formatTime(ucapan.timestamp)}</span>
                                              </div>
                                              <p className="text-gray-700">{ucapan.pesan}</p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })
                                }
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Birthdays */}
        {upcomingBirthdays.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Cake className="w-5 h-5 mr-2 text-blue-600" />
              Ulang Tahun Minggu Ini
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingBirthdays.map((birthdayUser) => {
                const age = calculateAge(birthdayUser.tanggal_lahir);
                const birth = new Date(birthdayUser.tanggal_lahir);
                const today = new Date();
                const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
                const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 3600 * 24));

                return (
                  <Card key={birthdayUser.uid} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12 bg-blue-500">
                          <AvatarFallback className="text-white">
                            {birthdayUser.nama.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{birthdayUser.nama}</h4>
                          <p className="text-sm text-gray-600">{formatDate(birthdayUser.tanggal_lahir)}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {daysUntil} hari lagi
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* All Birthdays Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Kalender Ulang Tahun Kelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allBirthdays.map((birthdayUser) => {
                const ucapanCount = getUcapanCount(birthdayUser.uid);
                const isToday = isBirthdayToday(birthdayUser.tanggal_lahir);
                const isThisWeek = isBirthdayThisWeek(birthdayUser.tanggal_lahir);

                return (
                  <div key={birthdayUser.uid} className={`p-4 rounded-lg border ${
                    isToday ? "bg-pink-50 border-pink-200" :
                    isThisWeek ? "bg-blue-50 border-blue-200" :
                    "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10 bg-primary">
                          <AvatarFallback className="text-white text-sm">
                            {birthdayUser.nama.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-gray-900">{birthdayUser.nama}</h4>
                          <p className="text-sm text-gray-600">{formatDate(birthdayUser.tanggal_lahir)}</p>
                        </div>
                      </div>
                      
                      {ucapanCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Heart className="w-3 h-3 mr-1" />
                          {ucapanCount}
                        </Badge>
                      )}
                    </div>
                    
                    {(isToday || isThisWeek) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="w-full mt-3"
                            variant={isToday ? "default" : "outline"}
                            onClick={() => setSelectedUser(birthdayUser)}
                          >
                            <Send className="w-3 h-3 mr-2" />
                            Kirim Ucapan
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Kirim Ucapan untuk {birthdayUser.nama}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Tulis ucapan Anda..."
                              value={newUcapan}
                              onChange={(e) => setNewUcapan(e.target.value)}
                              rows={4}
                            />
                            <Button 
                              onClick={() => handleSendUcapan(birthdayUser.uid)}
                              disabled={!newUcapan.trim() || sending}
                              className="w-full"
                            >
                              {sending ? "Mengirim..." : "Kirim Ucapan"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Information */}
        <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                <Cake className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tentang Ucapan Ulang Tahun</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Kirim ucapan terbaik untuk teman sekelas yang berulang tahun 🎂</li>
                  <li>• Sistem akan otomatis menampilkan siapa yang berulang tahun hari ini</li>
                  <li>• Ucapan akan tersimpan sebagai kenangan indah di kelas</li>
                  <li>• Mari ciptakan suasana kebersamaan yang hangat! ❤️</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
