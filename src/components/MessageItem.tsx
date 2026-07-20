import React, { memo } from "react";
import { motion } from "motion/react";
import { Trash2, Mic } from "lucide-react";
import { Message, Character, UserProfile, GroupChat } from "../types";

interface MessageItemProps {
  msg: Message;
  userProfile: UserProfile | null;
  characters: Character[];
  activeChar: Character | null;
  activeGroup: GroupChat | null;
  onDelete: (id: string) => void;
  onZoomImage: (url: string) => void;
}

export const MessageItem = memo(function MessageItem({
  msg,
  userProfile,
  characters,
  activeChar,
  activeGroup,
  onDelete,
  onZoomImage,
}: MessageItemProps) {
  const isUser = msg.role === "user";
  const isNarrator = msg.role === "narrator";
  let senderName = userProfile?.name || "Игрок";
  let senderColor = "from-indigo-400 to-indigo-600";
  
  if (!isUser && !isNarrator) {
    const matched = characters.find(c => c.id === msg.senderId);
    senderName = matched ? matched.name : (activeChar ? activeChar.name : "Персонаж");
    senderColor = matched ? matched.avatarColor : (activeChar ? activeChar.avatarColor : "from-neutral-400 to-neutral-700");
  }

  if (isNarrator) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-3 w-full"
      >
        <div className="max-w-[90%] sm:max-w-[80%] bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 shadow-lg text-center backdrop-blur-sm relative group">
          
          {/* Delete message button */}
          <button
            onClick={() => onDelete(msg.id)}
            className="absolute -top-2 -right-2 bg-red-950/95 border border-red-500/30 text-red-400 hover:text-white p-1 rounded-full opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 cursor-pointer z-10"
            title="Удалить сообщение и переиграть ветку"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-neutral-950 px-3 text-[9px] font-bold text-amber-400 border border-amber-500/20 rounded-full tracking-widest uppercase flex items-center gap-1 select-none">
            <span className="animate-pulse">🎭</span> СЛУЧИЛОСЬ СОБЫТИЕ (РАССКАЗЧИК)
          </div>

          {/* Attached Image or Video inside Narrator Bubble */}
          {msg.image && typeof msg.image === "string" && (
            <div className="mb-2.5 mx-auto rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950/90 shadow-md max-w-sm text-left">
              {msg.image.startsWith("data:video/") ? (
                <video
                  src={msg.image}
                  controls
                  className="w-full max-h-64 object-cover"
                />
              ) : msg.image.startsWith("data:image/") ? (
                <div className="cursor-zoom-in">
                  <img
                    src={msg.image}
                    alt="Attached"
                    onClick={() => onZoomImage(msg.image || "")}
                    referrerPolicy="no-referrer"
                    className="w-full object-cover hover:scale-105 transition-all"
                  />
                </div>
              ) : (
                /* Simulated photo box */
                <div className="p-3.5 border-l-4 border-amber-500 bg-gradient-to-r from-neutral-900 to-neutral-950">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-[10px] uppercase tracking-wider mb-1.5 select-none">
                    <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>[Рассказчик прикрепил визуализацию]</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-200 italic leading-relaxed whitespace-pre-wrap select-text font-serif">
                    {msg.image}
                  </p>
                </div>
              )}
            </div>
          )}

          <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed font-serif italic whitespace-pre-wrap">
            {msg.content}
          </p>
          <div className="text-[8px] text-neutral-500 mt-1 select-none">
            {msg.timestamp} • Направление задано Рассказчиком
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2`}
    >
      {/* Avatar for characters */}
      {!isUser && (
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${senderColor} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 hidden sm:flex`}>
          {senderName[0]}
        </div>
      )}

      {/* Bubble frame */}
      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-md relative group ${
        isUser
          ? msg.isLive
            ? "bg-emerald-600 text-white rounded-br-none border border-emerald-500/20"
            : msg.isCall
            ? "bg-indigo-600 text-white rounded-br-none border border-indigo-500/20"
            : "bg-indigo-600 text-white rounded-br-none"
          : msg.isLive
          ? "bg-neutral-900 text-neutral-100 rounded-bl-none border border-emerald-500/35"
          : msg.isCall
          ? "bg-neutral-900 text-neutral-100 rounded-bl-none border border-indigo-500/35"
          : "bg-neutral-900 text-neutral-100 rounded-bl-none border border-neutral-800/80"
      }`}>
        
        {/* Delete message button (Allows to replay dialogue from any point) */}
        <button
          onClick={() => onDelete(msg.id)}
          className="absolute -top-2 -right-2 bg-red-950/95 border border-red-500/30 text-red-400 hover:text-white p-1 rounded-full opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 cursor-pointer z-10"
          title="Удалить сообщение и переиграть ветку"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        
        {/* Group Chat sender indicator */}
        {activeGroup && !isUser && (
          <div className="text-[10px] text-indigo-400 font-bold mb-1">
            {senderName}
          </div>
        )}
        
        {/* Attached Image or Video inside Bubble */}
        {msg.image && typeof msg.image === "string" && (
          <div className="mb-2 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950/90 shadow-md max-w-sm">
            {msg.image.startsWith("data:video/") ? (
              <video
                src={msg.image}
                controls
                className="w-full max-h-64 object-cover"
              />
            ) : msg.image.startsWith("data:image/") ? (
              <div className="cursor-zoom-in">
                <img
                  src={msg.image}
                  alt="Attached"
                  onClick={() => onZoomImage(msg.image || "")}
                  referrerPolicy="no-referrer"
                  className="w-full object-cover hover:scale-105 transition-all"
                />
              </div>
            ) : (
              /* This is our beautifully styled SIMULATED PHOTO box! */
              <div className="p-3.5 border-l-4 border-indigo-500 bg-gradient-to-r from-neutral-900 to-neutral-950">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-[10px] uppercase tracking-wider mb-1.5 select-none">
                  <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>[Вам прислали фото]</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-200 italic leading-relaxed whitespace-pre-wrap select-text">
                  {msg.image}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mode Indicators inside the bubble */}
        {msg.isLive && (
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 mb-1 leading-none select-none uppercase tracking-wider">
            <span>🗣️ Разговор вживую</span>
          </div>
        )}

        {msg.isCall && (
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-400 mb-1 leading-none select-none uppercase tracking-wider">
            <span>📞 Звонок по телефону</span>
          </div>
        )}

        {msg.isVoice && !msg.isLive && !msg.isCall && (
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-500 mb-1 leading-none select-none uppercase tracking-wider">
            <Mic className="w-3 h-3 text-amber-500 animate-pulse" />
            <span>🎙️ Голосовая заметка</span>
          </div>
        )}

        {/* Text Content */}
        <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">
          {msg.content}
        </p>

        {/* Message Footer: Timestamp */}
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-neutral-800/5 text-[9px] opacity-65">
          <span>{msg.timestamp}</span>
          {(msg.isVoice || msg.isCall || msg.isLive) && (
            <span className="text-[8px] bg-neutral-950/40 text-neutral-400 px-1.5 py-0.5 rounded uppercase tracking-wide">
              {msg.isLive ? "Лично" : msg.isCall ? "Звонок" : "Голос"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});
