import { useState, useEffect, FormEvent } from "react";
import { Character, UserProfile } from "../types";
import { CHARACTERS } from "../characters";
import { safeSetLocalStorage } from "../utils/helpers";

export function useCharacters(
  userProfile: UserProfile | null,
  setGossipNotification: (text: string | null) => void,
  onDeleteCharacter: (charId: string) => void
) {
  const [characters, setCharacters] = useState<Character[]>(() => {
    const profileSaved = localStorage.getItem("roleplay_user_profile_v2");
    const profileObj = profileSaved ? JSON.parse(profileSaved) : null;
    const hasPhoto = !!profileObj?.photo;

    const adjustLustForNoPhoto = (chars: Character[]) => {
      if (!hasPhoto) {
        const attr = profileObj?.attractiveness ?? 80;
        return chars.map(c => {
          const isRelative = ["mother", "father", "brother", "grandfather"].includes(c.id);
          if (isRelative) {
            return {
              ...c,
              scales: c.scales ? { ...c.scales, lust: 0 } : { trust: 50, love: 0, lust: 0, anger: 0 }
            };
          }
          let baseLust = 0;
          if (c.id === "max") baseLust = Math.round(attr * 0.95);
          else if (c.id === "artem") baseLust = Math.round(attr * 0.8);
          else if (c.id === "masha") baseLust = Math.round(attr * 0.4);
          else if (c.id === "colleague") baseLust = Math.round(attr * 0.85);
          else if (c.id === "neighbor") baseLust = Math.round(attr * 0.25);
          else if (c.id === "semenych") baseLust = Math.round(attr * 0.15);
          else if (c.id === "mihalych") baseLust = Math.round(attr * 0.05);

          return {
            ...c,
            scales: c.scales ? { ...c.scales, lust: baseLust } : { trust: 50, love: 0, lust: baseLust, anger: 0 }
          };
        });
      }
      return chars;
    };

    const saved = localStorage.getItem("roleplay_characters_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Character[];
        const defaultIds = CHARACTERS.map(c => c.id);
        const parsedIds = parsed.map(c => c.id);
        const missingDefaults = CHARACTERS.filter(c => !parsedIds.includes(c.id));
        const updatedParsed = parsed.map(c => {
          const matchedDefault = CHARACTERS.find(dc => dc.id === c.id);
          const baseChar = matchedDefault ? { ...matchedDefault, ...c } : c;
          return {
            ...baseChar,
            sexCount: baseChar.sexCount ?? 0,
            ejaculatedVagina: baseChar.ejaculatedVagina ?? 0,
            ejaculatedAnus: baseChar.ejaculatedAnus ?? 0,
            ejaculatedMouth: baseChar.ejaculatedMouth ?? 0,
          };
        });

        const merged = missingDefaults.length > 0 ? [...missingDefaults, ...updatedParsed] : updatedParsed;
        const adjusted = adjustLustForNoPhoto(merged).map(c => ({
          ...c,
          sexCount: c.sexCount ?? 0,
          ejaculatedVagina: c.ejaculatedVagina ?? 0,
          ejaculatedAnus: c.ejaculatedAnus ?? 0,
          ejaculatedMouth: c.ejaculatedMouth ?? 0,
        }));
        safeSetLocalStorage("roleplay_characters_v2", JSON.stringify(adjusted));
        return adjusted;
      } catch (e) {
        return adjustLustForNoPhoto(CHARACTERS).map(c => ({
          ...c,
          sexCount: c.sexCount ?? 0,
          ejaculatedVagina: c.ejaculatedVagina ?? 0,
          ejaculatedAnus: c.ejaculatedAnus ?? 0,
          ejaculatedMouth: c.ejaculatedMouth ?? 0,
        }));
      }
    }
    return adjustLustForNoPhoto(CHARACTERS).map(c => ({
      ...c,
      sexCount: c.sexCount ?? 0,
      ejaculatedVagina: c.ejaculatedVagina ?? 0,
      ejaculatedAnus: c.ejaculatedAnus ?? 0,
      ejaculatedMouth: c.ejaculatedMouth ?? 0,
    }));
  });

  const [showCharModal, setShowCharModal] = useState(false);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [charName, setCharName] = useState("");
  const [charRole, setCharRole] = useState("");
  const [charGroup, setCharGroup] = useState<"Друзья" | "Семья" | "Работа" | "Соседи">("Друзья");
  const [charPersonality, setCharPersonality] = useState("");
  const [charSpeech, setCharSpeech] = useState("");
  const [charAttitude, setCharAttitude] = useState("");
  const [charGreeting, setCharGreeting] = useState("");
  
  const [charTrust, setCharTrust] = useState(50);
  const [charLove, setCharLove] = useState(0);
  const [charLust, setCharLust] = useState(0);
  const [charAnger, setCharAnger] = useState(0);
  const [charFetishes, setCharFetishes] = useState("");
  const [charInclinations, setCharInclinations] = useState("");
  const [charIdToDelete, setCharIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    safeSetLocalStorage("roleplay_characters_v2", JSON.stringify(characters));
  }, [characters]);

  const handleDeleteCharacter = (charId: string) => {
    setCharIdToDelete(charId);
  };

  const executeDeleteCharacter = (charId: string) => {
    const updatedChars = characters.filter(c => c.id !== charId);
    setCharacters(updatedChars);
    
    // Call parent handler to clear messages/groups
    onDeleteCharacter(charId);

    setShowCharModal(false);
    setEditingCharId(null);
    setCharIdToDelete(null);
    setGossipNotification("🗑️ Персонаж успешно удален.");
    setTimeout(() => setGossipNotification(null), 3000);
  };

  const openCharacterModal = (charId: string | null) => {
    if (charId) {
      const char = characters.find(c => c.id === charId);
      if (char) {
        setEditingCharId(charId);
        setCharName(char.name);
        setCharRole(char.role);
        setCharGroup(char.group as any);
        setCharPersonality(char.personality);
        setCharSpeech(char.speechStyle);
        setCharAttitude(char.attitude);
        setCharGreeting(char.initialMessage);
        
        setCharTrust(char.scales?.trust ?? 50);
        setCharLove(char.scales?.love ?? 0);
        setCharLust(char.scales?.lust ?? 0);
        setCharAnger(char.scales?.anger ?? 0);
        setCharFetishes(char.fetishes ? char.fetishes.join(", ") : "");
        setCharInclinations(char.inclinations ? char.inclinations.join(", ") : "");
        
        setShowCharModal(true);
      }
    } else {
      setEditingCharId(null);
      setCharName("");
      setCharRole("");
      setCharGroup("Друзья");
      setCharPersonality("");
      setCharSpeech("");
      setCharAttitude("");
      setCharGreeting("");
      
      setCharTrust(50);
      setCharLove(0);
      setCharLust(0);
      setCharAnger(0);
      setCharFetishes("");
      setCharInclinations("");
      
      setShowCharModal(true);
    }
  };

  const handleSaveCharacter = (e: FormEvent, onCreatedCallback?: (id: string) => void) => {
    e.preventDefault();
    if (!charName.trim() || !charRole.trim() || !charPersonality.trim()) {
      setGossipNotification("⚠️ Ошибка: Заполните все обязательные поля характера!");
      setTimeout(() => setGossipNotification(null), 4000);
      return;
    }

    const parseCommaSeparated = (val: string) => {
      return val.split(",")
        .map(item => item.trim())
        .filter(item => item.length > 0);
    };

    const newScales = {
      trust: charTrust,
      love: charLove,
      lust: charLust,
      anger: charAnger
    };
    const newFetishes = parseCommaSeparated(charFetishes);
    const newInclinations = parseCommaSeparated(charInclinations);

    if (editingCharId) {
      setCharacters(prev => prev.map(c => {
        if (c.id === editingCharId) {
          return {
            ...c,
            name: charName.trim(),
            role: charRole.trim(),
            group: charGroup,
            personality: charPersonality.trim(),
            speechStyle: charSpeech.trim() || c.speechStyle,
            attitude: charAttitude.trim() || c.attitude,
            initialMessage: charGreeting.trim() || c.initialMessage,
            scales: newScales,
            fetishes: newFetishes,
            inclinations: newInclinations
          };
        }
        return c;
      }));
      setGossipNotification(`✍️ Настройки персонажа "${charName}" обновлены.`);
    } else {
      const newId = `custom-${Date.now()}`;
      const newChar: Character = {
        id: newId,
        name: charName.trim(),
        role: charRole.trim(),
        status: "В сети",
        avatarColor: ["from-pink-400 to-rose-600", "from-blue-400 to-indigo-600", "from-yellow-500 to-amber-700", "from-purple-400 to-fuchsia-600", "from-emerald-400 to-teal-700"][Math.floor(Math.random() * 5)],
        group: charGroup,
        personality: charPersonality.trim(),
        speechStyle: charSpeech.trim() || "Обычный разговорный живой язык мессенджеров.",
        attitude: charAttitude.trim() || "Нейтрально-любопытное.",
        initialMessage: charGreeting.trim() || "Привет! Рад(а) знакомству.",
        suggestedGreetings: [
          `Привет! Давно не виделись. Как дела?`,
          `Привет, ${charName}! Давай поболтаем?`
        ],
        scales: newScales,
        fetishes: newFetishes,
        inclinations: newInclinations
      };
      setCharacters(prev => [...prev, newChar]);
      if (onCreatedCallback) {
        onCreatedCallback(newId);
      }
      setGossipNotification(`✨ Создан новый персонаж "${charName}"!`);
    }

    setShowCharModal(false);
    setEditingCharId(null);
    setTimeout(() => setGossipNotification(null), 3500);
  };

  return {
    characters,
    setCharacters,
    showCharModal,
    setShowCharModal,
    editingCharId,
    setEditingCharId,
    charName,
    setCharName,
    charRole,
    setCharRole,
    charGroup,
    setCharGroup,
    charPersonality,
    setCharPersonality,
    charSpeech,
    setCharSpeech,
    charAttitude,
    setCharAttitude,
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
    charFetishes,
    setCharFetishes,
    charInclinations,
    setCharInclinations,
    charIdToDelete,
    setCharIdToDelete,
    handleDeleteCharacter,
    executeDeleteCharacter,
    openCharacterModal,
    handleSaveCharacter
  };
}
