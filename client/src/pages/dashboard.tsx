import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { User, PR, Chat, Kas } from "@shared/schema";
import { 
  Users, 
  DollarSign, 
  FileText, 
  MessageCircle, 
  Calendar,
  ClipboardList,
  Plus,
  Gamepad2,
  Cake,
  Eye
} from "lucide-react";
import { useLocation } from "wouter";

interface DashboardStats {
  totalStudents: number;
  totalKas: number;
  activePR: number;
  todayMessages: number;
  sudahBayar: number;
  belumBayar: number;
  kasPercentage: number;
}

interface TodayScheduleItem {
  subject: string;
  time: string;
  room: string;
  status: "current" | "upcoming" | "finished";
}

interface PiketStudent {
  nama: string;
  task: string;
  initial: string;
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      {(user) => <DashboardContent user={user} />}
    </ProtectedRoute>
  );
}

function DashboardContent({ user }: { user: User }) {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalKas: 0,
    activePR: 0,
    todayMessages: 0,
    sudahBayar: 0,
    belumBayar: 0,
    kasPercentage: 0,
  });
  const [recentPR, setRecentPR] = useState<PR[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleItem[]>([]);
  const [todayPiket, setTodayPiket] = useState<PiketStudent[]>([]);
  const [birthdayToday, setBirthdayToday] = useState<User | null>(null);

  useEffect(() => {
    // Subscribe to users data for stats
    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const users = Object.values(snapshot.val()) as User[];
        const today = new Date().toISOString().split('T')[0];
        const birthdayUser = users.find(u => u.tanggal_lahir === today);
        setBirthdayToday(birthdayUser || null);
        
        setStats(prev => ({
          ...prev,
          totalStudents: users.length,
        }));
      }
    });

    // Subscribe to kas data
    const kasRef = ref(database, 'kas');
    const unsubscribeKas = onValue(kasRef, (snapshot) => {
      if (snapshot.exists()) {
        const kasData = Object.values(snapshot.val()) as Kas[];
        const sudahBayar = kasData.filter(k => k.status === "sudah").length;
        const belumBayar = kasData.filter(k => k.status === "belum").length;
        const totalKas = kasData.reduce((sum, k) => sum + k.total, 0);
        const kasPercentage = kasData.length > 0 ? (sudahBayar / kasData.length) * 100 : 0;

        setStats(prev => ({
          ...prev,
          totalKas,
          sudahBayar,
          belumBayar,
          kasPercentage,
        }));
      }
    });

    // Subscribe to PR data
    const prRef = ref(database, 'pr');
    const unsubscribePR = onValue(prRef, (snapshot) => {
      if (snapshot.exists()) {
        const prData = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        })) as PR[];
        
        setRecentPR(prData.slice(0, 3));
        setStats(prev => ({
          ...prev,
          activePR: prData.length,
        }));
      }
    });

    // Subscribe to chat data for today's messages
    const chatRef = ref(database, 'chat');
    const unsubscribeChat = onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const chatData = Object.values(snapshot.val()) as Chat[];
        const today = new Date().toDateString();
        const todayMessages = chatData.filter(c => 
          new Date(c.timestamp).toDateString() === today
        ).length;

        setStats(prev => ({
          ...prev,
          todayMessages,
        }));
      }
    });

    // Set mock schedule and piket data (would come from Firebase in real app)
    setTodaySchedule([
      { subject: "Fisika", time: "07:00 - 08:30", room: "Ruang 12C", status: "current" },
      { subject: "Matematika", time: "08:45 - 10:15", room: "Ruang 12C", status: "upcoming" },
      { subject: "Bahasa Indonesia", time: "10:30 - 12:00", room: "Ruang 12C", status: "upcoming" },
    ]);

    setTodayPiket([
      { nama: "Ahmad Rizki", task: "Meja & Kursi", initial: "A" },
      { nama: "Sari Dewi", task: "Papan Tulis", initial: "S" },
      { nama: "Doni Pratama", task: "Lantai", initial: "D" },
    ]);

    return () => {
      unsubscribeUsers();
      unsubscribeKas();
      unsubscribePR();
      unsubscribeChat();
    };
  }, []);

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

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Selamat datang di Class Teknik 12 C</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Siswa</p>
                  <p className="text-3xl font-bold text-primary">{stats.totalStudents}</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Kas</p>
                  <p className="text-3xl font-bold text-green-600">Rp {stats.totalKas.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">PR Aktif</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.activePR}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Chat Hari Ini</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.todayMessages}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Jadwal Hari Ini</CardTitle>
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                {todaySchedule.map((schedule, index) => (
                  <div key={index} className={`flex items-center space-x-4 p-4 rounded-lg ${
                    schedule.status === 'current' ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <div className={`w-2 h-12 rounded-full ${
                      schedule.status === 'current' ? 'bg-primary' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{schedule.subject}</p>
                      <p className="text-sm text-gray-600">{schedule.time} • {schedule.room}</p>
                    </div>
                    <Badge variant={schedule.status === 'current' ? 'default' : 'secondary'}>
                      {schedule.status === 'current' ? 'Sedang Berlangsung' : 'Belum Mulai'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Homework */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>PR Terbaru</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setLocation("/pr")}>
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat Semua
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPR.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Belum ada PR yang dibuat</p>
                ) : (
                  recentPR.map((pr) => (
                    <div key={pr.id} className={`flex items-start space-x-4 p-4 border-l-4 rounded-lg ${getPriorityBgColor(pr.priority)}`}>
                      <div className={`w-8 h-8 ${getPriorityColor(pr.priority)} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{pr.judul}</p>
                        <p className="text-sm text-gray-600 mt-1">{pr.isi}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(pr.timestamp).toLocaleDateString('id-ID')}
                          </span>
                          <Badge variant="outline" className="capitalize">
                            {pr.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Birthday Alert */}
            {birthdayToday && (
              <Card className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Cake className="w-6 h-6" />
                    <h3 className="font-semibold">Ulang Tahun Hari Ini!</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10 bg-white bg-opacity-20">
                        <AvatarFallback className="text-white">
                          {birthdayToday.nama.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{birthdayToday.nama}</p>
                        <p className="text-sm opacity-90">
                          Berusia {new Date().getFullYear() - new Date(birthdayToday.tanggal_lahir).getFullYear()} tahun
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full mt-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-20"
                    onClick={() => setLocation("/ucapan-ultah")}
                  >
                    Kirim Ucapan
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Piket Today */}
            <Card>
              <CardHeader>
                <CardTitle>Piket Hari Ini</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayPiket.map((student, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8 bg-primary">
                      <AvatarFallback className="text-white text-sm">
                        {student.initial}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{student.nama}</p>
                      <p className="text-sm text-gray-500">{student.task}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center justify-center p-4 h-auto bg-blue-50 hover:bg-blue-100 border-blue-200"
                    onClick={() => setLocation("/chat")}
                  >
                    <MessageCircle className="w-6 h-6 text-primary mb-2" />
                    <span className="text-sm font-medium">Chat</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center justify-center p-4 h-auto bg-green-50 hover:bg-green-100 border-green-200"
                    onClick={() => setLocation("/kas")}
                  >
                    <DollarSign className="w-6 h-6 text-green-600 mb-2" />
                    <span className="text-sm font-medium">Cek Kas</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center justify-center p-4 h-auto bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                    onClick={() => setLocation("/pr")}
                  >
                    <Plus className="w-6 h-6 text-yellow-600 mb-2" />
                    <span className="text-sm font-medium">Tambah PR</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center justify-center p-4 h-auto bg-purple-50 hover:bg-purple-100 border-purple-200"
                    onClick={() => setLocation("/games")}
                  >
                    <Gamepad2 className="w-6 h-6 text-purple-600 mb-2" />
                    <span className="text-sm font-medium">Games</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Class Kas Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Status Kas</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setLocation("/kas")}>
                  Detail
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sudah Bayar</span>
                  <span className="text-sm font-medium text-green-600">{stats.sudahBayar} orang</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Belum Bayar</span>
                  <span className="text-sm font-medium text-red-600">{stats.belumBayar} orang</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${stats.kasPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Terkumpul</span>
                  <span className="text-sm font-bold text-primary">Rp {stats.totalKas.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
