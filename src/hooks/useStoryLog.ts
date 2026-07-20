import { useState, useEffect } from "react";
import { SharedFact, StoryLog, UserProfile, Character, Message, GroupChat } from "../types";
import { safeSetLocalStorage, GOSSIP_CONNECTIONS } from "../utils/helpers";
import { api } from "../api/client";

export function useStoryLog(
  userProfile: UserProfile | null,
  setGossipNotification: (text: string | null) => void
) {
  const [sharedFacts, setSharedFacts] = useState<SharedFact[]>(() => {
    const saved = localStorage.getItem("roleplay_shared_facts_v2");
    return saved ? JSON.parse(saved) : [];
  });

  const [rumorLogs, setRumorLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("roleplay_rumor_logs_v2");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [storyLog, setStoryLog] = useState<StoryLog | null>(() => {
    const saved = localStorage.getItem("roleplay_story_log_v2");
    return saved ? JSON.parse(saved) : null;
  });

  const [isStoryLoading, setIsStoryLoading] = useState(false);

  useEffect(() => {
    safeSetLocalStorage("roleplay_shared_facts_v2", JSON.stringify(sharedFacts));
  }, [sharedFacts]);

  useEffect(() => {
    safeSetLocalStorage("roleplay_story_log_v2", storyLog ? JSON.stringify(storyLog) : "");
  }, [storyLog]);

  const propagateRumors = (facts: SharedFact[], charactersList: Character[]): SharedFact[] => {
    const newLogs: any[] = [];
    
    const updatedFacts = facts.map(fact => {
      const currentKnown = fact.knownBy ? [...fact.knownBy] : [];
      if (fact.sourceCharacterId && fact.sourceCharacterId !== "storyteller" && fact.sourceCharacterId !== "user" && !currentKnown.includes(fact.sourceCharacterId)) {
        currentKnown.push(fact.sourceCharacterId);
      }
      const knownBy = Array.from(new Set(currentKnown)).filter(id => id && id !== "storyteller" && id !== "user");

      let changed = true;
      let round = 0;
      while (changed && round < 1) {
        changed = false;
        
        charactersList.forEach(char => {
          if (knownBy.includes(char.id)) return;

          const knowers = charactersList.filter(c => knownBy.includes(c.id) && c.id !== char.id);
          
          for (const knower of knowers) {
            const connFromHearer = (GOSSIP_CONNECTIONS[char.id] || []).find(c => c.targetId === knower.id);
            const connFromKnower = (GOSSIP_CONNECTIONS[knower.id] || []).find(c => c.targetId === char.id);

            if (connFromHearer || connFromKnower) {
              const baseChance = connFromKnower?.baseChance || connFromHearer?.baseChance || 0.01;
              let chance = baseChance;

              if (knower.id === "masha" || knower.id === "semenych") chance += 0.005;
              if (char.id === "masha" || char.id === "semenych") chance += 0.005;

              const lust = knower.scales?.lust || 50;
              if (lust > 80) chance += 0.005;

              chance = chance * 0.01;

              if (Math.random() < chance) {
                knownBy.push(char.id);
                newLogs.push({
                  id: `gossip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  factText: fact.text,
                  fromName: knower.name,
                  toName: char.name
                });
                changed = true;
                break;
              }
            }
          }
        });
        round++;
      }

      return {
        ...fact,
        knownBy
      };
    });

    if (newLogs.length > 0) {
      setTimeout(() => {
        setRumorLogs(prev => {
          const updated = [...newLogs, ...prev].slice(0, 100);
          safeSetLocalStorage("roleplay_rumor_logs_v2", JSON.stringify(updated));
          return updated;
        });
      }, 50);
    }

    return updatedFacts;
  };

  const handleUpdateStoryLog = async (
    directive: string,
    aiMode: string,
    messages: Record<string, Message[]>,
    characters: Character[],
    groupChats: GroupChat[]
  ) => {
    setIsStoryLoading(true);

    try {
      let summaryText = "";
      Object.entries(messages).forEach(([chatId, list]) => {
        const char = characters.find(c => c.id === chatId);
        const group = groupChats.find(g => g.id === chatId);
        const name = char ? char.name : (group ? `Группа "${group.name}"` : "Неизвестно");
        
        if (list && list.length > 0) {
          const lastFew = list.slice(-3);
          summaryText += `\n- Чат с ${name}:\n`;
          lastFew.forEach(m => {
            const who = m.role === "user" ? "Вы" : (char ? char.name : "Персонаж");
            summaryText += `  [${m.timestamp}] ${who}: ${m.content}\n`;
          });
        }
      });

      const data = await api.generateStory({
        userProfile,
        sharedFacts,
        messagesSummary: summaryText || "Диалоги пока пусты. Сюжет на этапе знакомства.",
        customDirective: directive,
        aiMode
      });

      const updatedLog: StoryLog = {
        storySummary: data.storySummary,
        keyChapters: data.keyChapters,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + new Date().toLocaleDateString()
      };

      setStoryLog(updatedLog);

      if (data.newSharedFacts && Array.isArray(data.newSharedFacts) && data.newSharedFacts.length > 0) {
        const addedFacts: SharedFact[] = [];
        data.newSharedFacts.forEach((factText: string) => {
          if (!sharedFacts.some(f => f.text.toLowerCase().trim() === factText.toLowerCase().trim())) {
            addedFacts.push({
              id: `storyteller-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              text: factText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sourceCharacterId: "storyteller",
              group: "Все"
            });
          }
        });

        if (addedFacts.length > 0) {
          setSharedFacts(prev => [...addedFacts, ...prev]);
        }
      }

      setGossipNotification(directive ? "🎭 Воля Рассказчика воплощена в реальность!" : "🎭 Рассказчик обновил хронологию сюжета!");
      setTimeout(() => setGossipNotification(null), 3000);

    } catch (e) {
      console.log("Storyteller communication handled.", e);
      setGossipNotification("⚠️ Не удалось связаться с Рассказчиком. Попробуйте еще раз.");
      setTimeout(() => setGossipNotification(null), 4000);
    } finally {
      setIsStoryLoading(false);
    }
  };

  return {
    sharedFacts,
    setSharedFacts,
    rumorLogs,
    setRumorLogs,
    storyLog,
    setStoryLog,
    isStoryLoading,
    setIsStoryLoading,
    propagateRumors,
    handleUpdateStoryLog
  };
}
