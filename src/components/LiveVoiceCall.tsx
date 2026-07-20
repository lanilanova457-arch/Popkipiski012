import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, X, PhoneOff } from "lucide-react";
import { Character, CallState, Message } from "../types";

interface LiveVoiceCallProps {
  activeCall: CallState | null;
  activeChar: Character | null;
  currentChatMessages: Message[];
  callInputText: string;
  setCallInputText: (v: string) => void;
  handleSendMessage: (e: React.FormEvent, customText?: string, isFromCall?: boolean) => void;
  handleHangupCall: () => void;
  isLoading: boolean;
}

export const LiveVoiceCall: React.FC<LiveVoiceCallProps> = ({
  activeCall,
  activeChar,
  currentChatMessages,
  callInputText,
  setCallInputText,
  handleSendMessage,
  handleHangupCall,
  isLoading
}) => {
  const localChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localChatEndRef.current) {
      localChatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentChatMessages, activeCall?.status]);

  return (
    <AnimatePresence>
      {activeCall && activeChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/95 backdrop-blur-md p-4 text-xs">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center flex flex-col justify-between h-[80vh] min-h-[450px] relative overflow-hidden shadow-2xl"
          >
            {/* Soundwaves pattern background */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] opacity-40 z-0"></div>

            {/* Header Status */}
            <div className="space-y-1 relative z-10">
              <span className={`text-[10px] ${activeCall.type === "in_person" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-red-500/10 text-red-400 border border-red-500/15"} px-2.5 py-1 rounded-full font-bold uppercase tracking-wider select-none`}>
                {activeCall.type === "in_person" ? "🗣️ ЛИЧНЫЙ РАЗГОВОР ВЖИВУЮ" : "🔴 ИДЕТ ЗАПИСЬ ЗВОНКА"}
              </span>
              <p className="text-[11px] text-neutral-500 mt-2">
                {activeCall.type === "in_person" ? "Личная встреча (Сюжетный отыгрыш рядом)" : "Телефонный разговор (Simulated Text-Call)"}
              </p>
            </div>

            {/* Glowing Caller Avatar */}
            <div className="flex flex-col items-center gap-3 py-6 relative z-10">
              <div className="relative">
                {/* Pulsing ring */}
                <span className={`absolute inset-0 rounded-3xl ${activeCall.type === "in_person" ? "bg-emerald-500/25" : "bg-indigo-500/25"} animate-ping opacity-75`}></span>
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-tr ${activeChar.avatarColor} flex items-center justify-center text-white font-extrabold text-3xl shadow-xl shadow-neutral-950 relative z-10`}>
                  {activeChar.name[0]}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base text-neutral-100">{activeChar.name}</h3>
                <p className={`text-[10px] ${activeCall.type === "in_person" ? "text-emerald-400" : "text-indigo-400"} font-semibold`}>{activeChar.role}</p>
              </div>

              <div className="text-xs font-mono text-neutral-300 font-semibold flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${activeCall.type === "in_person" ? "bg-emerald-400" : "bg-indigo-400"} animate-pulse`}></span>
                {activeCall.status === "calling" ? (
                  <span className="animate-pulse">
                    {activeCall.type === "in_person" ? "Вы подходите ближе..." : "Идет гудок..."}
                  </span>
                ) : (
                  <span>
                    Соединение • {Math.floor(activeCall.duration / 60).toString().padStart(2, "0")}:
                    {(activeCall.duration % 60).toString().padStart(2, "0")}
                  </span>
                )}
              </div>
            </div>

            {/* Call Messages / Environment Subtitles Scrollable Area */}
            <div className="flex-1 bg-neutral-950/60 rounded-2xl border border-neutral-850 p-3 space-y-3 overflow-y-auto custom-scrollbar flex flex-col justify-end text-left my-4 relative z-10">
              <div className="text-[9px] text-neutral-500 border-b border-neutral-900 pb-1 mb-1 font-bold select-none text-center">
                {activeCall.type === "in_person" ? "МЫСЛИ, ВЗГЛЯДЫ И РЕЧЬ ПРИ ВСТРЕЧЕ" : "СУБТИТРЫ ЗВОНКА И ШУМЫ ОКРУЖЕНИЯ"}
              </div>

              {activeCall.status === "calling" ? (
                <div className="text-neutral-500 italic text-center text-[11px] py-4 select-none animate-pulse">
                  {activeCall.type === "in_person" 
                    ? "[Установление зрительного контакта... Персонаж замечает вас]" 
                    : "[Длинные телефонные гудки... Нарастание шума на линии]"
                  }
                </div>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {currentChatMessages.filter(m => activeCall.type === "in_person" ? m.isLive : m.isCall).slice(-4).map(msg => {
                    const isMe = msg.role === "user";
                    return (
                      <div key={msg.id} className="text-[11px] leading-relaxed">
                        <span className={`font-bold ${isMe ? (activeCall.type === "in_person" ? "text-emerald-400" : "text-indigo-400") : "text-amber-400"}`}>
                          {isMe ? "Вы" : activeChar.name}:
                        </span>{" "}
                        <span className="text-neutral-300">{msg.content}</span>
                      </div>
                    );
                  })}
                  <div ref={localChatEndRef} />
                </div>
              )}
            </div>

            {/* Call Input Action or Hangup */}
            <div className="space-y-4 relative z-10">
              {activeCall.status === "connected" && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={callInputText}
                    onChange={(e) => setCallInputText(e.target.value)}
                    placeholder={activeCall.type === "in_person" ? "Скажите что-нибудь вживую..." : "Скажите фразу текстом..."}
                    className={`flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 placeholder-neutral-700 focus:outline-none ${activeCall.type === "in_person" ? "focus:border-emerald-500" : "focus:border-indigo-500"} text-xs font-medium`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && callInputText.trim() && !isLoading) {
                        handleSendMessage(null as any, callInputText, true);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!callInputText.trim() || isLoading}
                    onClick={() => handleSendMessage(null as any, callInputText, true)}
                    className={`p-2.5 ${activeCall.type === "in_person" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-indigo-600 hover:bg-indigo-500"} disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-xl shadow-md cursor-pointer transition-all shrink-0`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center">
                <button
                  onClick={handleHangupCall}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-lg shadow-red-950/40 font-bold text-xs cursor-pointer transition-all active:scale-[0.98]"
                >
                  {activeCall.type === "in_person" ? <X className="w-4 h-4" /> : <PhoneOff className="w-4 h-4" />}
                  <span>{activeCall.type === "in_person" ? "Попрощаться (Завершить)" : "Положить трубку (Завершить)"}</span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
