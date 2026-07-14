import { useEffect, useState } from "react";
import { MessageCircle, Users, Zap, Clock, UserCheck, Bot } from "lucide-react";
import { api } from "../../api";
import { ChatHistoryLog } from "../../types";

export default function Dashboard() {
  const [history, setHistory] = useState<ChatHistoryLog[]>([]);
  const [activeChats, setActiveChats] = useState<{ jid: string; status: "AI" | "HUMAN"; lastMessage: string; timestamp: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const logs = await api.getChatHistory();
      setHistory(logs);
      const chats = await api.getActiveChats();
      setActiveChats(chats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChatStatus = async (jid: string) => {
    try {
      await api.toggleActiveChat(jid);
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const activeAICount = activeChats.filter(c => c.status === "AI").length;

  const stats = [
    { label: "Mensagens Respondidas", value: history.length * 2, icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-500/20" },
    { label: "Clientes Atendidos", value: history.length, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/20" },
    { label: "Tempo Médio (IA)", value: "1.2s", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/20" },
    { label: "Economia", value: `${(history.length * 5)} min`, icon: Clock, color: "text-purple-500", bg: "bg-purple-500/20" },
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
        <div className="bento-card col-span-2" style={{ gridColumn: 'span 2', gridRow: 'span 3', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none' }}>
          <div className="card-title" style={{ color: 'rgba(255,255,255,0.8)' }}>Status do WhatsApp</div>
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
          <div className="card-title">Atendimentos em Andamento</div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {activeChats.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhum atendimento no momento.
              </div>
            ) : (
              activeChats.sort((a, b) => b.timestamp - a.timestamp).map((chat) => (
                <div key={chat.jid} className="p-4 rounded-xl border border-slate-700 bg-slate-800/40 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-slate-200">
                      {chat.jid.split('@')[0]}
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
        <div className="bento-card min-h-[400px] lg:min-h-0">
        <div className="card-title">Últimas Conversas (Logs)</div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {history.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Nenhuma conversa registrada ainda.
            </div>
          ) : (
            history.slice().reverse().map((log) => (
              <div key={log.id} className="p-4 rounded-xl border border-slate-700 bg-slate-800/40">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-emerald-500 font-bold">Usuário</span>
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
