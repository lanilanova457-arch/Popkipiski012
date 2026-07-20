import React, { memo, useCallback } from "react";
import { Plus, Users, MessageSquare, Info } from "lucide-react";
import { Character, GroupChat, Message } from "../types";
import { CharacterItem } from "./CharacterItem";

export interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openCharacterModal: (char: Character | null) => void;
  setShowGroupModal: (show: boolean) => void;
  groupChats: GroupChat[];
  selectedChatId: string | null;
  setSelectedChatId: (id: string | null) => void;
  messages: Record<string, Message[]>;
  characters: Character[];
  gameClock: any;
  currentLocation: string;
}

export const Sidebar = memo(function Sidebar({
  activeTab,
  setActiveTab,
  openCharacterModal,
  setShowGroupModal,
  groupChats,
  selectedChatId,
  setSelectedChatId,
  messages,
  characters,
  gameClock,
  currentLocation,
}: SidebarProps) {
  const handleSelectChat = useCallback((id: string) => {
    setSelectedChatId(id);
    setActiveTab("chat");
  }, [setSelectedChatId, setActiveTab]);
  return (
    <aside className="w-80 border-r border-neutral-800 bg-neutral-900/30 flex flex-col shrink-0 hidden md:flex">
      
      {/* Navigation Tab Header (Inside Sidebar for Desktop) */}
      <div className="p-4 border-b border-neutral-800/60 flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 text-left">
          Ваше сюжетное пространство
        </span>
        <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800/50">
          <button
            onClick={() => { setActiveTab("chat"); }}
            className={`py-1.5 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "chat" 
                ? "bg-neutral-800 text-white shadow-sm font-semibold" 
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Чаты
          </button>
          <button
            onClick={() => { setActiveTab("map"); }}
            className={`py-1.5 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "map" 
                ? "bg-neutral-800 text-white shadow-sm font-semibold" 
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Карта
          </button>
          <button
            onClick={() => { setActiveTab("story"); }}
            className={`py-1.5 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "story" 
                ? "bg-neutral-800 text-white shadow-sm font-semibold" 
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Сюжет
          </button>
          <button
            onClick={() => { setActiveTab("lore"); }}
            className={`py-1.5 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "lore" 
                ? "bg-neutral-800 text-white shadow-sm font-semibold" 
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Сплетни
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => openCharacterModal(null)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Персонаж</span>
          </button>
          <button
            onClick={() => { setShowGroupModal(true); }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-[10px] font-bold rounded-lg shadow-sm transition-all border border-neutral-700 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>+ Группа</span>
          </button>
        </div>
      </div>

      {/* Chat list viewport */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
        
        {/* Group Chats Section */}
        {groupChats.length > 0 && (
          <div className="space-y-1.5 text-left">
            <div className="text-[10px] font-bold text-neutral-500 px-2 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-neutral-500" />
              <span>Групповые беседы ({groupChats.length})</span>
            </div>
            {groupChats.map(group => {
              const isSelected = group.id === selectedChatId;
              const chatMsgs = messages[group.id] || [];
              const lastMsg = chatMsgs[chatMsgs.length - 1];

              return (
                <button
                  key={group.id}
                  onClick={() => handleSelectChat(group.id)}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-indigo-600/15 border border-indigo-500/25 shadow-md shadow-indigo-950/20"
                      : "hover:bg-neutral-800/40 border border-transparent"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${group.avatarColor} flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0`}>
                    {group.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-neutral-100 truncate">
                        {group.name}
                      </span>
                      <span className="text-[9px] text-neutral-500 shrink-0">
                        {lastMsg ? lastMsg.timestamp : ""}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {lastMsg ? lastMsg.content : "Сообщений нет. Начните диалог первым!"}
                    </p>
                    <span className="text-[9px] bg-neutral-850 text-indigo-400 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                      👥 Участников: {group.participantIds.length}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Private Chats Section */}
        <div className="space-y-1.5 text-left">
          <div className="text-[10px] font-bold text-neutral-500 px-2 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
            <span>Личные переписки ({characters.length})</span>
          </div>
          
          {characters.length === 0 ? (
            <div className="text-center p-4 text-xs text-neutral-600">Нет персонажей. Создайте своего!</div>
          ) : (
            characters.map(char => {
              const isSelected = char.id === selectedChatId;
              const charMsgs = messages[char.id] || [];
              const lastMsg = charMsgs[charMsgs.length - 1];

              return (
                <CharacterItem
                  key={char.id}
                  char={char}
                  isSelected={isSelected}
                  lastMsg={lastMsg}
                  gameClock={gameClock}
                  currentLocation={currentLocation}
                  onSelect={handleSelectChat}
                />
              );
            })
          )}
        </div>

      </div>

      {/* Quick info panel at bottom of sidebar */}
      <div className="p-4 border-t border-neutral-800/60 bg-neutral-900/10 text-[10px] text-neutral-500 flex flex-col gap-1.5 text-left">
        <div className="flex items-center gap-1 text-neutral-400">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold">Персонаж Начинает Вторым</span>
        </div>
        <p>Диалоги теперь чисты по умолчанию. Ваше первое слово и личность игрока задают тон всей ролевой ветке.</p>
      </div>
    </aside>
  );
});
