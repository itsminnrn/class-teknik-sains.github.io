import { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { User, Jadwal } from "@shared/schema";
import { Calendar, Edit, Save, X } from "lucide-react";
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

export default function JadwalPage() {
  return (
    <ProtectedRoute>
      {(user) => <JadwalContent user={user} />}
    </ProtectedRoute>
  );
}

function JadwalContent({ user }: { user: User }) {
  const { toast } = useToast();
  const [jadwal, setJadwal] = useState<Jadwal>({
    pelajaran: {},
    piket: {}
  });
  const [editMode, setEditMode] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<Jadwal>({
    pelajaran: {},
    piket: {}
  });

  const canEdit = user.role === "wakil_ketua" || user.role === "ketua_kelas" || user.role === "admin" || user.isAdmin;

  useEffect(() => {
    const jadwalRef = ref(database, 'jadwal');
    const unsubscribe = onValue(jadwalRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Jadwal;
        setJadwal(data);
        setEditingJadwal(data);
      } else {
        // Initialize with empty schedule
        const initialJadwal: Jadwal = {
          pelajaran: DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {}),
          piket: DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
        };
        setJadwal(initialJadwal);
        setEditingJadwal(initialJadwal);
      }
    });

    return unsubscribe;
  }, []);

  const handleSave = async () => {
    try {
      await set(ref(database, 'jadwal'), editingJadwal);
      setJadwal(editingJadwal);
      setEditMode(false);
      toast({
        title: "Jadwal berhasil disimpan",
        description: "Perubahan jadwal telah tersimpan",
      });
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Gagal menyimpan jadwal",
        description: "Terjadi kesalahan saat menyimpan jadwal",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingJadwal(jadwal);
    setEditMode(false);
  };

  const updatePelajaran = (day: string, subjects: string[]) => {
    setEditingJadwal(prev => ({
      ...prev,
      pelajaran: {
        ...prev.pelajaran,
        [day]: subjects
      }
    }));
  };

  const addSubject = (day: string) => {
    const currentSubjects = editingJadwal.pelajaran[day] || [];
    updatePelajaran(day, [...currentSubjects, ""]);
  };

  const removeSubject = (day: string, index: number) => {
    const currentSubjects = editingJadwal.pelajaran[day] || [];
    updatePelajaran(day, currentSubjects.filter((_, i) => i !== index));
  };

  const updateSubject = (day: string, index: number, value: string) => {
    const currentSubjects = [...(editingJadwal.pelajaran[day] || [])];
    currentSubjects[index] = value;
    updatePelajaran(day, currentSubjects);
  };

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-primary" />
              Jadwal Pelajaran
            </h1>
            <p className="text-gray-600">Jadwal pelajaran kelas 12 C Teknik</p>
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

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DAYS.map((day) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {DAY_NAMES[day]}
                  <Badge variant="outline">
                    {(editMode ? editingJadwal : jadwal).pelajaran[day]?.length || 0} mata pelajaran
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editMode ? (
                  <>
                    {(editingJadwal.pelajaran[day] || []).map((subject, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={subject}
                          onChange={(e) => updateSubject(day, index, e.target.value)}
                          placeholder="Nama mata pelajaran"
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSubject(day, index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addSubject(day)}
                      className="w-full"
                    >
                      Tambah Mata Pelajaran
                    </Button>
                  </>
                ) : (
                  <>
                    {(jadwal.pelajaran[day] || []).length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Tidak ada pelajaran</p>
                    ) : (
                      (jadwal.pelajaran[day] || []).map((subject, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-medium text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{subject}</p>
                            <p className="text-sm text-gray-500">
                              Jam ke-{index + 1}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Informasi Jadwal</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Jadwal pelajaran dapat diubah oleh Wakil Ketua, Ketua Kelas, atau Admin</li>
                  <li>• Perubahan jadwal akan langsung tersinkronisasi ke semua anggota kelas</li>
                  <li>• Untuk perubahan mendadak, gunakan fitur Info Kelas untuk memberitahu teman sekelas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
