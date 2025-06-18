import { useEffect, useState, useRef } from "react";
import { ref, onValue, push, serverTimestamp } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { User, Chat } from "@shared/schema";
import { MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      {(user) => <ChatContent user={user} />}
    </ProtectedRoute>
  );
}

function ChatContent({ user }: { user: User }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Chat[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load chat messages
    const chatRef = ref(database, 'chat');
    const unsubscribeChat = onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const chatData = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        })) as Chat[];
        // Sort by timestamp
        chatData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(chatData);
      } else {
        setMessages([]);
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
      unsubscribeChat();
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getUserById = (uid: string) => {
    return allUsers.find(u => u.uid === uid);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const chatRef = ref(database, 'chat');
      await push(chatRef, {
        from: user.uid,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Gagal mengirim pesan",
        description: "Terjadi kesalahan saat mengirim pesan",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const isMyMessage = (message: Chat) => message.from === user.uid;

  return (
    <Layout user={user}>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <MessageCircle className="w-6 h-6 mr-2 text-primary" />
            Chat Kelas
          </h1>
          <p className="text-gray-600">Chat real-time kelas 12 C Teknik</p>
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <span>Chat Room</span>
              <span className="text-sm text-gray-500 font-normal">
                {allUsers.length} anggota kelas
              </span>
            </CardTitle>
          </CardHeader>
          
          {/* Messages Area */}
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Belum ada pesan. Mulai percakapan!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const sender = getUserById(message.from);
                    const isMe = isMyMessage(message);
                    
                    return (
                      <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {!isMe && (
                            <Avatar className="w-8 h-8 bg-primary flex-shrink-0">
                              <AvatarFallback className="text-white text-sm">
                                {sender?.nama?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`rounded-lg p-3 ${
                            isMe 
                              ? 'bg-primary text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            {!isMe && (
                              <p className="text-xs font-medium mb-1 opacity-70">
                                {sender?.nama || "Unknown"}
                              </p>
                            )}
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              isMe ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan..."
                disabled={sending}
                className="flex-1"
              />
              <Button type="submit" disabled={!newMessage.trim() || sending}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>

        {/* Chat Rules */}
        <Card className="mt-4 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                <MessageCircle className="w-3 h-3 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Aturan Chat</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Gunakan bahasa yang sopan dan santun</li>
                  <li>• Hindari spam atau pesan berulang</li>
                  <li>• Chat ini untuk keperluan kelas dan akademik</li>
                  <li>• Hormati semua anggota kelas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
