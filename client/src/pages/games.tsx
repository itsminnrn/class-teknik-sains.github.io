import { useEffect, useState } from "react";
import { ref, onValue, push, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { User, Game } from "@shared/schema";
import { Gamepad2, Plus, ExternalLink, Trash2, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GamesPage() {
  return (
    <ProtectedRoute>
      {(user) => <GamesContent user={user} />}
    </ProtectedRoute>
  );
}

function GamesContent({ user }: { user: User }) {
  const { toast } = useToast();
  const [gamesList, setGamesList] = useState<Game[]>([]);
  const [newGame, setNewGame] = useState({
    judul: "",
    link: ""
  });
  const [creating, setCreating] = useState(false);

  const canManage = user.role === "ketua_kelas" || user.role === "admin" || user.isAdmin;

  useEffect(() => {
    // Load games data
    const gamesRef = ref(database, 'games');
    const unsubscribeGames = onValue(gamesRef, (snapshot) => {
      if (snapshot.exists()) {
        const gamesData = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        })) as Game[];
        setGamesList(gamesData);
      } else {
        setGamesList([]);
      }
    });

    return unsubscribeGames;
  }, []);

  const handleCreateGame = async () => {
    if (!newGame.judul.trim() || !newGame.link.trim() || creating) return;

    // Basic URL validation
    try {
      new URL(newGame.link);
    } catch {
      toast({
        title: "URL tidak valid",
        description: "Masukkan URL yang valid (contoh: https://example.com)",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const gamesRef = ref(database, 'games');
      await push(gamesRef, {
        judul: newGame.judul.trim(),
        link: newGame.link.trim(),
      });
      
      setNewGame({ judul: "", link: "" });
      toast({
        title: "Game berhasil ditambahkan",
        description: "Game baru telah ditambahkan ke daftar",
      });
    } catch (error) {
      console.error("Error creating game:", error);
      toast({
        title: "Gagal menambahkan game",
        description: "Terjadi kesalahan saat menambahkan game",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      await remove(ref(database, `games/${gameId}`));
      toast({
        title: "Game berhasil dihapus",
        description: "Game telah dihapus dari daftar",
      });
    } catch (error) {
      console.error("Error deleting game:", error);
      toast({
        title: "Gagal menghapus game",
        description: "Terjadi kesalahan saat menghapus game",
        variant: "destructive",
      });
    }
  };

  const handlePlayGame = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Gamepad2 className="w-6 h-6 mr-2 text-primary" />
              Games Kelas
            </h1>
            <p className="text-gray-600">Koleksi game untuk hiburan kelas 12 C Teknik</p>
          </div>
          
          {canManage && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Game
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Game Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="judul">Nama Game</Label>
                    <Input
                      id="judul"
                      placeholder="Masukkan nama game..."
                      value={newGame.judul}
                      onChange={(e) => setNewGame(prev => ({ ...prev, judul: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="link">Link Game</Label>
                    <Input
                      id="link"
                      type="url"
                      placeholder="https://example.com/game"
                      value={newGame.link}
                      onChange={(e) => setNewGame(prev => ({ ...prev, link: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Pastikan link dapat diakses dan aman untuk dimainkan
                    </p>
                  </div>
                  <Button 
                    onClick={handleCreateGame} 
                    disabled={!newGame.judul.trim() || !newGame.link.trim() || creating} 
                    className="w-full"
                  >
                    {creating ? "Menambahkan..." : "Tambah Game"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Games Grid */}
        {gamesList.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Gamepad2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Game</h3>
              <p className="text-gray-500 mb-4">
                Koleksi game kelas masih kosong. {canManage && "Tambahkan game pertama untuk hiburan bersama!"}
              </p>
              {!canManage && (
                <p className="text-sm text-gray-400">
                  Ketua Kelas atau Admin dapat menambahkan game
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gamesList.map((game) => (
              <Card key={game.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Gamepad2 className="w-5 h-5 mr-2 text-primary" />
                      {game.judul}
                    </span>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGame(game.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white text-center">
                    <Smile className="w-12 h-12 mx-auto mb-3 opacity-80" />
                    <p className="text-sm opacity-90">Siap untuk bermain?</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => handlePlayGame(game.link)} 
                      className="w-full"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Main Sekarang
                    </Button>
                    
                    <div className="text-xs text-gray-500 break-all">
                      {game.link}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Information */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tentang Games Kelas</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Games adalah tempat hiburan dan relaksasi untuk seluruh kelas</li>
                  <li>• Mainkan game saat waktu istirahat atau setelah selesai belajar</li>
                  <li>• Pastikan game yang dimainkan aman dan tidak mengandung konten negatif</li>
                  <li>• Jangan lupa prioritaskan tugas dan pelajaran ya! 📚</li>
                  <li>• Ketua Kelas dapat menambah atau menghapus game dari daftar</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fun Facts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🎮</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Main Bareng</h4>
              <p className="text-sm text-gray-600">Ajak teman sekelas main bersama untuk lebih seru!</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🏆</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Kompetisi Sehat</h4>
              <p className="text-sm text-gray-600">Adakan turnamen mini antar teman sekelas!</p>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">⚡</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Refreshing</h4>
              <p className="text-sm text-gray-600">Game bisa jadi cara yang baik untuk merefresh otak!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
