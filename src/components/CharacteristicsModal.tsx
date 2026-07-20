import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, X } from "lucide-react";
import { Character, SharedFact } from "../types";
import { getPenisSizeGradation, getBallFullnessText } from "../utils/helpers";

interface CharacteristicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChar: Character | null;
  visibleFacts: SharedFact[];
}

export const CharacteristicsModal: React.FC<CharacteristicsModalProps> = ({
  isOpen,
  onClose,
  activeChar,
  visibleFacts
}) => {
  return (
    <AnimatePresence>
      {isOpen && activeChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-800 bg-neutral-950/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 text-indigo-400">
                <User className="w-5 h-5 text-indigo-400 animate-pulse" />
                <div className="text-left">
                  <h3 className="font-bold text-sm text-white">Досье Персонажа</h3>
                  <p className="text-[10px] text-indigo-400/70 font-semibold">{activeChar.name} • {activeChar.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-left flex-1">
              {/* Avatar and Main Info Card */}
              <div className="flex items-center gap-4 bg-neutral-950/40 border border-neutral-850 p-4 rounded-xl">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${activeChar.avatarColor} flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-neutral-950`}>
                  {activeChar.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-base text-neutral-100">{activeChar.name}</h4>
                  <p className="text-xs text-indigo-400 font-semibold">{activeChar.role}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Круг общения: «{activeChar.group}»</p>
                </div>
              </div>

              {/* Characteristics descriptions */}
              <div className="space-y-3.5 text-xs text-neutral-300">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">🎭 Характер:</span>
                  <p className="bg-neutral-950/30 border border-neutral-850 p-2.5 rounded-lg leading-relaxed">{activeChar.personality}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">🗣️ Манера речи:</span>
                  <p className="bg-neutral-950/30 border border-neutral-850 p-2.5 rounded-lg leading-relaxed">{activeChar.speechStyle}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">💬 Текущее отношение:</span>
                  <p className="bg-neutral-950/30 border border-neutral-850 p-2.5 rounded-lg leading-relaxed font-semibold text-indigo-300">{activeChar.attitude}</p>
                </div>
              </div>

              {/* 21+ Relationship Scales */}
              {activeChar.scales && (
                <div className="pt-4 border-t border-neutral-800 space-y-4">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    📊 Показатели отношений (21+):
                  </span>

                  {/* Prominent Intimacy/Близость Bar */}
                  {activeChar.scales.intimacy !== undefined && (
                    <div className="bg-neutral-950/40 border border-neutral-850 p-3.5 rounded-xl space-y-1.5 shadow-inner">
                      <div className="flex justify-between text-xs font-bold text-neutral-200">
                        <span className="flex items-center gap-1">💞 Близость (Главная шкала)</span>
                        <span className="text-rose-400">{(activeChar.scales.intimacy !== undefined && !isNaN(activeChar.scales.intimacy)) ? activeChar.scales.intimacy : 20}%</span>
                      </div>
                      <div className="w-full bg-neutral-950 h-3 rounded-full overflow-hidden border border-neutral-850 p-0.5">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-rose-400 rounded-full transition-all duration-500" 
                          style={{ width: `${(activeChar.scales.intimacy !== undefined && !isNaN(activeChar.scales.intimacy)) ? activeChar.scales.intimacy : 20}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-normal">
                        Близость растет от приятного общения. При достижении <strong className="text-neutral-400">65%</strong> персонаж раскроет тебе свои интимные параметры.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {/* Trust */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-neutral-300">
                        <span>🤝 Доверие</span>
                        <span className="text-emerald-400">{(activeChar.scales.trust !== undefined && !isNaN(activeChar.scales.trust)) ? activeChar.scales.trust : 50}%</span>
                      </div>
                      <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-850">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500" 
                          style={{ width: `${(activeChar.scales.trust !== undefined && !isNaN(activeChar.scales.trust)) ? activeChar.scales.trust : 50}%` }}
                        />
                      </div>
                    </div>
                    {/* Love */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-neutral-300">
                        <span>❤️ Любовь</span>
                        <span className="text-rose-400">{(activeChar.scales.love !== undefined && !isNaN(activeChar.scales.love)) ? activeChar.scales.love : 0}%</span>
                      </div>
                      <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-850">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-500" 
                          style={{ width: `${(activeChar.scales.love !== undefined && !isNaN(activeChar.scales.love)) ? activeChar.scales.love : 0}%` }}
                        />
                      </div>
                    </div>
                    {/* Lust */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-neutral-300">
                        <span>🔥 Вожделение</span>
                        <span className="text-purple-400">{(activeChar.scales.lust !== undefined && !isNaN(activeChar.scales.lust)) ? activeChar.scales.lust : 0}%</span>
                      </div>
                      <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-850">
                        <div 
                          className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-400 transition-all duration-500" 
                          style={{ width: `${(activeChar.scales.lust !== undefined && !isNaN(activeChar.scales.lust)) ? activeChar.scales.lust : 0}%` }}
                        />
                      </div>
                    </div>
                    {/* Anger */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-neutral-300">
                        <span>⚡ Гнев</span>
                        <span className="text-red-400">{(activeChar.scales.anger !== undefined && !isNaN(activeChar.scales.anger)) ? activeChar.scales.anger : 0}%</span>
                      </div>
                      <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-850">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500" 
                          style={{ width: `${(activeChar.scales.anger !== undefined && !isNaN(activeChar.scales.anger)) ? activeChar.scales.anger : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fetishes and inclinations traits */}
              {((activeChar.fetishes && activeChar.fetishes.length > 0) || (activeChar.inclinations && activeChar.inclinations.length > 0)) && (
                <div className="pt-4 border-t border-neutral-800 space-y-3">
                  {activeChar.fetishes && activeChar.fetishes.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                        🍓 Любимые темы / Фетиши:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeChar.fetishes.map((f, i) => (
                          <span key={i} className="text-[10px] bg-rose-500/10 text-rose-300 px-2.5 py-1 rounded-xl border border-rose-500/20 font-semibold">
                            💋 {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeChar.inclinations && activeChar.inclinations.length > 0 && (
                    <div className="space-y-1.5 mt-3">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                        🧠 Склонности и потаенное:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeChar.inclinations.map((inc, i) => (
                          <span key={i} className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded-xl border border-indigo-500/20 font-semibold">
                            ✨ {inc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 21+ Anatomy Parameter */}
              {(activeChar.penisSize !== undefined || activeChar.ballFullness !== undefined) && (
                <div className="pt-4 border-t border-neutral-800 space-y-3">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block flex items-center gap-1">
                    🍒 Интимные параметры (21+):
                  </span>

                  {/* Penis size */}
                  {activeChar.penisSize !== undefined && (
                    <div className="bg-neutral-950/40 border border-neutral-850 p-3.5 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">Размер полового члена</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                          {activeChar.penisSizeDiscovered || (activeChar.scales?.intimacy !== undefined && activeChar.scales.intimacy >= 65)
                            ? `Уровень близости позволяет знать размер (${getPenisSizeGradation(activeChar.penisSize)}).`
                            : "Скрыто. Достигните уровня Близости ≥ 65%."}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {activeChar.penisSizeDiscovered || (activeChar.scales?.intimacy !== undefined && activeChar.scales.intimacy >= 65) ? (
                          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 font-extrabold px-3.5 py-1.5 rounded-lg text-sm tracking-wide">
                            🍆 {activeChar.penisSize} см
                          </div>
                        ) : (
                          <div className="bg-neutral-900 border border-neutral-800 text-neutral-500 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 select-none">
                            🔒 Скрыто
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ball fullness */}
                  {activeChar.ballFullness !== undefined && (
                    <div className="bg-neutral-950/40 border border-neutral-850 p-3.5 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">Наполненность яиц (Шкала набухания)</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                            Сперма накапливается сама. Рост повышает пошлость и желание выпросить фото.
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="bg-rose-500/10 border border-rose-500/30 text-rose-300 font-extrabold px-3.5 py-1.5 rounded-lg text-xs tracking-wide">
                            🥚 {getBallFullnessText(activeChar.ballFullness)} ({activeChar.ballFullness}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-850">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-600 to-rose-400 transition-all duration-500" 
                          style={{ width: `${activeChar.ballFullness}%` }}
                        />
                      </div>

                      {/* Intermediate Swelling Stages Legend */}
                      <div className="mt-3 pt-2.5 border-t border-neutral-800/60 space-y-1.5 text-left">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">
                          📈 ЭТАПЫ И ПРОМЕЖУТОЧНЫЕ НАЗВАНИЯ НАБУХАНИЯ:
                        </span>
                        <div className="grid grid-cols-1 gap-1 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                          {[
                            { min: 0, max: 10, label: "Опустошены (Полная разрядка) 💦" },
                            { min: 11, max: 25, label: "Легкая тяжесть (Начало накопления) 🥚" },
                            { min: 26, max: 40, label: "Слегка наполнены (Легкий зуд) ⚡" },
                            { min: 41, max: 55, label: "Умеренно наполнены (Соблазн) 😏" },
                            { min: 56, max: 70, label: "Наполнены (Сильное вожделение) 🔥" },
                            { min: 71, max: 85, label: "Набухли (Готовы взорваться) 🍒" },
                            { min: 86, max: 95, label: "Разрываются! (Дикое желание) 🍌" },
                            { min: 96, max: 100, label: "Спермотоксикоз! (Срочный выпуск) 🌋" },
                          ].map((stage, idx) => {
                            const isActive = activeChar.ballFullness! >= stage.min && activeChar.ballFullness! <= stage.max;
                            return (
                              <div 
                                key={idx} 
                                className={`flex justify-between items-center px-2 py-1 rounded-lg text-[10px] transition-all border ${
                                  isActive 
                                    ? "bg-rose-500/10 text-rose-300 font-bold border-rose-500/25 shadow-sm shadow-rose-950/20" 
                                    : "text-neutral-500 border-transparent hover:text-neutral-400"
                                }`}
                              >
                                <span>{stage.label}</span>
                                <span className="font-mono text-[9px] text-right shrink-0 ml-2">{stage.min}-{stage.max}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ejaculation Counters (Semen volumes) */}
                  {(activeChar.ejaculatedOnPhoto !== undefined || activeChar.ejaculatedInside !== undefined) && (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-neutral-950/40 border border-neutral-850 p-3 rounded-xl flex flex-col justify-between">
                          <div>
                            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wide">Спущено на фото</p>
                            <p className="text-[10px] text-neutral-500 mt-0.5 leading-relaxed">Возбуждаясь на ваши горячие снимки</p>
                          </div>
                          <div className="mt-2 text-left">
                            <span className="bg-pink-500/10 border border-pink-500/30 text-pink-300 font-extrabold px-2.5 py-1 rounded-lg text-xs tracking-wide inline-block font-mono">
                              💦 {activeChar.ejaculatedOnPhoto || 0} мл
                            </span>
                          </div>
                        </div>

                        <div className="bg-neutral-950/40 border border-neutral-850 p-3 rounded-xl flex flex-col justify-between">
                          <div>
                            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wide">Залито внутрь ГГ</p>
                            <p className="text-[10px] text-neutral-500 mt-0.5 leading-relaxed">Количество семени при оргазмах внутри вас</p>
                          </div>
                          <div className="mt-2 text-left">
                            <span className="bg-rose-500/10 border border-rose-500/30 text-rose-300 font-extrabold px-2.5 py-1 rounded-lg text-xs tracking-wide inline-block font-mono">
                              🌋 {activeChar.ejaculatedInside || 0} мл
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sex Count and Split Locations */}
                      <div className="bg-neutral-950/40 border border-neutral-850 p-3 rounded-xl space-y-2.5">
                        <div className="flex justify-between items-center border-b border-neutral-800/60 pb-2">
                          <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wide">Наполнение по местам</span>
                          <span className="bg-rose-500/10 border border-rose-500/20 text-rose-300 font-extrabold px-2 py-0.5 rounded text-[10px] tracking-wide font-mono">
                            👉 Секс: {activeChar.sexCount || 0} раз
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="bg-neutral-900/40 p-2 rounded-lg border border-neutral-800/40">
                            <p className="text-[8px] text-neutral-400 uppercase font-extrabold tracking-wide">🌷 Вагина</p>
                            <p className="text-xs font-black text-rose-300 mt-1 font-mono">{activeChar.ejaculatedVagina || 0} мл</p>
                          </div>
                          <div className="bg-neutral-900/40 p-2 rounded-lg border border-neutral-800/40">
                            <p className="text-[8px] text-neutral-400 uppercase font-extrabold tracking-wide">🍩 Анус</p>
                            <p className="text-xs font-black text-rose-300 mt-1 font-mono">{activeChar.ejaculatedAnus || 0} мл</p>
                          </div>
                          <div className="bg-neutral-900/40 p-2 rounded-lg border border-neutral-800/40">
                            <p className="text-[8px] text-neutral-400 uppercase font-extrabold tracking-wide">👄 Рот</p>
                            <p className="text-xs font-black text-rose-300 mt-1 font-mono">{activeChar.ejaculatedMouth || 0} мл</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Known rumors/gossip */}
              {visibleFacts.length > 0 && (
                <div className="pt-4 border-t border-neutral-800 space-y-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    📢 Известные слухи ({visibleFacts.length}):
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                    {visibleFacts.map((fact) => (
                      <div key={fact.id} className="bg-neutral-950/40 border border-neutral-850 p-2 rounded-lg text-[11px] text-neutral-300">
                        {fact.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
