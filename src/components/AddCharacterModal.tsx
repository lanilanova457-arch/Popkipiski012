import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { PenSquare, X } from "lucide-react";

interface AddCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCharId: string | null;
  charName: string;
  setCharName: (v: string) => void;
  charRole: string;
  setCharRole: (v: string) => void;
  charGroup: "Друзья" | "Семья" | "Работа" | "Соседи";
  setCharGroup: (v: "Друзья" | "Семья" | "Работа" | "Соседи") => void;
  charPersonality: string;
  setCharPersonality: (v: string) => void;
  charAttitude: string;
  setCharAttitude: (v: string) => void;
  charSpeech: string;
  setCharSpeech: (v: string) => void;
  charGreeting: string;
  setCharGreeting: (v: string) => void;
  charTrust: number;
  setCharTrust: (v: number) => void;
  charLove: number;
  setCharLove: (v: number) => void;
  charLust: number;
  setCharLust: (v: number) => void;
  charAnger: number;
  setCharAnger: (v: number) => void;
  charFetishesText: string;
  setCharFetishesText: (v: string) => void;
  charInclinationsText: string;
  setCharInclinationsText: (v: string) => void;
  charPenisSize: number;
  setCharPenisSize: (v: number) => void;
  charBallFullness: number;
  setCharBallFullness: (v: number) => void;
  handleSaveCharacter: (e: React.FormEvent) => void;
}

export const AddCharacterModal: React.FC<AddCharacterModalProps> = ({
  isOpen,
  onClose,
  editingCharId,
  charName,
  setCharName,
  charRole,
  setCharRole,
  charGroup,
  setCharGroup,
  charPersonality,
  setCharPersonality,
  charAttitude,
  setCharAttitude,
  charSpeech,
  setCharSpeech,
  charGreeting,
  setCharGreeting,
  charTrust,
  setCharTrust,
  charLove,
  setCharLove,
  charLust,
  setCharLust,
  charAnger,
  setCharAnger,
  charFetishesText,
  setCharFetishesText,
  charInclinationsText,
  setCharInclinationsText,
  charPenisSize,
  setCharPenisSize,
  charBallFullness,
  setCharBallFullness,
  handleSaveCharacter
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
              <div className="flex items-center gap-2 text-indigo-400">
                <PenSquare className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">
                  {editingCharId ? `Настройка характера: ${charName}` : "Создать нового персонажа"}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form content */}
            <form onSubmit={handleSaveCharacter} className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1 font-bold">Имя персонажа *</label>
                  <input
                    type="text"
                    required
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    placeholder="Например: Алина"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1 font-bold">Роль / Связь *</label>
                  <input
                    type="text"
                    required
                    value={charRole}
                    onChange={(e) => setCharRole(e.target.value)}
                    placeholder="Например: Тайная воздыхательница"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1 font-bold">Социальный круг *</label>
                <select
                  value={charGroup}
                  onChange={(e) => setCharGroup(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="Друзья">👥 Друзья (Делится сплетнями с Машей и Артёмом)</option>
                  <option value="Семья">🏡 Семья (Родные, родители)</option>
                  <option value="Работа">💼 Работа (Коллеги)</option>
                  <option value="Соседи">🧱 Соседи (Жильцы дома)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1 font-bold">Подробное описание характера *</label>
                <textarea
                  required
                  rows={3}
                  value={charPersonality}
                  onChange={(e) => setCharPersonality(e.target.value)}
                  placeholder="Например: Капризная, ревнивая, обожает дорогие клубы. Часто злится по пустякам, но легко прощает."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1 font-bold">Отношение к вам</label>
                  <input
                    type="text"
                    value={charAttitude}
                    onChange={(e) => setCharAttitude(e.target.value)}
                    placeholder="Ревнивый флирт"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1 font-bold">Манера общения</label>
                  <input
                    type="text"
                    value={charSpeech}
                    onChange={(e) => setCharSpeech(e.target.value)}
                    placeholder="Шлет капс и кучу сердечек"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1 font-bold">Первое приветствие (Для подсказок запуска)</label>
                <input
                  type="text"
                  value={charGreeting}
                  onChange={(e) => setCharGreeting(e.target.value)}
                  placeholder="Привет! Где ты шляешься? Мы же договаривались..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Adult 21+ qualities & relationship scales section */}
              <div className="border-t border-neutral-800/80 pt-4 space-y-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block select-none">
                  🍓 Ролевые показатели и наклонности (21+)
                </span>

                {/* Scales editing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1 font-semibold">🤝 Доверие (0-100%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={charTrust}
                      onChange={(e) => setCharTrust(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1 font-semibold">❤️ Любовь (0-100%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={charLove}
                      onChange={(e) => setCharLove(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1 font-semibold">🔥 Вожделение (0-100%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={charLust}
                      onChange={(e) => setCharLust(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1 font-semibold">⚡ Гнев (0-100%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={charAnger}
                      onChange={(e) => setCharAnger(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>

                {/* Fetishes and inclinations editing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1 font-semibold">🍓 Фетиши (через запятую)</label>
                    <input
                      type="text"
                      value={charFetishesText}
                      onChange={(e) => setCharFetishesText(e.target.value)}
                      placeholder="минет, чулки, подчинение"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1 font-semibold">🧠 Склонности (через запятую)</label>
                    <input
                      type="text"
                      value={charInclinationsText}
                      onChange={(e) => setCharInclinationsText(e.target.value)}
                      placeholder="бисексуал, эксгибиционизм"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>

                {/* Male anatomy editing parameters */}
                <div className="grid grid-cols-2 gap-3 bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/60">
                  <div>
                    <label className="block text-[10px] text-rose-300 font-bold uppercase mb-1">Размер члена (8-30 см)</label>
                    <input
                      type="number"
                      min={8}
                      max={30}
                      value={charPenisSize}
                      onChange={(e) => setCharPenisSize(Math.min(30, Math.max(8, parseInt(e.target.value) || 16)))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-rose-300 font-bold uppercase mb-1">Набухание яиц (0-100%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={charBallFullness}
                      onChange={(e) => setCharBallFullness(Math.min(100, Math.max(0, parseInt(e.target.value) || 50)))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Form Footer */}
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-950 cursor-pointer"
                >
                  {editingCharId ? "Сохранить изменения" : "Создать персонажа"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
