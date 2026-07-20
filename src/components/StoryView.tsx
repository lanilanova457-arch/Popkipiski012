import React, { memo } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { StoryLog } from "../types";

export interface StoryViewProps {
  isStoryLoading: boolean;
  storyLog: StoryLog | null;
  customDirectiveText: string;
  setCustomDirectiveText: (val: string) => void;
  refreshStoryteller: (directive?: string) => Promise<void>;
}

export const StoryView = memo(function StoryView({
  isStoryLoading,
  storyLog,
  customDirectiveText,
  setCustomDirectiveText,
  refreshStoryteller,
}: StoryViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="flex items-center gap-2 text-indigo-400">
          <BookOpen className="w-5 h-5" />
          <span className="font-bold uppercase tracking-wider text-xs">Личный Хронометр Судьбы</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">Формирующийся Сюжет (Рассказчик)</h2>
        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
          Куратор ИИ анализирует все ваши диалоги, тайны и раскрытые слухи, сплетая их в полноценное интерактивное произведение. Нажмите кнопку обновления, чтобы Рассказчик обновил сводку и зафиксировал новые вехи!
        </p>

        <div className="pt-2 flex items-center justify-center">
          <button
            onClick={() => refreshStoryteller()}
            disabled={isStoryLoading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl shadow-lg shadow-indigo-950 font-bold text-xs sm:text-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isStoryLoading ? "animate-spin" : ""}`} />
            <span>{isStoryLoading ? "Рассказчик обдумывает сюжет..." : "🎭 Обновить сюжет на базе диалогов"}</span>
          </button>
        </div>
      </div>

      {/* Storyteller Direct Intervention Interface */}
      <div className="max-w-2xl mx-auto bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl space-y-4 shadow-lg backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-2 text-amber-400">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <h3 className="font-bold text-xs uppercase tracking-wider">Корректировка линии судьбы (Воля Рассказчика)</h3>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Опишите любое внезапное событие, сюжетный поворот, звонок или действие третьих лиц. Рассказчик перестроит сводку событий и сгенерирует новые слухи, которые персонажи сразу начнут обсуждать в чатах.
        </p>
        <div className="space-y-3">
          <textarea
            value={customDirectiveText}
            onChange={(e) => setCustomDirectiveText(e.target.value)}
            placeholder="Пример: 'Внезапно мама находит в моей комнате пачку сигарет и устраивает скандал' или 'Артем попадает в аварию во время гонки и просит меня о помощи'..."
            rows={3}
            className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-all resize-none"
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isStoryLoading || !customDirectiveText.trim()}
              onClick={async () => {
                const directive = customDirectiveText.trim();
                if (!directive) return;
                setCustomDirectiveText("");
                await refreshStoryteller(directive);
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-neutral-800 disabled:to-neutral-800 text-neutral-950 disabled:text-neutral-500 font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isStoryLoading ? "Материализация событий..." : "Внедрить волю Рассказчика"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-6 space-y-6">
        
        {isStoryLoading ? (
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center space-y-3 animate-pulse">
            <div className="h-4 bg-neutral-800 rounded w-2/3 mx-auto"></div>
            <div className="h-3 bg-neutral-800 rounded w-5/6 mx-auto"></div>
            <div className="h-3 bg-neutral-800 rounded w-4/5 mx-auto"></div>
            <div className="h-3 bg-neutral-800 rounded w-1/2 mx-auto"></div>
          </div>
        ) : storyLog ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Story Summary text */}
            <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl backdrop-blur-md space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Текущая ситуация</span>
                <span className="text-[10px] text-neutral-500">Обновлено: {storyLog.lastUpdated}</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap font-serif tracking-wide">
                {storyLog.storySummary}
              </p>
            </div>

            {/* Timeline key chapters */}
            {storyLog.keyChapters && storyLog.keyChapters.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Разблокированные Сюжетные Вехи</h3>
                <div className="space-y-2 relative pl-4 border-l border-indigo-500/20">
                  {storyLog.keyChapters.map((chapter, idx) => (
                    <div key={idx} className="relative py-1">
                      <span className="absolute -left-[21px] top-2 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-neutral-950 shadow"></span>
                      <div className="bg-neutral-900/40 border border-neutral-850 p-3 rounded-xl">
                        <h4 className="font-bold text-xs text-neutral-200">Веха {idx + 1}: {chapter}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="bg-neutral-900/30 border border-neutral-800/80 p-8 rounded-3xl text-center text-neutral-500 text-sm leading-relaxed max-w-xl mx-auto">
            <BookOpen className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
            <span>Сюжетный журнал пока пуст. Пообщайтесь с персонажами в чатах, а затем обновите сюжет сверху, чтобы запустить формирование общей повести!</span>
          </div>
        )}

      </div>
    </div>
  );
});
