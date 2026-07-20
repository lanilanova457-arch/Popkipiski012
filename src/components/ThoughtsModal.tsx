import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, X } from "lucide-react";
import { Character } from "../types";

interface ThoughtsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChar: Character | null;
  thoughtsLoading: boolean;
  thoughtsError: string | null;
  thoughtsData: {
    thoughts: string;
    motives: string;
    visualAttitude: string;
    nextActionPlan: string;
  } | null;
  handleFetchThoughts: () => void;
}

export const ThoughtsModal: React.FC<ThoughtsModalProps> = ({
  isOpen,
  onClose,
  activeChar,
  thoughtsLoading,
  thoughtsError,
  thoughtsData,
  handleFetchThoughts
}) => {
  return (
    <AnimatePresence>
      {isOpen && activeChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-neutral-900 border border-purple-500/30 w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col text-xs text-neutral-200"
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-purple-400">
                <Brain className="w-5 h-5 animate-pulse text-purple-400" />
                <div className="text-left">
                  <h3 className="font-bold text-sm text-white">Истинные мысли и мотивы</h3>
                  <p className="text-[10px] text-purple-400/70 font-semibold">{activeChar.name} • Подсознание</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content viewport */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5 custom-scrollbar text-left">
              {thoughtsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Brain className="w-12 h-12 text-purple-500 animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-neutral-300 font-bold text-xs animate-pulse">Проникновение в разум...</p>
                    <p className="text-[10px] text-neutral-500">Считываем истинное отношение, скрытые мотивы и планы {activeChar.name}</p>
                  </div>
                </div>
              ) : thoughtsError ? (
                <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl space-y-2 text-center">
                  <p className="text-red-400 font-bold">Упс! Произошла ошибка</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">{thoughtsError}</p>
                  <button
                    type="button"
                    onClick={handleFetchThoughts}
                    className="px-4 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-800/60 text-red-200 rounded-lg font-bold text-[11px] transition-all cursor-pointer mt-1"
                  >
                    Повторить попытку
                  </button>
                </div>
              ) : thoughtsData ? (
                <div className="space-y-5">
                  {/* 1. Thoughts monologue */}
                  <div className="bg-purple-950/25 border border-purple-900/35 p-4 rounded-xl space-y-1.5 relative overflow-hidden">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">💬 Внутренний монолог (от первого лица):</span>
                    <p className="text-purple-100 italic leading-relaxed text-[11.5px] relative z-10">
                      "{thoughtsData.thoughts}"
                    </p>
                  </div>

                  {/* 2. Hidden Motives */}
                  <div className="bg-neutral-950/50 border border-neutral-800/80 p-4 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">🎯 Скрытые мотивы и цели:</span>
                    <p className="text-neutral-300 leading-relaxed text-[11px]">
                      {thoughtsData.motives}
                    </p>
                  </div>

                  {/* 3. Visual assessment */}
                  <div className="bg-neutral-950/50 border border-neutral-800/80 p-4 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">🍓 Оценка вашей внешности:</span>
                    <p className="text-neutral-300 leading-relaxed text-[11px]">
                      {thoughtsData.visualAttitude}
                    </p>
                  </div>

                  {/* 4. Action plans */}
                  <div className="bg-neutral-950/50 border border-neutral-800/80 p-4 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">♟️ План действий в отношении вас:</span>
                    <p className="text-neutral-300 leading-relaxed text-[11px]">
                      {thoughtsData.nextActionPlan}
                    </p>
                  </div>

                  <p className="text-[9px] text-neutral-500 text-center italic mt-2 leading-relaxed">
                    * Внимание! Эти мысли абсолютно честны и раскрывают подлинные намерения персонажа, включая манипуляции, влечение или шантаж, основанные на текущей истории чата и вашем фото.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Footer action */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-[11px] shadow-lg shadow-purple-950/50 transition-all cursor-pointer"
              >
                Понятно
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
