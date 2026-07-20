import React, { memo } from "react";
import { Character, Message } from "../types";

interface CharacterItemProps {
  char: Character;
  isSelected: boolean;
  lastMsg?: Message;
  gameClock: number;
  currentLocation: string;
  onSelect: () => void;
}

export const CharacterItem = memo(function CharacterItem({
  char,
  isSelected,
  lastMsg,
  gameClock,
  currentLocation,
  onSelect,
}: CharacterItemProps) {
  // Determine if character is nearby
  const hour = gameClock % 24;
  const isMorning = hour >= 6 && hour < 12;
  const isDay = hour >= 12 && hour < 18;
  const isEvening = hour >= 18 && hour < 24;
  const isNight = hour >= 0 && hour < 6;
  let isHere = false;

  if (char.id === "max" && currentLocation === "apartment") {
    isHere = isMorning || isEvening || isNight;
  } else if (char.id === "masha") {
    if (currentLocation === "club" && (isEvening || isNight)) isHere = true;
    if (currentLocation === "apartment" && isDay) isHere = true;
  } else if (char.id === "artem" && currentLocation === "garage") {
    isHere = isDay || isEvening || isNight;
  } else if (char.id === "semenych" && currentLocation === "staircase") {
    isHere = isMorning || isDay || isEvening;
  } else if (char.id === "mihalych") {
    if (currentLocation === "garage" && isEvening) isHere = true;
    if (currentLocation === "staircase" && isDay) isHere = true;
  } else if (char.id === "sergey" && currentLocation === "office") {
    isHere = isDay || isEvening;
  } else if (char.id === "neighbor" && currentLocation === "staircase") {
    isHere = isDay || isEvening;
  }

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-all cursor-pointer relative ${
        isSelected
          ? "bg-indigo-600/15 border border-indigo-500/25 shadow-md shadow-indigo-950/20"
          : "hover:bg-neutral-800/40 border border-transparent"
      }`}
    >
      {/* Status Ring Avatar */}
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${char.avatarColor} flex items-center justify-center text-white font-bold text-base shadow-md`}>
          {char.name[0]}
        </div>
        {/* Status dot */}
        <span
          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-neutral-900 ${
            char.status === "В сети" ? "bg-emerald-500" :
            char.status === "Занят" ? "bg-amber-500" :
            char.status === "Играет" ? "bg-purple-500" :
            char.status === "Печатает..." ? "bg-cyan-500 animate-pulse" : "bg-neutral-500"
          }`}
          title={char.status}
        ></span>
      </div>

      {/* Character Meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-neutral-100 truncate">
            {char.name}
          </span>
          <span className="text-[9px] text-neutral-500 shrink-0">
            {lastMsg ? lastMsg.timestamp : ""}
          </span>
        </div>
        <div className="text-[10px] text-indigo-400 font-semibold truncate leading-none mt-0.5">
          {char.role}
        </div>
        <p className="text-[11px] text-neutral-400 truncate mt-1">
          {lastMsg ? lastMsg.content : "Диалог пуст. Напишите что-нибудь..."}
        </p>
        
        {/* Extra Pills */}
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {isHere && (
            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-extrabold flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Рядом
            </span>
          )}
          <span className="text-[8px] bg-neutral-850 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-800">
            {char.group}
          </span>
          <span className="text-[8px] bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/15 truncate max-w-[120px]">
            {char.attitude}
          </span>
          {char.scales && (
            <>
              {char.scales.love > 0 && (
                <span className="text-[8px] bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/15 font-bold" title={`Любовь: ${char.scales.love}%`}>
                  ❤️ {char.scales.love}%
                </span>
              )}
              {char.scales.lust > 0 && (
                <span className="text-[8px] bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/15 font-bold" title={`Вожделение: ${char.scales.lust}%`}>
                  🔥 {char.scales.lust}%
                </span>
              )}
              {char.scales.anger > 0 && (
                <span className="text-[8px] bg-red-500/10 text-red-300 px-1.5 py-0.5 rounded border border-red-500/15 font-bold" title={`Гнев: ${char.scales.anger}%`}>
                  ⚡ {char.scales.anger}%
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </button>
  );
});
