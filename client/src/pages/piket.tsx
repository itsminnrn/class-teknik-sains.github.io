import { useEffect, useState } from "react";
import { ref, onValue, set, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { User, Jadwal } from "@shared/schema";
import { ClipboardList, Edit, Save, X, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
const DAY_NAMES: Record<string, string> = {
  senin: "Senin",
  selasa: "Selasa", 
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
  sabtu: "Sabtu"
};

export default function PiketPage() {
  return (
    <ProtectedRoute>
      {(user) => <PiketContent user={user} />}
    </ProtectedRoute>
  );
}

function PiketContent({ user }: { user: User }) {
  const { toast } = useToast();
  const [piketSchedule, setPiketSchedule] = useState<Record<string, string[]>>({});
  const [editMode, setEditMode] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Record<string, string[]>>({});
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const canEdit = user.role === "seksi_kebersihan" || user.role === "ketua_kelas" || user.role === "admin" || user.isAdmin;

  useEffect(() => {
    // Load piket schedule
    const jadwalRef = ref(database, 'jadwal/piket');
    const unsubscribePiket = onValue(jadwalRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, string[]>;
        setPiketSchedule(data);
        setEditingSchedule(data);
      } else {
        const initialPiket = DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {});
        setPiketSchedule(initialPiket);
        setEditingSchedule(initialPiket);
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
      unsubscribePiket();
      unsubscribeUsers();
    };
  }, []);

  const handleSave = async () => {
    try {
      await set(ref(database, 'jadwal/piket'), editingSchedule);
      setPiketSchedule(editingSchedule);
      setEditMode(false);
      toast({
        title: "Jadwal piket berhasil disimpan",
        description: "Perubahan jadwal piket telah tersimpan",
      });
    } catch (error) {
      console.error("Error saving piket schedule:", error);
      toast({
        title: "Gagal menyimpan jadwal piket",
        description: "Terjadi kesalahan saat menyimpan jadwal piket",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingSchedule(piketSchedule);
    setEditMode(false);
  };

  const addUserToPiket = (day: string, userId: string) => {
    const currentPiket = editingSchedule[day] || [];
    if (!currentPiket.includes(userId)) {
      setEditingSchedule(prev => ({
        ...prev,
        [day]: [...currentPiket, userId]
      }));
    }
  };

  const removeUserFromPiket = (day: string, userId: string) => {
    const currentPiket = editingSchedule[day] || [];
    setEditingSchedule(prev => ({
      ...prev,
      [day]: currentPiket.filter(uid => uid !== userId)
    }));
  };

  const getUserById = (uid: string) => {
    return allUsers.find(u => u.uid === uid);
  };

  const getAvailableUsers = (day: string) => {
    const currentPiket = editingSchedule[day] || [];
    return allUsers.filter(user => !currentPiket.includes(user.uid));
  };

  const getTodayPiket = () => {
    const today = new Date().getDay();
    const dayNames = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
    const todayName = dayNames[today];
    return piketSchedule[todayName] || [];
  };

  const isTodayPiket = (day: string) => {
    const today = new Date().getDay();
    const dayNames = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
    return dayNames[today] === day;
  };

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ClipboardList className="w-6 h-6 mr-2 text-primary" />
              Jadwal Piket
            </h1>
            <p className="text-gray-600">Jadwal piket kelas 12 C Teknik</p>
          </div>
          
          {canEdit && (
            <div className="flex space-x-2">
              {editMode ? (
                <>
                  <Button onClick={handleSave} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Simpan
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditMode(true)} size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Jadwal
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Today's Piket Highlight */}
        {getTodayPiket().length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <ClipboardList className="w-5 h-5 mr-2 text-primary" />
                Piket Hari Ini
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getTodayPiket().map((uid) => {
                  const student = getUserById(uid);
                  return student ? (
                    <div key={uid} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Avatar className="w-8 h-8 bg-primary">
                        <AvatarFallback className="text-white text-sm">
                          {student.nama.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{student.nama}</p>
                        <p className="text-sm text-gray-500">{student.role}</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DAYS.map((day) => (
            <Card key={day} className={isTodayPiket(day) ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    {DAY_NAMES[day]}
                    {isTodayPiket(day) && (
                      <Badge className="ml-2" variant="default">
                        Hari Ini
                      </Badge>
                    )}
                  </span>
                  <Badge variant="outline">
                    {(editMode ? editingSchedule : piketSchedule)[day]?.length || 0} orang
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editMode ? (
                  <>
                    {/* Current assigned users */}
                    {(editingSchedule[day] || []).map((uid) => {
                      const student = getUserById(uid);
                      return student ? (
                        <div key={uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8 bg-primary">
                              <AvatarFallback className="text-white text-sm">
                                {student.nama.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{student.nama}</p>
                              <p className="text-sm text-gray-500">{student.role}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeUserFromPiket(day, uid)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : null;
                    })}
                    
                    {/* Add new user dropdown */}
                    <Select onValueChange={(userId) => addUserToPiket(day, userId)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tambah siswa ke piket">
                          <div className="flex items-center">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Tambah Siswa
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableUsers(day).map((availableUser) => (
                          <SelectItem key={availableUser.uid} value={availableUser.uid}>
                            {availableUser.nama} ({availableUser.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    {(piketSchedule[day] || []).length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Tidak ada piket</p>
                    ) : (
                      (piketSchedule[day] || []).map((uid) => {
                        const student = getUserById(uid);
                        return student ? (
                          <div key={uid} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Avatar className="w-8 h-8 bg-primary">
                              <AvatarFallback className="text-white text-sm">
                                {student.nama.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{student.nama}</p>
                              <p className="text-sm text-gray-500">{student.role}</p>
                            </div>
                          </div>
                        ) : null;
                      })
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Information */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Informasi Piket</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Jadwal piket dapat diubah oleh Seksi Kebersihan, Ketua Kelas, atau Admin</li>
                  <li>• Siswa yang piket hari ini akan ditampilkan di bagian atas halaman</li>
                  <li>• Pastikan setiap hari memiliki minimal 2-3 orang untuk piket yang efektif</li>
                  <li>• Jika berhalangan piket, segera koordinasi dengan Seksi Kebersihan untuk penggantian</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
