import { useEffect, useState, useRef } from "react";
import { MessageCircle, Users, Zap, Clock, UserCheck, Bot, Trash2, Bell, BellOff } from "lucide-react";
import { api } from "../../api";
import { ChatHistoryLog } from "../../types";

export default function Dashboard() {
  const [history, setHistory] = useState<ChatHistoryLog[]>([]);
  const [activeChats, setActiveChats] = useState<{ jid: string; name?: string; status: "AI" | "HUMAN"; lastMessage: string; timestamp: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission>("default");
  const [selectedHistoryJid, setSelectedHistoryJid] = useState<string | null>(null);
  
  const prevChatsRef = useRef<{ [jid: string]: "AI" | "HUMAN" }>({});
  
  const groupedHistory = history.reduce((acc, log) => {
    const jid = log.jid || 'unknown';
    if (!acc[jid]) acc[jid] = [];
    acc[jid].push(log);
    return acc;
  }, {} as Record<string, ChatHistoryLog[]>);

  useEffect(() => {
    if ("Notification" in window) {
      setNotifyPermission(Notification.permission);
      if (Notification.permission === "granted") {
        subscribeToPush();
      }
    }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const pubKey = await api.getVapidPublicKey();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pubKey)
      });
      await api.subscribeToPush(subscription);
      console.log("Push notification subscribed!");
    } catch (e) {
      console.error("Push subscription failed:", e);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotifyPermission(permission);
      if (permission === "granted") {
        subscribeToPush();
      }
    }
  };

  const loadData = async () => {
    try {
      const logs = await api.getChatHistory();
      setHistory(logs);
      const chats = await api.getActiveChats();
      
      // Check for notifications
      chats.forEach(chat => {
        const prevStatus = prevChatsRef.current[chat.jid];
        if (prevStatus === "AI" && chat.status === "HUMAN") {
          // Play sound
          const audio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3");
          audio.volume = 0.5;
          audio.play().catch(e => console.log("Audio play blocked by browser", e));

          // Show browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Novo Atendimento Humano!", {
              body: `O cliente ${chat.name || chat.jid.split('@')[0]} solicitou atendimento humano (Teste/Plano).`,
              icon: "/vite.svg" 
            });
          }
        }
        prevChatsRef.current[chat.jid] = chat.status;
      });

      setActiveChats(chats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Tem certeza que deseja apagar todo o histórico de conversas e os atendimentos ativos?")) return;
    try {
      await api.clearChatHistory();
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleChatStatus = async (jid: string) => {
    // Optimistic update
    setActiveChats(prev => 
      prev.map(chat => 
        chat.jid === jid 
          ? { ...chat, status: chat.status === "AI" ? "HUMAN" : "AI" } 
          : chat
      )
    );
    try {
      await api.toggleActiveChat(jid);
      loadData();
    } catch (error) {
      console.error(error);
      loadData(); // Revert on error
    }
  };

  const activeAICount = activeChats.filter(c => c.status === "AI").length;
  
  const uniqueClientsCount = Object.keys(groupedHistory).length;
  const totalMessagesCount = history.length;
  
  const stats = [
    { label: "Mensagens Respondidas", value: totalMessagesCount, icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-500/20" },
    { label: "Clientes Atendidos", value: uniqueClientsCount, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/20" },
    { label: "Tempo Médio (IA)", value: "1.2s", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/20" },
    { label: "Economia", value: `${(uniqueClientsCount * 3)} min`, icon: Clock, color: "text-purple-500", bg: "bg-purple-500/20" },
  ];

  if (loading) {
    return (
      <div className="bento-card" style={{ gridColumn: 'span 10', gridRow: 'span 12', justifyContent: 'center', alignItems: 'center' }}>
        <div className="text-gray-500">Carregando métricas...</div>
      </div>
    );
  }

  return (
    <>
      {/* Overview stats mapped to bento cards */}
      <div className="grid grid-cols-2 lg:contents gap-4 lg:gap-0 lg:space-y-0">
        {stats.map((stat, idx) => (
          <div key={idx} className="bento-card" style={{ gridColumn: 'span 2', gridRow: 'span 3' }}>
            <div className="card-title">
              <stat.icon className="w-4 h-4" />
              <span className="truncate">{stat.label}</span>
            </div>
            <div className="stat-val text-2xl lg:text-3xl">{stat.value}</div>
            <div className="stat-label">Registrado hoje</div>
          </div>
        ))}
        {/* WhatsApp Status (Custom Bento Card) */}
        <div className="bento-card col-span-2 relative" style={{ gridColumn: 'span 2', gridRow: 'span 3', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none' }}>
          <div className="card-title flex justify-between items-center" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Status do WhatsApp
            
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  try {
                    const res = await api.testPushNotification();
                    console.log("Test push result:", res);
                  } catch (e) {
                    console.error("Error testing push:", e);
                  }
                }}
                className="flex items-center gap-1 text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                title="Testar Push"
              >
                Testar Push
              </button>
              {notifyPermission !== "granted" && (
                <button 
                  onClick={requestNotificationPermission}
                  className="flex items-center gap-1 text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                  title="Ativar Notificações"
                >
                  <Bell className="w-3 h-3" /> Ativar
                </button>
              )}
              {notifyPermission === "granted" && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-100" title="Notificações ativas">
                  <Bell className="w-3 h-3" /> Ativas
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="p-3 bg-white/20 rounded-xl">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold">Conectado</div>
              <div className="text-xs opacity-80">{activeAICount} IA Ativa(s)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ gridColumn: 'span 10', gridRow: 'span 9' }}>
        {/* Active Chats section */}
        <div className="bento-card min-h-[400px] lg:min-h-0">
          <div className="card-title flex justify-between">
            Atendimentos em Andamento
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {activeChats.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhum atendimento no momento.
              </div>
            ) : (
              activeChats.sort((a, b) => b.timestamp - a.timestamp).map((chat) => (
                <div key={chat.jid} className={`p-4 rounded-xl border flex flex-col justify-between ${chat.status === 'HUMAN' ? 'border-amber-500/50 bg-amber-500/10' : 'border-slate-700 bg-slate-800/40'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-slate-200">
                      {chat.name || chat.jid.split('@')[0]}
                    </span>
                    <button
                      onClick={() => toggleChatStatus(chat.jid)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${
                        chat.status === 'AI' 
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30' 
                          : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                      }`}
                    >
                      {chat.status === 'AI' ? (
                        <><Bot className="w-3.5 h-3.5" /> IA Ativa</>
                      ) : (
                        <><UserCheck className="w-3.5 h-3.5" /> Humano</>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400 truncate">{chat.lastMessage}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(chat.timestamp).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Logs section */}
        <div className="bento-card min-h-[400px] lg:min-h-0 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="card-title !mb-0">
              {selectedHistoryJid ? (
                <button 
                  onClick={() => setSelectedHistoryJid(null)}
                  className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                >
                  <span className="text-xl">←</span> Conversas ({groupedHistory[selectedHistoryJid]?.[0]?.name || selectedHistoryJid.split('@')[0]})
                </button>
              ) : (
                "Histórico de Clientes"
              )}
            </div>
            {!selectedHistoryJid && (
              <button onClick={handleClearHistory} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg">
                <Trash2 className="w-4 h-4" /> Limpar
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {!selectedHistoryJid ? (
              // List of clients
              Object.keys(groupedHistory).length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Nenhuma conversa registrada ainda.
                </div>
              ) : (
                Object.entries(groupedHistory).map(([jid, logsObj]) => {
                  const logs = logsObj as ChatHistoryLog[];
                  const lastLog = logs[logs.length - 1];
                  const name = lastLog.name || jid.split('@')[0];
                  return (
                    <div 
                      key={jid} 
                      onClick={() => setSelectedHistoryJid(jid)}
                      className="p-4 rounded-xl border border-slate-700 bg-slate-800/40 cursor-pointer hover:bg-slate-700/50 transition-colors flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{name}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[200px] mt-1">{lastLog.userMessage}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] text-slate-500">{new Date(lastLog.timestamp).toLocaleString("pt-BR")}</span>
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded-full font-bold">
                          {logs.length} msgs
                        </span>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              // Chat messages for selected client
              groupedHistory[selectedHistoryJid]?.map((log) => (
                <div key={log.id} className="p-4 rounded-xl border border-slate-700 bg-slate-800/40">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-emerald-500 font-bold">{log.name || selectedHistoryJid.split('@')[0]}</span>
                    <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-800 p-3 rounded-xl rounded-tl-none inline-block max-w-[80%] border border-slate-700">
                      <p className="text-sm text-slate-300">{log.userMessage}</p>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-emerald-600 text-white p-3 rounded-xl rounded-tr-none inline-block max-w-[80%]">
                        <p className="text-sm">{log.aiResponse}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
