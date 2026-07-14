import { useState, useEffect } from "react";
import { QrCode, Smartphone, CheckCircle2, RefreshCw } from "lucide-react";
import { api } from "../../api";

export default function Connection() {
  const [waStatus, setWaStatus] = useState("DISCONNECTED");
  const [qrCode, setQrCode] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loadingCode, setLoadingCode] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const fetchStatus = async () => {
      try {
        const data = await api.getWaStatus();
        setWaStatus(data.status);
        if (data.qr) setQrCode(data.qr);
        if (data.pairingCode) setPairingCode(data.pairingCode);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 3000); // Poll every 3s

    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setStarting(true);
    try {
      await api.startWa();
    } catch (err) {
      console.error(err);
    }
    setStarting(false);
  };

  const handleGetPairingCode = async () => {
    if (!phoneNumber) return alert("Digite o número do telefone");
    setLoadingCode(true);
    try {
      const data = await api.requestWaPairingCode(phoneNumber);
      setPairingCode(data.code);
    } catch (err: any) {
      alert(err.message);
    }
    setLoadingCode(false);
  };

  const handleLogout = async () => {
    if (confirm("Tem certeza que deseja desconectar o WhatsApp?")) {
      try {
        await api.logoutWa();
        setWaStatus("DISCONNECTED");
        setQrCode("");
        setPairingCode("");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReset = async () => {
    try {
      await api.resetWa();
      setWaStatus("DISCONNECTED");
      setQrCode("");
      setPairingCode("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="bento-card min-h-[500px] lg:min-h-0" style={{ gridColumn: 'span 10', gridRow: 'span 12' }}>
        <div className="card-title">Conexão WhatsApp</div>
        <p className="text-slate-400 mt-1 mb-2">Conecte seu número para que a IA comece a responder automaticamente.</p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full mb-8">
          <CheckCircle2 className="w-3 h-3" />
          <span>Suporta WhatsApp Normal e Business</span>
        </div>

        {waStatus === "CONNECTED" ? (
          <div className="flex flex-col items-center justify-center space-y-4 text-center mt-12">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-400">Conectado com Sucesso!</h3>
              <p className="text-emerald-500/80 mt-2 max-w-md mx-auto">
                Sua IA agora está monitorando as mensagens e respondendo automaticamente de acordo com as regras de treinamento.
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="mt-6 px-6 py-2.5 bg-slate-800 text-red-400 font-medium rounded-xl border border-red-900/50 hover:bg-red-900/20 transition-colors"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="bg-slate-800 p-6 rounded-2xl mb-6 relative flex items-center justify-center h-56 w-56">
                {qrCode ? (
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48 rounded-lg" />
                ) : (
                  <QrCode className="w-24 h-24 text-slate-500" />
                )}
                {waStatus === "CONNECTING" && !qrCode && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-white">Opção 1: Escanear QR Code</h3>
              <p className="text-sm text-slate-400 mt-2 mb-6">
                Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e aponte a câmera.
              </p>
              {waStatus === "DISCONNECTED" && (
                <button 
                  onClick={handleStart}
                  disabled={starting}
                  className="px-8 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {starting ? "Iniciando..." : "Gerar QR Code"}
                </button>
              )}
            </div>

            <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                <Smartphone className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Opção 2: Código de Pareamento</h3>
              <p className="text-sm text-slate-400 mt-2 mb-6">
                Ideal para quem está no próprio celular.
              </p>
              
              {pairingCode ? (
                <div className="w-full">
                  <div className="text-sm text-slate-400 mb-2">Seu código é:</div>
                  <div className="text-4xl font-mono font-bold text-emerald-400 tracking-[0.2em] mb-4 bg-slate-800 py-4 rounded-xl border border-slate-700">
                    {pairingCode}
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Abra a notificação do WhatsApp ou vá em aparelhos conectados para inserir o código.
                  </p>
                  <button 
                    onClick={handleReset}
                    className="text-sm text-slate-400 hover:text-white transition-colors underline"
                  >
                    Trocar número ou tentar novamente
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <input 
                    type="text" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ex: 5511999999999" 
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white outline-none transition-all"
                  />
                  <button 
                    onClick={handleGetPairingCode}
                    disabled={loadingCode || waStatus === "CONNECTING"}
                    className="w-full px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loadingCode ? "Gerando..." : "Gerar Código"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
