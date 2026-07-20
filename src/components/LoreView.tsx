import React, { memo } from "react";
import { Radio, Plus, Trash2 } from "lucide-react";
import { SharedFact, Character } from "../types";

const getStatusColorClass = (status?: string): string => {
  if (status === "В сети") return "bg-emerald-500";
  if (status === "Занят") return "bg-amber-500";
  if (status === "Играет") return "bg-purple-500";
  if (status === "Печатает...") return "bg-cyan-500 animate-pulse";
  return "bg-neutral-500";
};

export interface LoreViewProps {
  characters: Character[];
  sharedFacts: SharedFact[];
  setSharedFacts: React.Dispatch<React.SetStateAction<SharedFact[]>>;
  rumorLogs: any[];
  setRumorLogs: React.Dispatch<React.SetStateAction<any[]>>;
  setGossipNotification: (val: string | null) => void;
  propagateRumors: (facts: SharedFact[], charactersList: Character[]) => SharedFact[];
  gossipConnections: Record<string, { targetId: string; baseChance: number }[]>;
}

export const LoreView = memo(function LoreView({
  characters,
  sharedFacts,
  setSharedFacts,
  rumorLogs,
  setRumorLogs,
  setGossipNotification,
  propagateRumors,
  gossipConnections,
}: LoreViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="flex items-center gap-2 text-amber-400">
          <Radio className="w-5 h-5 animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-xs">Индивидуальная сеть сплетен</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-50 text-left">Сарафанное радио (Gossip Network)</h2>
        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed text-left">
          Каждая тайна или факт, упомянутый в переписке, автоматически записывается в память игры и начинает распространяться по индивидуальным связям между персонажами с разной вероятностью на каждом ходу!
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Form & Gossip list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Custom Fact form */}
          <div className="bg-neutral-900 border border-neutral-800/80 p-5 rounded-2xl space-y-4 shadow-lg text-left">
            <h3 className="font-bold text-xs text-neutral-200 uppercase tracking-wider">Вбросить новую сплетню</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  id="manual-fact-input"
                  placeholder="Например: 'Героиня сегодня без трусиков в офисе'..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <select
                  id="manual-fact-group"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-100 focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="Все">📢 Сделать достоянием всех</option>
                  <option value="Семья">🏡 Доверить всей Семье</option>
                  <option value="Друзья">👥 Доверить всем Друзьям</option>
                  <option value="Работа">💼 Рассказать всем Коллегам</option>
                  {characters.map(c => (
                    <option key={c.id} value={`char:${c.id}`}>
                      👤 Шепнуть лично: {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const txt = (document.getElementById("manual-fact-input") as HTMLInputElement)?.value;
                const grp = (document.getElementById("manual-fact-group") as HTMLSelectElement)?.value as any;
                if (!txt || !txt.trim()) return;

                let initialKnownBy: string[] = [];
                let factGroup = grp;

                if (grp === "Все") {
                  initialKnownBy = characters.map(c => c.id);
                } else if (grp === "Семья") {
                  initialKnownBy = characters.filter(c => c.group === "Семья").map(c => c.id);
                } else if (grp === "Друзья") {
                  initialKnownBy = characters.filter(c => c.group === "Друзья").map(c => c.id);
                } else if (grp === "Работа") {
                  initialKnownBy = characters.filter(c => c.group === "Работа").map(c => c.id);
                } else if (grp.startsWith("char:")) {
                  const targetCharId = grp.substring(5);
                  initialKnownBy = [targetCharId];
                  const targetChar = characters.find(c => c.id === targetCharId);
                  factGroup = targetChar ? targetChar.group : "Личное";
                } else {
                  initialKnownBy = ["user"];
                }

                const fact: SharedFact = {
                  id: `manual-${Date.now()}`,
                  text: txt.trim(),
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  sourceCharacterId: "user",
                  group: factGroup,
                  knownBy: initialKnownBy
                };

                setSharedFacts(prev => {
                  const updated = [fact, ...prev];
                  return propagateRumors(updated, characters);
                });

                const inputEl = document.getElementById("manual-fact-input") as HTMLInputElement;
                if (inputEl) inputEl.value = "";

                let targetLabel = grp;
                if (grp.startsWith("char:")) {
                  const targetCharId = grp.substring(5);
                  const targetChar = characters.find(c => c.id === targetCharId);
                  targetLabel = targetChar ? `лично ${targetChar.name}` : "персонажу";
                } else if (grp === "Все") {
                  targetLabel = "всех персонажей";
                } else {
                  targetLabel = `группы "${grp}"`;
                }

                setGossipNotification(`🤫 Сплетня доверена ${targetLabel}: "${txt}"`);
                setTimeout(() => setGossipNotification(null), 3500);
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Запустить по сарафанному радио</span>
            </button>
          </div>

          {/* Facts List */}
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400">Активные слухи в памяти мира ({sharedFacts.length})</h3>
              {sharedFacts.length > 0 && (
                <button
                  onClick={() => {
                    setSharedFacts([]);
                    setRumorLogs([]);
                    localStorage.removeItem("roleplay_rumor_logs_v2");
                    localStorage.removeItem("roleplay_shared_facts_v2");
                  }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Стереть память сплетен
                </button>
              )}
            </div>

            {sharedFacts.length === 0 ? (
              <div className="bg-neutral-900/30 border border-neutral-800/60 p-8 rounded-2xl text-center text-neutral-500 text-sm leading-relaxed">
                Память пуста. Расскажите секреты персонажам в диалогах, или сделайте вброс выше, чтобы запустить слухи!
              </div>
            ) : (
              <div className="space-y-3">
                {sharedFacts.map((fact) => {
                  const sourceChar = characters.find(c => c.id === fact.sourceCharacterId);
                  const knownIds = fact.knownBy || [];
                  const knowersList = characters.filter(c => knownIds.includes(c.id));

                  return (
                    <div
                      key={fact.id}
                      className="bg-neutral-900 border border-neutral-800/70 p-4 rounded-xl space-y-3 hover:border-neutral-700 transition-all text-xs"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="text-xs sm:text-xs font-semibold text-neutral-100 break-words">
                            🤫 "{fact.text}"
                          </p>
                          <div className="flex items-center gap-2 text-[9px] text-neutral-500 font-bold">
                            <span>ТИП: {fact.group === "Все" ? "Публичный" : "Локальный"}</span>
                            <span>•</span>
                            <span>ИСТОЧНИК: {sourceChar ? sourceChar.name : "Главный Герой"}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSharedFacts(prev => prev.filter(f => f.id !== fact.id))}
                          className="p-1.5 hover:bg-neutral-800 text-neutral-500 hover:text-red-400 rounded-lg transition-all"
                          title="Удалить слух"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Knowers badgeline */}
                      <div className="border-t border-neutral-950 pt-2.5 space-y-1.5">
                        <div className="text-[9px] text-neutral-500 font-extrabold uppercase">Кто об этом знает:</div>
                        <div className="flex flex-wrap gap-1">
                          {fact.group === "Все" ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                              📢 Известно абсолютно всем
                            </span>
                          ) : knowersList.length === 0 ? (
                            <span className="text-[10px] text-neutral-600 italic">Пока никто не узнал по связям</span>
                          ) : (
                            knowersList.map(kn => (
                              <span
                                key={kn.id}
                                className="px-2.5 py-0.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-[10px] font-semibold flex items-center gap-1"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusColorClass(kn.status)}`}></span>
                                {kn.name}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline Gossip Log & Connection Map */}
        <div className="space-y-6 text-left">
          {/* Timeline Feed */}
          <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-4 space-y-4 shadow-lg flex flex-col max-h-[350px]">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-xs text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                Лента утечек и слухов
              </h3>
              {rumorLogs.length > 0 && (
                <button
                  onClick={() => {
                    setRumorLogs([]);
                    localStorage.removeItem("roleplay_rumor_logs_v2");
                  }}
                  className="text-[10px] text-neutral-500 hover:text-neutral-300 cursor-pointer font-bold"
                >
                  Очистить
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {rumorLogs.length === 0 ? (
                <div className="py-12 text-center text-neutral-600 text-[11px] italic">
                  Событий пока не зафиксировано. По мере развития переписок слухи начнут передаваться!
                </div>
              ) : (
                rumorLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-neutral-950 border border-neutral-900 rounded-xl text-[11px] leading-relaxed relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-[9px] text-neutral-500 font-bold mb-1">
                      <span>💬 {log.timestamp}</span>
                      <span className="text-amber-500 font-extrabold">ПЕРЕДАЧА 🤫</span>
                    </div>
                    <p className="text-neutral-200">
                      <strong className="text-amber-400">{log.fromName}</strong> рассказал <strong className="text-indigo-400">{log.toName}</strong>:
                    </p>
                    <p className="text-[10px] text-neutral-400 italic mt-0.5 break-words">
                      "{log.factText}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Connections List */}
          <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-4 space-y-3 shadow-lg max-h-[380px] flex flex-col">
            <h3 className="font-extrabold text-xs text-neutral-200 uppercase tracking-wider shrink-0">
              🔗 Каналы связи и вероятность утечек
            </h3>
            <p className="text-[10px] text-neutral-500 leading-relaxed shrink-0">
              Шанс передачи слуха между персонажами за один шаг времени (Маша и Семеныч имеют +15% бонус сплетника):
            </p>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3.5 pr-1 text-xs">
              {Object.entries(gossipConnections).map(([speakerId, targets]) => {
                const speaker = characters.find(c => c.id === speakerId);
                if (!speaker) return null;
                return (
                  <div key={speakerId} className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusColorClass(speaker.status)}`}></span>
                      <span>{speaker.name}</span>
                      {(speaker.id === "masha" || speaker.id === "semenych") && (
                        <span className="text-[8px] bg-red-600/15 text-red-400 border border-red-500/25 px-1 py-0.2 rounded font-black">
                          📢 СПЛЕТНИК
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-1 pl-3 text-[10px] text-neutral-400">
                      {(targets as { targetId: string; baseChance: number }[]).map(tg => {
                        const targetChar = characters.find(c => c.id === tg.targetId);
                        if (!targetChar) return null;
                        return (
                          <div key={tg.targetId} className="flex items-center justify-between py-0.5 border-b border-neutral-950">
                            <span>👉 рассказывает {targetChar.name}:</span>
                            <span className="font-mono font-bold text-amber-500">{(tg.baseChance * 100).toFixed(0)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
});
