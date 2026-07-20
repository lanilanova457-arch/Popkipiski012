import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Users,
  Radio,
  BookOpen,
  Mic,
  Send,
  Image as ImageIcon,
  Trash2,
  Plus,
  X,
  ChevronRight,
  Sparkles,
  Info,
  Settings,
  User,
  RefreshCw,
  Phone,
  PhoneOff,
  PenSquare,
  Smile,
  Heart,
  Brain,
  Camera,
  Upload,
  AlertTriangle,
  Flame,
  Compass
} from "lucide-react";
import { Message, Character, SharedFact, UserProfile, GroupChat, StoryLog, CallState } from "./types";
import { CHARACTERS } from "./characters";
import { CityMap } from "./components/CityMap";

// Custom hooks
import { usePersistentStore } from "./hooks/usePersistentStore";
import { clearDb } from "./utils/db";

// Extracted Modals
import { ThoughtsModal } from "./components/ThoughtsModal";
import { CharacteristicsModal } from "./components/CharacteristicsModal";
import { CreateGroupModal } from "./components/CreateGroupModal";
import { AddCharacterModal } from "./components/AddCharacterModal";
import { UserProfileEditor } from "./components/UserProfileEditor";
import { LiveVoiceCall } from "./components/LiveVoiceCall";
import { CharacterItem } from "./components/CharacterItem";
import { MessageItem } from "./components/MessageItem";

const getPenisSizeGradation = (size: number): string => {
  if (size <= 11) return "стыдно показать";
  if (size <= 14) return "не впечатляющий";
  if (size <= 17) return "средний / стандарт";
  if (size <= 21) return "впечатляющий";
  return "член мечты!";
};

const getBallFullnessText = (fullness: number): string => {
  if (fullness <= 10) return "Опустошены (Полная разрядка)";
  if (fullness <= 25) return "Легкая тяжесть (Начало накопления)";
  if (fullness <= 40) return "Слегка наполнены (Легкий зуд)";
  if (fullness <= 55) return "Умеренно наполнены (Соблазн)";
  if (fullness <= 70) return "Наполнены (Сильное вожделение)";
  if (fullness <= 85) return "Набухли (Готовы взорваться)";
  if (fullness <= 95) return "Разрываются! (Дикое желание)";
  return "Спермотоксикоз! (Срочный выпуск пара)";
};

const getPartRatingText = (score: number): string => {
  if (score <= 15) return "Уродливо 🤢";
  if (score <= 35) return "Ниже среднего 😕";
  if (score <= 55) return "Обычное / Нормальное 🙂";
  if (score <= 75) return "Очень привлекательное 😊";
  if (score <= 85) return "Сексуально и сочно 🍓";
  if (score <= 95) return "Невероятно горячо 🔥";
  return "Божественно / Идеал мечты 👑";
};

// Helper to compress base64 images (scales down to max 800px width/height and quality 0.7) to prevent exceeding localStorage quota
const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith("data:image/")) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedBase64);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

const safeSetLocalStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    if (e.name === "QuotaExceededError" || e.code === 22) {
      console.warn("Storage quota exceeded, could not save item: " + key);
    } else {
      console.error("Local storage error: ", e);
    }
  }
};

export default function App() {
  // --- Persistent States from Unified Store ---
  const {
    userProfile, setUserProfile,
    characters, setCharacters,
    groupChats, setGroupChats,
    selectedChatId, setSelectedChatId,
    messages, setMessages,
    aiMode, setAiMode,
    currentLocation, setCurrentLocation,
    gameClock, setGameClock,
    maxSuspicion, setMaxSuspicion,
    sharedFacts, setSharedFacts,
    storyLog, setStoryLog,
    chatModes, setChatModes,
    rumorLogs, setRumorLogs,
    resetStore
  } = usePersistentStore();

  // --- UI/UX Interactive States ---
  const [activeTab, setActiveTab] = useState<"chat" | "map" | "lore" | "story" | "profile">("chat");
  const [inputText, setInputText] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [gossipNotification, setGossipNotification] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<Record<string, string[]>>({});
  const [systemError, setSystemError] = useState<string | null>(null);
  const [systemStatusMessage, setSystemStatusMessage] = useState<string>("Все системы работают стабильно");
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  const [customDirectiveText, setCustomDirectiveText] = useState("");
  const [showChatSwitcherModal, setShowChatSwitcherModal] = useState(false);
  const [sendAsNarrator, setSendAsNarrator] = useState(false);
  const [sendAsCharacter, setSendAsCharacter] = useState(false);

  const handleSwitchCommMode = (mode: "chat" | "call" | "live", chatId = selectedChatId) => {
    setChatModes(prev => ({ ...prev, [chatId]: mode }));
  };

  const handleCreateLiveMeetingEvent = () => {
    setSendAsNarrator(true);
    handleSwitchCommMode("live");
    setInputText("*Вы договорились о встрече. Теперь вы находитесь в [место встречи], встретились вживую и находитесь рядом друг с другом...*");
  };

  // User Profile edit mode
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showThoughtsModal, setShowThoughtsModal] = useState(false);
  const [showCharInfoModal, setShowCharInfoModal] = useState(false);
  const [profileFormError, setProfileFormError] = useState<string | null>(null);
  const [isEvaluatingPhoto, setIsEvaluatingPhoto] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [setupStage, setSetupStage] = useState(0);
  const [charThoughts, setCharThoughts] = useState<Record<string, { thoughts: string; motives: string; visualAttitude: string; nextActionPlan: string; }>>({});
  const [charThoughtsLoading, setCharThoughtsLoading] = useState<Record<string, boolean>>({});
  const [thoughtsError, setThoughtsError] = useState<string | null>(null);
  
  const [profileName, setProfileName] = useState(userProfile?.name || "");
  const [profileGender, setProfileGender] = useState<"Мужской" | "Женский" | "Другой">(userProfile?.gender || "Женский");
  const [profileAge, setProfileAge] = useState<number>(userProfile?.age || 23);
  const [profileBio, setProfileBio] = useState(userProfile?.bio || "");
  const [profileTraits, setProfileTraits] = useState(userProfile?.traits || "");
  const [profileAttractiveness, setProfileAttractiveness] = useState<number>(userProfile?.attractiveness ?? 80);

  // Physical appearance details states
  const [profileFace, setProfileFace] = useState(userProfile?.appearance?.face || "Привлекательное, чистое лицо");
  const [profileChest, setProfileChest] = useState(userProfile?.appearance?.chest || "Упругая, округлая грудь");
  const [profileWaist, setProfileWaist] = useState(userProfile?.appearance?.waist || "Тонкая талия, плоский живот");
  const [profileHips, setProfileHips] = useState(userProfile?.appearance?.hips || "Выразительные, округлые бёдра");
  const [profileIntimate, setProfileIntimate] = useState(userProfile?.appearance?.intimate || "Аккуратные, ухоженные интимные зоны");
  const [profileLegs, setProfileLegs] = useState(userProfile?.appearance?.legs || "Стройные, длинные ноги");
  const [profileOverall, setProfileOverall] = useState(userProfile?.appearance?.overall || "Здоровое, спортивное и ухоженное тело без уродств");
  const [profileVagina, setProfileVagina] = useState(userProfile?.appearance?.vagina || "Нежная, узкая розовая вагина");
  const [profileAnus, setProfileAnus] = useState(userProfile?.appearance?.anus || "Аккуратная, отбеленная попка");

  const [faceScore, setFaceScore] = useState<number>(userProfile?.appearance?.faceScore ?? 80);
  const [chestScore, setChestScore] = useState<number>(userProfile?.appearance?.chestScore ?? 80);
  const [waistScore, setWaistScore] = useState<number>(userProfile?.appearance?.waistScore ?? 80);
  const [hipsScore, setHipsScore] = useState<number>(userProfile?.appearance?.hipsScore ?? 80);
  const [vaginaScore, setVaginaScore] = useState<number>(userProfile?.appearance?.vaginaScore ?? 80);
  const [anusScore, setAnusScore] = useState<number>(userProfile?.appearance?.anusScore ?? 80);
  const [legsScore, setLegsScore] = useState<number>(userProfile?.appearance?.legsScore ?? 80);

  useEffect(() => {
    const avg = Math.round((faceScore + chestScore + waistScore + hipsScore + vaginaScore + anusScore + legsScore) / 7);
    setProfileAttractiveness(avg);
  }, [faceScore, chestScore, waistScore, hipsScore, vaginaScore, anusScore, legsScore]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(userProfile?.photo || null);
  const [profileDetailedAnalysis, setProfileDetailedAnalysis] = useState(userProfile?.detailedAnalysis || "");
  const [profileImageSceneDescription, setProfileImageSceneDescription] = useState(userProfile?.imageSceneDescription || "");
  const [profilePlotContext, setProfilePlotContext] = useState(userProfile?.plotContext || "");

  // Interactive Seduction & Sex Scene States
  const [activeSeductionChar, setActiveSeductionChar] = useState<Character | null>(null);
  const [seductionHistory, setSeductionHistory] = useState<{ role: "user" | "model" | "narrator"; content: string; timestamp: string }[]>([]);
  const [seductionChoices, setSeductionChoices] = useState<string[]>([]);
  const [isSeductionLoading, setIsSeductionLoading] = useState(false);
  const [customSeductionInput, setCustomSeductionInput] = useState("");
  const [seductionIsFinished, setSeductionIsFinished] = useState(false);

  // Character Add/Edit Modal
  const [showCharModal, setShowCharModal] = useState(false);
  const [editingCharId, setEditingCharId] = useState<string | null>(null); // null means "create mode"
  const [charName, setCharName] = useState("");
  const [charRole, setCharRole] = useState("");
  const [charGroup, setCharGroup] = useState<"Друзья" | "Семья" | "Работа" | "Соседи">("Друзья");
  const [charPersonality, setCharPersonality] = useState("");
  const [charSpeech, setCharSpeech] = useState("");
  const [charAttitude, setCharAttitude] = useState("");
  const [charGreeting, setCharGreeting] = useState("");

  // Adult 21+ character qualities states
  const [charTrust, setCharTrust] = useState(50);
  const [charLove, setCharLove] = useState(0);
  const [charLust, setCharLust] = useState(0);
  const [charAnger, setCharAnger] = useState(0);
  const [charFetishes, setCharFetishes] = useState("");
  const [charInclinations, setCharInclinations] = useState("");

  // Group creation Modal
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // Confirmation Modals states
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [charIdToDelete, setCharIdToDelete] = useState<string | null>(null);

  // Call simulation overlay
  const [activeCall, setActiveCall] = useState<{
    characterId: string;
    status: "calling" | "connected" | "ended";
    duration: number;
    type: "phone" | "in_person";
  } | null>(null);
  const [callInputText, setCallInputText] = useState("");
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Group chat responder selection state
  // key is groupChatId, value is characterId of participant (or "auto")
  const [groupResponders, setGroupResponders] = useState<Record<string, string>>({});

  // Refs for scroll and files
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages[selectedChatId]?.length, selectedChatId, isLoading, activeCall]);

  // Active call timer
  useEffect(() => {
    if (activeCall && activeCall.status === "connected") {
      callTimerRef.current = setInterval(() => {
        setActiveCall(prev => {
          if (!prev) return null;
          return { ...prev, duration: prev.duration + 1 };
        });
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [activeCall?.status]);

  // Determine if active chat is a group chat or a private chat
  const activeGroup = useMemo(() => {
    return groupChats.find(g => g.id === selectedChatId) || null;
  }, [groupChats, selectedChatId]);

  const activeChar = useMemo(() => {
    if (activeGroup) return null;
    return characters.find(c => c.id === selectedChatId) || characters[0] || null;
  }, [characters, selectedChatId, activeGroup]);

  const thoughtsData = activeChar ? charThoughts[activeChar.id] : null;
  const thoughtsLoading = activeChar ? !!charThoughtsLoading[activeChar.id] : false;

  const currentCommMode = chatModes[selectedChatId] || "chat";

  // Selected group participant characters
  const activeGroupParticipants = useMemo(() => {
    if (!activeGroup) return [];
    return characters.filter(c => activeGroup.participantIds.includes(c.id));
  }, [activeGroup, characters]);

  // Filter facts visible to the active character/group based on their group
  const visibleFacts = useMemo(() => {
    if (activeGroup) {
      // In a group chat, any facts known by any participant are visible
      return sharedFacts.filter(fact => 
        fact.group === "Все" || 
        (fact.knownBy && activeGroup.participantIds.some(pid => fact.knownBy?.includes(pid))) ||
        activeGroup.participantIds.includes(fact.sourceCharacterId)
      );
    }
    if (!activeChar) return [];
    return sharedFacts.filter(fact => 
      fact.group === "Все" || 
      fact.sourceCharacterId === activeChar.id ||
      (fact.knownBy && fact.knownBy.includes(activeChar.id))
    );
  }, [sharedFacts, activeChar, activeGroup]);

  // Profile setup handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFormError(null);
    if (!profileName.trim() || !profileBio.trim() || !profileTraits.trim()) {
      setProfileFormError("Пожалуйста, заполните все поля профиля!");
      return;
    }

    setIsSavingProfile(true);
    setSetupStage(1); // Stage 1: Reading profile bio and parameters

    await new Promise(resolve => setTimeout(resolve, 150));
    setSetupStage(2); // Stage 2: Syncing character fetishes & lust

    if (!profilePhoto) {
      // Scale lust scores dynamically based on the manually selected attractiveness level
      setCharacters(prev => prev.map(c => {
        const isRelative = ["mother", "father", "brother", "grandfather"].includes(c.id);
        if (isRelative) {
          return {
            ...c,
            scales: c.scales ? { ...c.scales, lust: 0 } : { trust: 50, love: 0, lust: 0, anger: 0 }
          };
        }
        let baseLust = 0;
        if (c.id === "max") baseLust = Math.round(profileAttractiveness * 0.95);
        else if (c.id === "artem") baseLust = Math.round(profileAttractiveness * 0.8);
        else if (c.id === "masha") baseLust = Math.round(profileAttractiveness * 0.4);
        else if (c.id === "colleague") baseLust = Math.round(profileAttractiveness * 0.85);
        else if (c.id === "neighbor") baseLust = Math.round(profileAttractiveness * 0.25);
        else if (c.id === "semenych") baseLust = Math.round(profileAttractiveness * 0.15);
        else if (c.id === "mihalych") baseLust = Math.round(profileAttractiveness * 0.05);

        return {
          ...c,
          scales: c.scales ? { ...c.scales, lust: baseLust } : { trust: 50, love: 0, lust: baseLust, anger: 0 }
        };
      }));
    } else {
      // Evaluate text descriptions to adjust lust scores
      try {
        const res = await fetch("/api/evaluate-appearance-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            face: profileFace,
            chest: profileChest,
            waist: profileWaist,
            hips: profileHips,
            intimate: profileIntimate,
            vagina: profileVagina,
            anus: profileAnus,
            legs: profileLegs,
            overall: profileOverall,
            faceScore: faceScore,
            chestScore: chestScore,
            waistScore: waistScore,
            hipsScore: hipsScore,
            vaginaScore: vaginaScore,
            anusScore: anusScore,
            legsScore: legsScore,
            attractiveness: profileAttractiveness
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.lustScores) {
            setCharacters(prev => prev.map(c => {
              const score = data.lustScores[c.id];
              return score !== undefined ? {
                ...c,
                scales: c.scales ? { ...c.scales, lust: score } : { trust: 50, love: 0, lust: score, anger: 0 }
              } : c;
            }));
          }
        }
      } catch (err) {
        console.log("Evaluation of appearance text complete with fallback/result.");
      }
    }

    await new Promise(resolve => setTimeout(resolve, 200));
    setSetupStage(3); // Stage 3: Initializing storyline & relations

    await new Promise(resolve => setTimeout(resolve, 150));
    setSetupStage(4); // Stage 4: Preparing simulation world

    await new Promise(resolve => setTimeout(resolve, 100));

    const profile: UserProfile = {
      name: profileName.trim(),
      gender: profileGender,
      age: profileAge,
      bio: profileBio.trim(),
      traits: profileTraits.trim(),
      appearance: {
        face: profileFace.trim(),
        chest: profileChest.trim(),
        waist: profileWaist.trim(),
        hips: profileHips.trim(),
        intimate: profileIntimate.trim(),
        legs: profileLegs.trim(),
        overall: profileOverall.trim(),
        vagina: profileVagina.trim(),
        anus: profileAnus.trim(),
        faceScore,
        chestScore,
        waistScore,
        hipsScore,
        vaginaScore,
        anusScore,
        legsScore,
      },
      photo: profilePhoto || undefined,
      detailedAnalysis: profileDetailedAnalysis.trim() || undefined,
      imageSceneDescription: profileImageSceneDescription.trim() || undefined,
      plotContext: profilePlotContext.trim() || undefined,
      attractiveness: profileAttractiveness
    };

    setUserProfile(profile);
    setIsSavingProfile(false);
    setSetupStage(0);
    setShowProfileModal(false);
    setGossipNotification("✨ Профиль успешно сохранен! Показатели отношений обновлены.");
    setTimeout(() => setGossipNotification(null), 4000);
  };

  const handlePhotoUploadAndEvaluation = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      setIsEvaluatingPhoto(true);
      setEvaluationError(null);

      // Compress photo to prevent local storage quota limit exceeded errors
      const base64Str = await compressImage(rawBase64);
      setProfilePhoto(base64Str);

      try {
        const res = await fetch("/api/evaluate-profile-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo: base64Str })
        });

        if (res.ok) {
          const data = await res.json();
          if (data) {
            setProfileFace(data.face || "Очаровательное лицо");
            setProfileChest(data.chest || "Аккуратная грудь");
            setProfileWaist(data.waist || "Стройная талия");
            setProfileHips(data.hips || "Ухоженные бёдра");
            setProfileIntimate(data.intimate || "Аккуратные интимные зоны");
            setProfileVagina(data.vagina || "Нежная, узкая розовая вагина");
            setProfileAnus(data.anus || "Аккуратная, отбеленная попка");
            setProfileLegs(data.legs || "Стройные ноги");
            setProfileOverall(data.overall || "Здоровое тело");
            setProfileDetailedAnalysis(data.detailedAnalysis || "");
            setProfileImageSceneDescription(data.imageSceneDescription || "");
            setProfilePlotContext(data.plotContext || "");
            if (data.faceScore !== undefined) setFaceScore(data.faceScore);
            if (data.chestScore !== undefined) setChestScore(data.chestScore);
            if (data.waistScore !== undefined) setWaistScore(data.waistScore);
            if (data.hipsScore !== undefined) setHipsScore(data.hipsScore);
            if (data.vaginaScore !== undefined) setVaginaScore(data.vaginaScore);
            if (data.anusScore !== undefined) setAnusScore(data.anusScore);
            if (data.legsScore !== undefined) setLegsScore(data.legsScore);
            
            const scores = [
              data.faceScore,
              data.chestScore,
              data.waistScore,
              data.hipsScore,
              data.vaginaScore,
              data.anusScore,
              data.legsScore
            ].filter(v => v !== undefined);
            if (scores.length > 0) {
              const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
              setProfileAttractiveness(avg);
            }
            
            setGossipNotification("✨ Фотография распознана! Оценки внешности и вожделения обновлены.");
            setTimeout(() => setGossipNotification(null), 4000);
          }
          if (data.lustScores) {
            setCharacters(prev => prev.map(c => {
              const score = data.lustScores[c.id];
              return score !== undefined ? {
                ...c,
                scales: c.scales ? { ...c.scales, lust: score } : { trust: 50, love: 0, lust: score, anger: 0 }
              } : c;
            }));
          }
        } else {
          const errText = await res.text();
          setEvaluationError(`Не удалось проанализировать лицо автоматически: ${errText || "ошибка сервера"}. Введите характеристики вручную!`);
        }
      } catch (err) {
        setEvaluationError("Не удалось связаться с сервером оценки. Введите характеристики вручную!");
      } finally {
        setIsEvaluatingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Individual gossip connections and communication channels matrix
  const GOSSIP_CONNECTIONS: Record<string, { targetId: string; baseChance: number }[]> = {
    max: [
      { targetId: "artem", baseChance: 0.02 },
      { targetId: "masha", baseChance: 0.01 },
      { targetId: "sergey", baseChance: 0.01 },
      { targetId: "neighbor", baseChance: 0.01 },
      { targetId: "mother", baseChance: 0.02 },
      { targetId: "father", baseChance: 0.01 },
      { targetId: "brother", baseChance: 0.01 }
    ],
    masha: [
      { targetId: "artem", baseChance: 0.02 },
      { targetId: "max", baseChance: 0.01 },
      { targetId: "sergey", baseChance: 0.01 },
      { targetId: "semenych", baseChance: 0.02 },
      { targetId: "neighbor", baseChance: 0.01 }
    ],
    artem: [
      { targetId: "max", baseChance: 0.02 },
      { targetId: "masha", baseChance: 0.02 },
      { targetId: "brother", baseChance: 0.01 },
      { targetId: "semenych", baseChance: 0.01 }
    ],
    semenych: [
      { targetId: "mihalych", baseChance: 0.03 },
      { targetId: "neighbor", baseChance: 0.02 },
      { targetId: "masha", baseChance: 0.01 },
      { targetId: "artem", baseChance: 0.01 },
      { targetId: "max", baseChance: 0.01 }
    ],
    mihalych: [
      { targetId: "semenych", baseChance: 0.03 },
      { targetId: "neighbor", baseChance: 0.01 }
    ],
    neighbor: [
      { targetId: "semenych", baseChance: 0.01 },
      { targetId: "mihalych", baseChance: 0.01 },
      { targetId: "max", baseChance: 0.01 },
      { targetId: "masha", baseChance: 0.01 }
    ],
    sergey: [
      { targetId: "max", baseChance: 0.01 },
      { targetId: "masha", baseChance: 0.01 }
    ],
    mother: [
      { targetId: "max", baseChance: 0.01 },
      { targetId: "grandfather", baseChance: 0.02 },
      { targetId: "father", baseChance: 0.02 },
      { targetId: "brother", baseChance: 0.02 }
    ],
    father: [
      { targetId: "mother", baseChance: 0.02 },
      { targetId: "brother", baseChance: 0.01 },
      { targetId: "grandfather", baseChance: 0.01 },
      { targetId: "max", baseChance: 0.01 }
    ],
    brother: [
      { targetId: "artem", baseChance: 0.01 },
      { targetId: "mother", baseChance: 0.02 },
      { targetId: "father", baseChance: 0.01 },
      { targetId: "max", baseChance: 0.01 }
    ],
    grandfather: [
      { targetId: "mother", baseChance: 0.02 },
      { targetId: "father", baseChance: 0.01 }
    ]
  };

  // Standalone/Instance helper for rumor propagation based on individual relationships
  const propagateRumors = (facts: SharedFact[], charactersList: Character[]): SharedFact[] => {
    const newLogs: any[] = [];
    
    const updatedFacts = facts.map(fact => {
      // Ensure knownBy exists, initialized with source character or empty array
      const currentKnown = fact.knownBy ? [...fact.knownBy] : [];
      if (fact.sourceCharacterId && fact.sourceCharacterId !== "storyteller" && fact.sourceCharacterId !== "user" && !currentKnown.includes(fact.sourceCharacterId)) {
        currentKnown.push(fact.sourceCharacterId);
      }
      const knownBy = Array.from(new Set(currentKnown)).filter(id => id && id !== "storyteller" && id !== "user");

      let changed = true;
      let round = 0;
      // Spread the rumor through individual relationships in 1 round of gossip
      while (changed && round < 1) {
        changed = false;
        
        charactersList.forEach(char => {
          if (knownBy.includes(char.id)) return; // already knows it

          // Find characters who currently know this fact and are connected individually to char
          const knowers = charactersList.filter(c => knownBy.includes(c.id) && c.id !== char.id);
          
          for (const knower of knowers) {
            // Find if there is an individual connection between knower and char (either direction)
            const connFromHearer = (GOSSIP_CONNECTIONS[char.id] || []).find(c => c.targetId === knower.id);
            const connFromKnower = (GOSSIP_CONNECTIONS[knower.id] || []).find(c => c.targetId === char.id);

            if (connFromHearer || connFromKnower) {
              const baseChance = connFromKnower?.baseChance || connFromHearer?.baseChance || 0.01;
              let chance = baseChance;

              // Gossip queens / bards boost spreading very lightly
              if (knower.id === "masha" || knower.id === "semenych") chance += 0.005;
              if (char.id === "masha" || char.id === "semenych") chance += 0.005;

              // High Lust makes them speak slightly more about physical intimacy
              const lust = knower.scales?.lust || 50;
              if (lust > 80) chance += 0.005;

              // Reduce rumor spread chance by 99% overall for ultra-discreet affair gameplay
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
                break; // learned from this knower, stop checking other knowers for this character
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
          return updated;
        });
      }, 50);
    }

    return updatedFacts;
  };

  // Start an interactive seduction/sex scene
  const handleStartSeduction = async (char: Character) => {
    setActiveSeductionChar(char);
    setSeductionIsFinished(false);
    setIsSeductionLoading(true);
    setCustomSeductionInput("");

    // Initial narrative
    const initialText = `*Вы приглушили свет, сели ближе к ${char.name}... В воздухе повисло сильное эротическое напряжение. Вы заглядываете ему в глаза и нежно прикасаетесь к его руке...*`;
    const initialStep = {
      role: "narrator" as const,
      content: initialText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setSeductionHistory([initialStep]);

    try {
      const response = await fetch("/api/interactive-seduction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: char,
          choice: "Начать соблазнение и интимное сближение",
          history: [initialStep],
          userProfile,
          aiMode
        })
      });

      if (!response.ok) throw new Error("Server error");
      const data = await response.json();

      // Append model response
      const modelStep = {
        role: "model" as const,
        content: data.narrative,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setSeductionHistory([initialStep, modelStep]);
      setSeductionChoices(data.suggestedChoices || []);
      setSeductionIsFinished(data.isFinished || false);

      // Update character's live scales
      updateCharacterMetrics(char.id, data);

    } catch (e) {
      console.error("Error starting seduction:", e);
      // Fallback response
      const modelStep = {
        role: "model" as const,
        content: `*${char.name} с удивлением и восторгом смотрит на тебя. Его дыхание учащается, он притягивает тебя за талию к себе и страстно шепчет:* "Боже, какая ты горячая... Я так этого хотел!"`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setSeductionHistory([initialStep, modelStep]);
      setSeductionChoices([
        "Позволить ему медленно расстегнуть твою блузку",
        "Обнять его за шею и поцеловать в губы",
        "Провести рукой по его бедру ближе к ширинке"
      ]);
    } finally {
      setIsSeductionLoading(false);
    }
  };

  // Helper to update character metrics globally in state
  const updateCharacterMetrics = (charId: string, data: any) => {
    setCharacters(prev => prev.map(c => {
      if (c.id === charId) {
        const currentScales = c.scales || { trust: 50, love: 50, lust: 50, anger: 0, intimacy: 30 };
        const adj = data.scaleAdjustments || { trust: 0, love: 0, lust: 0, anger: 0, intimacy: 0 };
        
        // 3x slower progression for realistic scaling
        const div3 = (val: number) => Math.round(val / 3);

        const scales = {
          trust: Math.max(0, Math.min(100, currentScales.trust + div3(adj.trust || 0))),
          love: Math.max(0, Math.min(100, currentScales.love + div3(adj.love || 0))),
          lust: Math.max(0, Math.min(100, currentScales.lust + div3(adj.lust || 0))),
          anger: Math.max(0, Math.min(100, currentScales.anger + div3(adj.anger || 0))),
          intimacy: Math.max(0, Math.min(100, (currentScales.intimacy || 30) + div3(adj.intimacy || 0)))
        };

        const ballFullness = data.ballFullness !== undefined ? data.ballFullness : c.ballFullness;
        const ejaculatedOnPhoto = (c.ejaculatedOnPhoto || 0) + (data.ejaculatedOnPhoto || data.ejaculatedOnPhotoAdjustment || 0);
        const ejaculatedInside = (c.ejaculatedInside || 0) + (data.ejaculatedInside || data.ejaculatedInsideAdjustment || 0);
        
        // Split locations
        const ejaculatedVagina = (c.ejaculatedVagina || 0) + (data.ejaculatedVagina || data.ejaculatedVaginaAdjustment || 0);
        const ejaculatedAnus = (c.ejaculatedAnus || 0) + (data.ejaculatedAnus || data.ejaculatedAnusAdjustment || 0);
        const ejaculatedMouth = (c.ejaculatedMouth || 0) + (data.ejaculatedMouth || data.ejaculatedMouthAdjustment || 0);
        const sexCount = (c.sexCount || 0) + (data.sexCountIncrement || 0);

        const penisSizeDiscovered = data.penisSizeDiscovered ? true : c.penisSizeDiscovered;

        return {
          ...c,
          scales,
          ballFullness,
          ejaculatedOnPhoto,
          ejaculatedInside,
          ejaculatedVagina,
          ejaculatedAnus,
          ejaculatedMouth,
          sexCount,
          penisSizeDiscovered
        };
      }
      return c;
    }));
  };

  // Advance the seduction/sex scene with a choice
  const handleSeductionStep = async (choiceText: string) => {
    if (!activeSeductionChar || isSeductionLoading) return;

    setIsSeductionLoading(true);
    setCustomSeductionInput("");

    const userStep = {
      role: "user" as const,
      content: choiceText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const newHistory = [...seductionHistory, userStep];
    setSeductionHistory(newHistory);

    try {
      const response = await fetch("/api/interactive-seduction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: activeSeductionChar,
          choice: choiceText,
          history: newHistory,
          userProfile,
          aiMode
        })
      });

      if (!response.ok) throw new Error("Server error");
      const data = await response.json();

      const modelStep = {
        role: "model" as const,
        content: data.narrative,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setSeductionHistory(prev => [...prev, modelStep]);
      setSeductionChoices(data.suggestedChoices || []);
      setSeductionIsFinished(data.isFinished || false);

      // Update character's metrics
      updateCharacterMetrics(activeSeductionChar.id, data);

      // Keep activeSeductionChar's local state updated
      setActiveSeductionChar(prev => {
        if (!prev) return null;
        const currentScales = prev.scales || { trust: 50, love: 50, lust: 50, anger: 0, intimacy: 30 };
        const adj = data.scaleAdjustments || { trust: 0, love: 0, lust: 0, anger: 0, intimacy: 0 };
        const div3 = (val: number) => Math.round(val / 3);
        
        return {
          ...prev,
          scales: {
            trust: Math.max(0, Math.min(100, currentScales.trust + div3(adj.trust || 0))),
            love: Math.max(0, Math.min(100, currentScales.love + div3(adj.love || 0))),
            lust: Math.max(0, Math.min(100, currentScales.lust + div3(adj.lust || 0))),
            anger: Math.max(0, Math.min(100, currentScales.anger + div3(adj.anger || 0))),
            intimacy: Math.max(0, Math.min(100, (currentScales.intimacy || 30) + div3(adj.intimacy || 0)))
          },
          ballFullness: data.ballFullness !== undefined ? data.ballFullness : prev.ballFullness,
          ejaculatedOnPhoto: (prev.ejaculatedOnPhoto || 0) + (data.ejaculatedOnPhoto || data.ejaculatedOnPhotoAdjustment || 0),
          ejaculatedInside: (prev.ejaculatedInside || 0) + (data.ejaculatedInside || data.ejaculatedInsideAdjustment || 0),
          ejaculatedVagina: (prev.ejaculatedVagina || 0) + (data.ejaculatedVagina || data.ejaculatedVaginaAdjustment || 0),
          ejaculatedAnus: (prev.ejaculatedAnus || 0) + (data.ejaculatedAnus || data.ejaculatedAnusAdjustment || 0),
          ejaculatedMouth: (prev.ejaculatedMouth || 0) + (data.ejaculatedMouth || data.ejaculatedMouthAdjustment || 0),
          sexCount: (prev.sexCount || 0) + (data.sexCountIncrement || 0),
          penisSizeDiscovered: data.penisSizeDiscovered ? true : prev.penisSizeDiscovered
        };
      });

    } catch (e) {
      console.error("Error in seduction step:", e);
      const modelStep = {
        role: "model" as const,
        content: `*${activeSeductionChar.name} страстно стонет, полностью отдаваясь вашим ласкам. Его кожа горит, он шепчет безумные признания на ушко и ласкает твоё тело с невероятной нежностью и силой.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setSeductionHistory(prev => [...prev, modelStep]);
      setSeductionChoices([
        "Попросить его войти в тебя",
        "Повернуться спиной и встать раком",
        "Нежно поцеловать его в губы и прошептать слова любви"
      ]);
    } finally {
      setIsSeductionLoading(false);
    }
  };

  const handleCloseSeduction = () => {
    setActiveSeductionChar(null);
    setSeductionHistory([]);
    setSeductionChoices([]);
    setSeductionIsFinished(false);
  };

  const fetchThoughtsForCharacter = async (charId: string) => {
    const charObj = characters.find(c => c.id === charId);
    if (!charObj) return;

    setCharThoughtsLoading(prev => ({ ...prev, [charId]: true }));
    setThoughtsError(null);

    try {
      const currentMessages = messages[charId] || [];
      const response = await fetch("/api/thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: charObj,
          messages: currentMessages,
          sharedFacts: sharedFacts.map((f) => f.text),
          userProfile,
          aiMode: aiMode,
          storyLog: storyLog
        })
      });

      if (!response.ok) {
        throw new Error("Не удалось прочитать мысли персонажа. Возможно, превышен лимит или сервер временно недоступен.");
      }

      const data = await response.json();
      setCharThoughts(prev => ({ ...prev, [charId]: data }));
    } catch (err: any) {
      console.log("Thoughts fetch handled with error/fallback.");
      setThoughtsError(err.message || String(err));
    } finally {
      setCharThoughtsLoading(prev => ({ ...prev, [charId]: false }));
    }
  };

  // Fetch thoughts from backend (modal flow)
  const handleFetchThoughts = async () => {
    if (!activeChar) return;
    setShowThoughtsModal(true);
    await fetchThoughtsForCharacter(activeChar.id);
  };

  // Auto-fetch thoughts when active character changes and we don't have them yet
  useEffect(() => {
    if (activeChar && !charThoughts[activeChar.id] && !charThoughtsLoading[activeChar.id]) {
      fetchThoughtsForCharacter(activeChar.id);
    }
  }, [activeChar?.id]);

  // Auto-refresh thoughts in background when messages from the character arrive
  useEffect(() => {
    if (!activeChar) return;
    const currentMessages = messages[activeChar.id] || [];
    if (currentMessages.length > 0) {
      const lastMsg = currentMessages[currentMessages.length - 1];
      if (lastMsg.role === "model") {
        fetchThoughtsForCharacter(activeChar.id);
      }
    }
  }, [messages[activeChar?.id || ""]?.length, activeChar?.id]);

  // Reset all data to default (Start Over)
  const handleResetData = () => {
    setShowResetConfirm(true);
  };

  const executeResetData = async () => {
    try {
      localStorage.clear();
      await clearDb();
    } catch (e) {
      console.error("Error clearing data on reset:", e);
    }
    setCharacters(CHARACTERS);
    setGroupChats([]);
    setSelectedChatId("masha");
    setMessages({});
    setSharedFacts([]);
    setStoryLog(null);
    setUserProfile(null);
    setAttachedImage(null);
    setIsVoiceMode(false);
    setInputText("");
    setActiveCall(null);
    
    // Reset profile states
    setProfileName("");
    setProfileGender("Мужской");
    setProfileAge(23);
    setProfileBio("");
    setProfileTraits("");
    setProfileFace("Привлекательное, чистое лицо");
    setProfileChest("Упругая, округлая грудь");
    setProfileWaist("Тонкая талия, плоский живот");
    setProfileHips("Выразительные, округлые бёдра");
    setProfileIntimate("Аккуратные, ухоженные интимные зоны");
    setProfileLegs("Стройные, длинные ноги");
    setProfileOverall("Здоровое, спортивное и ухоженное тело без уродств");
    setProfilePhoto(null);

    // Force page reload to ensure all memory state is fully reset
    window.location.reload();
  };

  // Open Edit Profile
  const openEditProfile = () => {
    if (userProfile) {
      setProfileName(userProfile.name);
      setProfileGender(userProfile.gender);
      setProfileAge(userProfile.age);
      setProfileBio(userProfile.bio);
      setProfileTraits(userProfile.traits);
      setProfileFace(userProfile.appearance?.face || "Привлекательное, чистое лицо");
      setProfileChest(userProfile.appearance?.chest || "Упругая, округлая грудь");
      setProfileWaist(userProfile.appearance?.waist || "Тонкая талия, плоский живот");
      setProfileHips(userProfile.appearance?.hips || "Выразительные, округлые бёдра");
      setProfileIntimate(userProfile.appearance?.intimate || "Аккуратные, ухоженные интимные зоны");
      setProfileLegs(userProfile.appearance?.legs || "Стройные, длинные ноги");
      setProfileOverall(userProfile.appearance?.overall || "Здоровое, спортивное и ухоженное тело без уродств");
      setProfileVagina(userProfile.appearance?.vagina || "Нежная, узкая розовая вагина");
      setProfileAnus(userProfile.appearance?.anus || "Аккуратная, отбеленная попка");
      setFaceScore(userProfile.appearance?.faceScore ?? 80);
      setChestScore(userProfile.appearance?.chestScore ?? 80);
      setWaistScore(userProfile.appearance?.waistScore ?? 80);
      setHipsScore(userProfile.appearance?.hipsScore ?? 80);
      setVaginaScore(userProfile.appearance?.vaginaScore ?? 80);
      setAnusScore(userProfile.appearance?.anusScore ?? 80);
      setLegsScore(userProfile.appearance?.legsScore ?? 80);
      setProfilePhoto(userProfile.photo || null);
      setProfileDetailedAnalysis(userProfile.detailedAnalysis || "");
      setProfileImageSceneDescription(userProfile.imageSceneDescription || "");
      setProfilePlotContext(userProfile.plotContext || "");
      setProfileAttractiveness(userProfile.attractiveness ?? 80);
    }
    setShowProfileModal(true);
  };

  // Delete a specific Character
  const handleDeleteCharacter = (charId: string) => {
    setCharIdToDelete(charId);
  };

  const executeDeleteCharacter = (charId: string) => {
    // Remove from list
    const updatedChars = characters.filter(c => c.id !== charId);
    setCharacters(updatedChars);
    
    // Remove messages
    const updatedMsgs = { ...messages };
    delete updatedMsgs[charId];
    setMessages(updatedMsgs);

    // Clean group chats containing this character
    const updatedGroups = groupChats.map(g => {
      return {
        ...g,
        participantIds: g.participantIds.filter(id => id !== charId)
      };
    }).filter(g => g.participantIds.length > 0); // remove empty groups
    setGroupChats(updatedGroups);

    // Reset selection if deleted
    if (selectedChatId === charId) {
      if (updatedChars.length > 0) {
        setSelectedChatId(updatedChars[0].id);
      } else if (updatedGroups.length > 0) {
        setSelectedChatId(updatedGroups[0].id);
      }
    }

    setShowCharModal(false);
    setEditingCharId(null);
    setCharIdToDelete(null);
    setGossipNotification("🗑️ Персонаж успешно удален.");
    setTimeout(() => setGossipNotification(null), 3000);
  };

  // Delete message to replay dialogue
  const handleDeleteMessage = (msgId: string) => {
    if (!selectedChatId) return;
    setMessages(prev => {
      const chatMsgs = prev[selectedChatId] || [];
      const updated = chatMsgs.filter(m => m.id !== msgId);
      return {
        ...prev,
        [selectedChatId]: updated
      };
    });
    setGossipNotification("🗑️ Сообщение удалено. Вы можете переиграть ветку диалога с этого момента!");
    setTimeout(() => setGossipNotification(null), 3000);
  };

  // Open Character Modal for edit or create
  const openCharacterModal = (charId: string | null) => {
    if (charId) {
      // Edit mode
      const char = characters.find(c => c.id === charId);
      if (char) {
        setEditingCharId(charId);
        setCharName(char.name);
        setCharRole(char.role);
        setCharGroup(char.group);
        setCharPersonality(char.personality);
        setCharSpeech(char.speechStyle);
        setCharAttitude(char.attitude);
        setCharGreeting(char.initialMessage);
        
        // Load adult stats
        setCharTrust(char.scales?.trust ?? 50);
        setCharLove(char.scales?.love ?? 0);
        setCharLust(char.scales?.lust ?? 0);
        setCharAnger(char.scales?.anger ?? 0);
        setCharFetishes(char.fetishes ? char.fetishes.join(", ") : "");
        setCharInclinations(char.inclinations ? char.inclinations.join(", ") : "");
        
        setShowCharModal(true);
      }
    } else {
      // Create mode
      setEditingCharId(null);
      setCharName("");
      setCharRole("");
      setCharGroup("Друзья");
      setCharPersonality("");
      setCharSpeech("");
      setCharAttitude("");
      setCharGreeting("");
      
      // Default creation stats
      setCharTrust(50);
      setCharLove(0);
      setCharLust(0);
      setCharAnger(0);
      setCharFetishes("");
      setCharInclinations("");
      
      setShowCharModal(true);
    }
  };

  // Create or Update Character
  const handleSaveCharacter = (e: React.FormEvent) => {
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
      // Edit
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
      // Create new
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
      setSelectedChatId(newId);
      setGossipNotification(`✨ Создан новый персонаж "${charName}"!`);
    }

    setShowCharModal(false);
    setEditingCharId(null);
    setTimeout(() => setGossipNotification(null), 3500);
  };

  // Group creation handler
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedParticipants.length === 0) {
      setGossipNotification("⚠️ Ошибка: Укажите название группы и выберите хотя бы одного участника!");
      setTimeout(() => setGossipNotification(null), 4000);
      return;
    }

    const groupId = `group-${Date.now()}`;
    const newGroup: GroupChat = {
      id: groupId,
      name: groupName.trim(),
      avatarColor: ["from-teal-400 to-emerald-600", "from-fuchsia-500 to-purple-800", "from-orange-400 to-red-600", "from-sky-400 to-blue-600"][Math.floor(Math.random() * 4)],
      participantIds: selectedParticipants
    };

    setGroupChats(prev => [...prev, newGroup]);
    setSelectedChatId(groupId);
    setShowGroupModal(false);
    setGroupName("");
    setSelectedParticipants([]);

    setGossipNotification(`👥 Создан групповой чат "${newGroup.name}"!`);
    setTimeout(() => setGossipNotification(null), 4000);
  };

  // File attachments helper
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
          const compressed = await compressImage(rawBase64);
          setAttachedImage(compressed);
        } catch (err) {
          setAttachedImage(rawBase64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Send message to Character or Group Chat
  const handleSendMessage = async (e: React.FormEvent, customText?: string, isFromCall = false) => {
    if (e) e.preventDefault();
    
    const textToSend = customText !== undefined ? customText : inputText;
    if ((!textToSend.trim() && !attachedImage) || isLoading) return;

    const currentText = textToSend.trim() || "Смотри прикрепленное изображение";
    const imageToSend = attachedImage;

    const isNpcSend = (customText === undefined && sendAsCharacter);

    // Reset inputs immediately
    if (selectedChatId) {
      setQuickReplies(prev => {
        const copy = { ...prev };
        delete copy[selectedChatId];
        return copy;
      });
    }

    if (!isFromCall) {
      setInputText("");
      setAttachedImage(null);
      setSendAsNarrator(false); // Reset narrator toggle after send
      setSendAsCharacter(false); // Reset character toggle after send
    } else {
      setCallInputText("");
    }

    const activeCommMode = chatModes[selectedChatId] || "chat";
    const isCallMode = isFromCall ? (activeCall?.type === "phone") : (activeCommMode === "call");
    const isLiveModeMessage = isFromCall ? (activeCall?.type === "in_person") : (activeCommMode === "live");

    // Determine responder details first
    let responder: Character;
    let groupPartNames: string[] = [];

    if (activeGroup) {
      // Find which character responds in group
      const selectedResponderId = groupResponders[activeGroup.id] || "auto";
      let chosenId = selectedResponderId;

      if (chosenId === "auto") {
        // Select a random participant
        const idx = Math.floor(Math.random() * activeGroup.participantIds.length);
        chosenId = activeGroup.participantIds[idx];
      }

      const charObj = characters.find(c => c.id === chosenId);
      if (!charObj) throw new Error("Участник группы не найден.");
      responder = charObj;

      groupPartNames = activeGroupParticipants.map(p => `${p.name} (${p.role})`);
    } else {
      if (!activeChar) throw new Error("Собеседник не выбран.");
      responder = activeChar;
    }

    const userMessage: Message = {
      id: isNpcSend ? `model-${Date.now()}` : `user-${Date.now()}`,
      role: isNpcSend ? "model" : ((customText === undefined && sendAsNarrator) ? "narrator" : "user"),
      senderId: isNpcSend ? responder.id : undefined,
      content: currentText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoice: isVoiceMode || isFromCall,
      isCall: isCallMode,
      isLive: isLiveModeMessage,
      image: imageToSend || undefined
    };

    // Update messages
    const currentHistory = messages[selectedChatId] || [];
    const updatedHistory = [...currentHistory, userMessage];
    setMessages(prev => ({
      ...prev,
      [selectedChatId]: updatedHistory
    }));

    setIsLoading(true);
    setSystemError(null);
    setSystemStatusMessage("ИИ анализирует контекст беседы...");

    try {
      // Format character details
      const characterData = {
        name: responder.name,
        role: responder.role,
        personality: responder.personality,
        speechStyle: responder.speechStyle,
        id: responder.id,
        group: responder.group,
        scales: responder.scales,
        fetishes: responder.fetishes,
        inclinations: responder.inclinations,
        attitude: responder.attitude
      };

      if (isNpcSend) {
        setSystemStatusMessage("Главная Героиня обдумывает свой ответ...");
        const response = await fetch("/api/generate-heroine-chat-reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            character: characterData,
            messages: updatedHistory,
            userProfile,
            storyLog
          })
        });

        if (!response.ok) {
          throw new Error(`Ошибка генерации ответа героини: ${response.status}`);
        }

        const data = await response.json();
        const heroineMessage: Message = {
          id: `heroine-reply-${Date.now()}`,
          role: "user",
          content: data.reply || "*(Задумалась...)*",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isVoice: isVoiceMode || isFromCall,
          isCall: isCallMode,
          isLive: isLiveModeMessage
        };

        setMessages(prev => ({
          ...prev,
          [selectedChatId]: [...updatedHistory, heroineMessage]
        }));
        
        setIsLoading(false);
        setSystemStatusMessage("Все системы работают стабильно");
        return;
      }

      // Facts
      const factsTexts = visibleFacts.map(f => f.text);

      // Call API
      setSystemStatusMessage("Отправка запроса в Gemini ИИ и генерация ответа...");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: characterData,
          messages: updatedHistory,
          sharedFacts: factsTexts,
          isVoice: isVoiceMode || isFromCall,
          isCall: isCallMode,
          isLive: isLiveModeMessage,
          attachedImage: imageToSend,
          userProfile,
          groupParticipants: groupPartNames,
          aiMode: aiMode,
          storyLog: storyLog
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      setSystemStatusMessage("Обновление шкал отношений и извлечение слухов...");
      const data = await response.json();

      // Form model message
      const modelMessage: Message = {
        id: `model-${Date.now()}`,
        role: "model",
        senderId: responder.id,
        content: data.reply || "*(Молчание собеседника...)*",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isVoice: isVoiceMode || isFromCall,
        isCall: isCallMode,
        isLive: isLiveModeMessage,
        image: data.generatedImage || undefined
      };

      // Set new chat state
      setMessages(prev => ({
        ...prev,
        [selectedChatId]: [...updatedHistory, modelMessage]
      }));

      // Store quick replies
      if (data.quickReplies && Array.isArray(data.quickReplies)) {
        setQuickReplies(prev => ({
          ...prev,
          [selectedChatId]: data.quickReplies
        }));
      }

      // Update character states dynamically from communication
      setCharacters(prev => prev.map(c => {
        if (c.id === responder.id) {
          const status = data.dynamicStatus || c.status;
          const attitude = data.dynamicAttitude || c.attitude;
          
          let scales = c.scales ? { ...c.scales } : { trust: 50, love: 0, lust: 0, anger: 0, intimacy: 20 };
          if (data.scaleAdjustments) {
            const parseAdjustment = (val: any): number => {
              const parsed = parseInt(val);
              return isNaN(parsed) ? 0 : Math.round(parsed / 3); // 3x slower progression
            };
            const currentTrust = (scales.trust === undefined || isNaN(scales.trust)) ? 50 : scales.trust;
            const currentLove = (scales.love === undefined || isNaN(scales.love)) ? 0 : scales.love;
            const currentLust = (scales.lust === undefined || isNaN(scales.lust)) ? 0 : scales.lust;
            const currentAnger = (scales.anger === undefined || isNaN(scales.anger)) ? 0 : scales.anger;
            const currentIntimacy = (scales.intimacy === undefined || isNaN(scales.intimacy)) ? (c.id === "max" ? 80 : 20) : scales.intimacy;

            scales.trust = Math.min(100, Math.max(0, currentTrust + parseAdjustment(data.scaleAdjustments.trust)));
            scales.love = Math.min(100, Math.max(0, currentLove + parseAdjustment(data.scaleAdjustments.love)));
            scales.lust = Math.min(100, Math.max(0, currentLust + parseAdjustment(data.scaleAdjustments.lust)));
            scales.anger = Math.min(100, Math.max(0, currentAnger + parseAdjustment(data.scaleAdjustments.anger)));
            scales.intimacy = Math.min(100, Math.max(0, currentIntimacy + parseAdjustment(data.scaleAdjustments.intimacy)));
          }

          let ballFullness = c.ballFullness;
          if (data.ballFullness !== undefined) {
            ballFullness = Math.min(100, Math.max(0, parseInt(data.ballFullness as any) || 0));
          } else if (c.ballFullness !== undefined) {
            let increment = 2;
            if (c.id === "artem") increment = 8;
            else if (c.id === "neighbor") increment = 7;
            else if (c.id === "colleague") increment = 5;
            else if (c.id === "brother") increment = 6;
            else if (c.id === "max") increment = 4;
            else if (c.id === "father") increment = 3;
            else if (c.id === "semenych") increment = 2;
            else if (c.id === "mihalych") increment = 1;
            else if (c.id === "grandfather") increment = 1;
            
            ballFullness = Math.min(100, c.ballFullness + increment);
          }

          const ejacOnPhotoAdj = parseInt(data.ejaculatedOnPhotoAdjustment as any) || 0;
          const ejacInsideAdj = parseInt(data.ejaculatedInsideAdjustment as any) || 0;
          const ejaculatedOnPhoto = (c.ejaculatedOnPhoto || 0) + ejacOnPhotoAdj;
          const ejaculatedInside = (c.ejaculatedInside || 0) + ejacInsideAdj;
          const penisSizeDiscovered = data.penisSizeDiscovered ? true : c.penisSizeDiscovered;

          // Intimate counters & Sex count
          const ejaculatedVagina = (c.ejaculatedVagina || 0) + (parseInt(data.ejaculatedVagina as any) || 0);
          const ejaculatedAnus = (c.ejaculatedAnus || 0) + (parseInt(data.ejaculatedAnus as any) || 0);
          const ejaculatedMouth = (c.ejaculatedMouth || 0) + (parseInt(data.ejaculatedMouth as any) || 0);
          const sexCount = (c.sexCount || 0) + (parseInt(data.sexCountIncrement as any) || 0);

          return {
            ...c,
            status,
            attitude,
            scales,
            ballFullness,
            ejaculatedOnPhoto,
            ejaculatedInside,
            penisSizeDiscovered,
            ejaculatedVagina,
            ejaculatedAnus,
            ejaculatedMouth,
            sexCount
          };
        }
        return c;
      }));

      // Extract facts/gossips dynamically
      if (data.newSharedFacts && Array.isArray(data.newSharedFacts) && data.newSharedFacts.length > 0) {
        const addedFacts: SharedFact[] = [];
        data.newSharedFacts.forEach((factText: string) => {
          if (!sharedFacts.some(f => f.text.toLowerCase().trim() === factText.toLowerCase().trim())) {
            addedFacts.push({
              id: `extracted-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              text: factText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sourceCharacterId: responder.id,
              group: responder.group,
              knownBy: [responder.id]
            });
          }
        });

        if (addedFacts.length > 0) {
          setSharedFacts(prev => propagateRumors([...addedFacts, ...prev], characters));
          setGossipNotification(`🤫 Слух утек в память: "${addedFacts[0].text}"`);
          setTimeout(() => setGossipNotification(null), 5000);
        } else {
          setSharedFacts(prev => propagateRumors(prev, characters));
        }
      } else {
        setSharedFacts(prev => propagateRumors(prev, characters));
      }

    } catch (err: any) {
      console.warn("Chat API error:", err?.message || err);
      setSystemError(err?.message || String(err));
      
      const errText = isFromCall 
        ? `[Связь прервалась из-за помех на линии с ${activeChar?.name || "собеседником"}]`
        : `*(Сообщение не доставлено. Кажется, пропала связь с собеседником. Ошибка ИИ сохранена в логах.)*`;
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "model",
        content: errText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => ({
        ...prev,
        [selectedChatId]: [...updatedHistory, errorMessage]
      }));
    } finally {
      setIsLoading(false);
      setIsVoiceMode(false);
    }
  };

  // Compile Dynamic Storyteller Summary
  const refreshStoryteller = async (directive?: string) => {
    if (!userProfile) return;
    setIsStoryLoading(true);

    try {
      // Compile messages summary (recent conversations overview)
      let summaryText = "";
      Object.entries(messages as Record<string, Message[]>).forEach(([chatId, list]) => {
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

      const response = await fetch("/api/storyteller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile,
          sharedFacts,
          messagesSummary: summaryText || "Диалоги пока пусты. Сюжет на этапе знакомства.",
          customDirective: directive,
          aiMode: aiMode
        })
      });

      if (!response.ok) throw new Error("Storyteller failed");

      const data = await response.json();
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
      console.log("Storyteller communication handled.");
      setGossipNotification("⚠️ Не удалось связаться с Рассказчиком. Попробуйте еще раз.");
      setTimeout(() => setGossipNotification(null), 4000);
    } finally {
      setIsStoryLoading(false);
    }
  };

  // Start Voice Call or Live Meeting Simulation
  const handleStartCall = (type: "phone" | "in_person" = "phone") => {
    if (!activeChar) return;

    // Also sync our communication mode
    handleSwitchCommMode(type === "in_person" ? "live" : "call");

    setActiveCall({
      characterId: activeChar.id,
      status: "calling",
      duration: 0,
      type
    });

    // Simulate connection
    setTimeout(() => {
      setActiveCall(prev => {
        if (!prev) return null;
        return { ...prev, status: "connected" };
      });
    }, type === "in_person" ? 1500 : 2500);
  };

  // Hangup call / End in-person conversation
  const handleHangupCall = () => {
    if (activeCall) {
      const textDuration = `${Math.floor(activeCall.duration / 60)}м ${activeCall.duration % 60}с`;
      const isLive = activeCall.type === "in_person";
      const callLog: Message = {
        id: `call-log-${Date.now()}`,
        role: "model",
        content: isLive
          ? `🗣️ Личный разговор вживую завершен. Длительность беседы: ${textDuration}`
          : `📞 Телефонный разговор завершен. Длительность: ${textDuration}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCall: !isLive,
        isLive: isLive
      };

      setMessages(prev => ({
        ...prev,
        [selectedChatId]: [...(prev[selectedChatId] || []), callLog]
      }));

      // Revert back to chat mode after ending the call overlay
      handleSwitchCommMode("chat");

      setActiveCall(null);
    }
  };

  // Suggested greeting trigger (Character initiates, AI answers for Heroine, then Character responds)
  const handleSendSuggestedGreeting = async (greetingText: string) => {
    if (isLoading || !activeChar || !userProfile) return;

    setIsLoading(true);
    setSystemError(null);
    setSystemStatusMessage("Персонаж начинает диалог...");

    // 1. Create Character Message (as model role)
    const charMsg: Message = {
      id: `char-start-${Date.now()}`,
      role: "model",
      senderId: activeChar.id,
      content: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Append character starting message to local state
    const currentHistory = messages[selectedChatId] || [];
    const withCharMsgHistory = [...currentHistory, charMsg];
    
    setMessages(prev => ({
      ...prev,
      [selectedChatId]: withCharMsgHistory
    }));

    setSystemStatusMessage("Генерация ответа главной героини...");

    try {
      // 2. Fetch heroine's reply from API
      const characterData = {
        id: activeChar.id,
        name: activeChar.name,
        role: activeChar.role,
        personality: activeChar.personality,
        speechStyle: activeChar.speechStyle,
        attitude: activeChar.attitude,
        scales: activeChar.scales,
        fetishes: activeChar.fetishes,
        inclinations: activeChar.inclinations
      };

      const response = await fetch("/api/generate-heroine-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: characterData,
          greetingText: greetingText,
          userProfile
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка генерации ответа героини: ${response.status}`);
      }

      const data = await response.json();
      const heroineText = data.reply || "*(Задумалась...)*";

      // 3. Create Heroine Message (as user role)
      const heroineMsg: Message = {
        id: `heroine-reply-${Date.now()}`,
        role: "user",
        content: heroineText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const withHeroineHistory = [...withCharMsgHistory, heroineMsg];
      setMessages(prev => ({
        ...prev,
        [selectedChatId]: withHeroineHistory
      }));

      // 4. Trigger Character's Reaction to Heroine's Reply!
      setSystemStatusMessage(`Подготовка ответа ${activeChar.name}...`);
      
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: characterData,
          messages: withHeroineHistory,
          sharedFacts: visibleFacts.map(f => f.text),
          isVoice: false,
          isCall: false,
          isLive: false,
          userProfile,
          aiMode: aiMode,
          storyLog: storyLog
        })
      });

      if (!chatResponse.ok) {
        throw new Error(`Ошибка ответа персонажа: ${chatResponse.status}`);
      }

      const chatData = await chatResponse.json();

      // Create Character's Reply Message
      const modelMessage: Message = {
        id: `model-${Date.now()}`,
        role: "model",
        senderId: activeChar.id,
        content: chatData.reply || "*(Молчание собеседника...)*",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        image: chatData.generatedImage || undefined
      };

      setMessages(prev => ({
        ...prev,
        [selectedChatId]: [...withHeroineHistory, modelMessage]
      }));

      // Update character states dynamically
      setCharacters(prev => prev.map(c => {
        if (c.id === activeChar.id) {
          const status = chatData.dynamicStatus || c.status;
          const attitude = chatData.dynamicAttitude || c.attitude;
          
          let scales = c.scales ? { ...c.scales } : { trust: 50, love: 0, lust: 0, anger: 0, intimacy: 20 };
          if (chatData.scaleAdjustments) {
            const parseAdjustment = (val: any): number => {
              const parsed = parseInt(val);
              return isNaN(parsed) ? 0 : Math.round(parsed / 3); // 3x slower progression
            };
            const currentTrust = (scales.trust === undefined || isNaN(scales.trust)) ? 50 : scales.trust;
            const currentLove = (scales.love === undefined || isNaN(scales.love)) ? 0 : scales.love;
            const currentLust = (scales.lust === undefined || isNaN(scales.lust)) ? 0 : scales.lust;
            const currentAnger = (scales.anger === undefined || isNaN(scales.anger)) ? 0 : scales.anger;
            const currentIntimacy = (scales.intimacy === undefined || isNaN(scales.intimacy)) ? (c.id === "max" ? 80 : 20) : scales.intimacy;

            scales.trust = Math.min(100, Math.max(0, currentTrust + parseAdjustment(chatData.scaleAdjustments.trust)));
            scales.love = Math.min(100, Math.max(0, currentLove + parseAdjustment(chatData.scaleAdjustments.love)));
            scales.lust = Math.min(100, Math.max(0, currentLust + parseAdjustment(chatData.scaleAdjustments.lust)));
            scales.anger = Math.min(100, Math.max(0, currentAnger + parseAdjustment(chatData.scaleAdjustments.anger)));
            scales.intimacy = Math.min(100, Math.max(0, currentIntimacy + parseAdjustment(chatData.scaleAdjustments.intimacy)));
          }

          let ballFullness = c.ballFullness;
          if (chatData.ballFullness !== undefined) {
            ballFullness = Math.min(100, Math.max(0, parseInt(chatData.ballFullness as any) || 0));
          } else if (c.ballFullness !== undefined) {
            let increment = 2;
            if (c.id === "artem") increment = 8;
            else if (c.id === "neighbor") increment = 7;
            else if (c.id === "colleague") increment = 5;
            else if (c.id === "brother") increment = 6;
            else if (c.id === "max") increment = 4;
            else if (c.id === "father") increment = 3;
            else if (c.id === "semenych") increment = 2;
            else if (c.id === "mihalych") increment = 1;
            else if (c.id === "grandfather") increment = 1;
            
            ballFullness = Math.min(100, c.ballFullness + increment);
          }

          const ejacOnPhotoAdj = parseInt(chatData.ejaculatedOnPhotoAdjustment as any) || 0;
          const ejacInsideAdj = parseInt(chatData.ejaculatedInsideAdjustment as any) || 0;
          const ejaculatedOnPhoto = (c.ejaculatedOnPhoto || 0) + ejacOnPhotoAdj;
          const ejaculatedInside = (c.ejaculatedInside || 0) + ejacInsideAdj;
          const penisSizeDiscovered = chatData.penisSizeDiscovered ? true : c.penisSizeDiscovered;

          // Intimate counters & Sex count
          const ejaculatedVagina = (c.ejaculatedVagina || 0) + (parseInt(chatData.ejaculatedVagina as any) || 0);
          const ejaculatedAnus = (c.ejaculatedAnus || 0) + (parseInt(chatData.ejaculatedAnus as any) || 0);
          const ejaculatedMouth = (c.ejaculatedMouth || 0) + (parseInt(chatData.ejaculatedMouth as any) || 0);
          const sexCount = (c.sexCount || 0) + (parseInt(chatData.sexCountIncrement as any) || 0);

          return {
            ...c,
            status,
            attitude,
            scales,
            ballFullness,
            ejaculatedOnPhoto,
            ejaculatedInside,
            penisSizeDiscovered,
            ejaculatedVagina,
            ejaculatedAnus,
            ejaculatedMouth,
            sexCount
          };
        }
        return c;
      }));

    } catch (err: any) {
      console.warn("Suggested greeting flow error:", err);
      setSystemError(err?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-fill active chat messages list
  const currentChatMessages = useMemo(() => {
    return messages[selectedChatId] || [];
  }, [messages, selectedChatId]);

  // Filter messages based on active communication mode for separate feeds
  const displayedChatMessages = useMemo(() => {
    return currentChatMessages.filter(msg => {
      if (currentCommMode === "live") {
        return msg.isLive === true;
      } else if (currentCommMode === "call") {
        return msg.isCall === true;
      } else {
        // chat mode
        return !msg.isLive && !msg.isCall;
      }
    });
  }, [currentChatMessages, currentCommMode]);

  // Determine if profile setup is required
  if (!userProfile) {
    return (
      <div id="profile-setup-screen" className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex items-center justify-center p-4 relative overflow-hidden bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:24px_24px]">
        <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm z-0"></div>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-xl bg-neutral-900 border border-neutral-800 p-6 sm:p-8 rounded-3xl shadow-2xl relative z-10 overflow-hidden"
        >
          {isSavingProfile ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-8 text-center">
              <div className="relative">
                {/* Outer spin halo */}
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                {/* Inner reverse spin pulse */}
                <div className="absolute inset-2 border-2 border-purple-500/15 border-b-purple-500 rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]"></div>
                <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-400 text-xs animate-pulse">ИИ</div>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-extrabold text-neutral-100 animate-pulse tracking-wide">
                  Инициализация Сюжетной Линии
                </h2>
                <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                  Пожалуйста, подождите. ИИ-система подготавливает вашу личность и рассчитывает стартовые параметры...
                </p>
              </div>

              {/* Stages Stagger Progress */}
              <div className="w-full max-w-sm bg-neutral-950/60 border border-neutral-800 p-5 rounded-2xl space-y-4 text-left">
                {[
                  { id: 1, title: "Чтение анкеты и характера ГГ", desc: "Анализ сильных и слабых сторон вашей личности" },
                  { id: 2, title: "Синхронизация уровня вожделения", desc: "Персонажи изучают вашу внешность и параметры" },
                  { id: 3, title: "Генерация стартового сюжета", desc: "Построение связей и подготовка истории" },
                  { id: 4, title: "Запуск игрового мира", desc: "Инициализация 21+ интерактивного окружения" }
                ].map((stage) => {
                  const isActive = setupStage === stage.id;
                  const isCompleted = setupStage > stage.id;
                  return (
                    <div key={stage.id} className="flex items-start gap-3 transition-opacity duration-300">
                      <div className="mt-0.5 shrink-0">
                        {isCompleted ? (
                          <div className="w-5 h-5 bg-green-500/20 border border-green-500 text-green-400 rounded-full flex items-center justify-center text-[10px] font-black">✓</div>
                        ) : isActive ? (
                          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <div className="w-5 h-5 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-[9px] font-bold text-neutral-600">{stage.id}</div>
                        )}
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold ${isActive ? "text-indigo-400 animate-pulse" : isCompleted ? "text-neutral-300 line-through opacity-75" : "text-neutral-500"}`}>
                          {stage.title}
                        </h4>
                        <p className="text-[10px] text-neutral-500 leading-tight">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Glowing Accents */}
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>

              <div className="text-center mb-6 space-y-2">
                <div className="mx-auto w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/30">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                  Инициализация Вашей Личности
                </h1>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                  Перед началом ролевой переписки настройте своего главного героя. Персонажи ИИ будут реагировать на ваше имя, пол, возраст и черты характера!
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Ваше имя (Никнейм) *</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Например: Влад, Кристина"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Возраст *</label>
                <input
                  type="number"
                  required
                  min={18}
                  max={99}
                  value={profileAge}
                  onChange={(e) => setProfileAge(parseInt(e.target.value) || 20)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Ваш пол *</label>
              <div className="flex items-center gap-2.5 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 font-semibold text-xs select-none">
                <span className="text-rose-500 font-extrabold text-sm">♀</span> Женский (Сюжет разыгрывается от лица девушки)
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-neutral-400 uppercase">Уровень привлекательности главной героини: <span className="text-rose-400 font-extrabold">{profileAttractiveness}%</span></label>
                <span className="text-[10px] text-rose-300 font-semibold">
                  {profileAttractiveness >= 85 ? "🔥 Сногсшибательная" : profileAttractiveness >= 65 ? "✨ Привлекательная" : profileAttractiveness >= 40 ? "😊 Обычная" : "🥶 Невзрачная"}
                </span>
              </div>
              <div className="flex items-center gap-4 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profileAttractiveness}
                  onChange={(e) => setProfileAttractiveness(parseInt(e.target.value))}
                  className="flex-1 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs font-black text-rose-400 w-8 text-right">{profileAttractiveness}%</span>
              </div>
              <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
                Позволяет наглядно настроить базовое вожделение и силу реакций всех мужских персонажей в игре на вашу внешность.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Черты характера (через запятую) *</label>
              <input
                type="text"
                required
                value={profileTraits}
                onChange={(e) => setProfileTraits(e.target.value)}
                placeholder="Саркастичный, скромный, прямолинейный, отзывчивый"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Короткая Биография / Род Деятельности *</label>
              <textarea
                required
                rows={3}
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                placeholder="Студент-программист, подрабатываю в кофейне, живу отдельно от родителей за городом."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Photo Upload Box */}
            <div className="border-t border-neutral-800/60 pt-4 space-y-3">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Фотография вашего героя *</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Загрузите фото для автоматической оценки ИИ. <strong className="text-amber-400">Без фото вожделение персонажей начнется с 0%</strong> и не будет расти, пока вы не загрузите снимок!
              </p>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 hover:border-indigo-500/50 bg-neutral-950/40 p-5 rounded-2xl transition-all relative">
                {isEvaluatingPhoto ? (
                  <div className="py-6 flex flex-col items-center space-y-3">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-neutral-300 font-bold animate-pulse">ИИ изучает контуры лица и тела...</p>
                    <p className="text-[9px] text-neutral-500 text-center">Это займет всего пару секунд для точной оценки</p>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUploadAndEvaluation(file);
                      }}
                      className="hidden"
                      id="initial-photo-upload"
                    />
                    {profilePhoto ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border border-neutral-700 shadow-md">
                          <img src={profilePhoto} alt="Hero avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex gap-2">
                          <label
                            htmlFor="initial-photo-upload"
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-xl cursor-pointer transition-all"
                          >
                            Заменить фото
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setProfilePhoto(null);
                              // Reset parameters
                              setProfileFace("Привлекательное, чистое лицо");
                              setProfileChest("Упругая, округлая грудь");
                              setProfileWaist("Тонкая талия, плоский живот");
                              setProfileHips("Выразительные, округлые бёдра");
                              setProfileIntimate("Аккуратные, ухоженные интимные зоны");
                              setProfileLegs("Стройные, длинные ноги");
                              setProfileOverall("Здоровое, спортивное и ухоженное тело без уродств");
                            }}
                            className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-300 text-xs font-bold rounded-xl cursor-pointer border border-red-900/30 transition-all"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="initial-photo-upload"
                        className="w-full flex flex-col items-center justify-center py-4 cursor-pointer"
                      >
                        <Upload className="w-8 h-8 text-neutral-600 mb-2 group-hover:text-indigo-400" />
                        <span className="text-xs font-bold text-neutral-300">Нажмите для выбора снимка</span>
                        <span className="text-[10px] text-neutral-500 mt-1">Поддерживаются PNG, JPG до 5МБ</span>
                      </label>
                    )}
                  </>
                )}
              </div>

              {evaluationError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-400 leading-relaxed text-left">
                  ⚠️ {evaluationError}
                </div>
              )}
            </div>

            {/* Appearance Section */}
            <div className="border-t border-neutral-800/60 pt-4 space-y-4 text-left">
              <div className="flex items-center gap-1.5 text-rose-400">
                <span>🍒</span>
                <span className="text-xs font-bold uppercase tracking-wider">Параметры внешности героини (21+)</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Настройте детальные параметры внешности вашей героини. Возле каждого параметра находится числовой слайдер (рейтинг привлекательности данной части тела от 0 до 100). Итоговый <strong className="text-rose-300">уровень привлекательности</strong> вычисляется автоматически по формуле среднего арифметического.
              </p>

              <div className="space-y-3.5">
                {/* Лицо */}
                <div className="bg-neutral-950/45 border border-neutral-850 p-3.5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-neutral-300 uppercase tracking-wide">👩 Лицо</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-md font-bold">{getPartRatingText(faceScore)}</span>
                      <span className="text-xs font-black text-rose-400">{faceScore}/100</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <input
                      type="text"
                      required
                      value={profileFace}
                      onChange={(e) => setProfileFace(e.target.value)}
                      placeholder="Например: Милое личико, чувственные губы, аккуратный носик"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={faceScore}
                        onChange={(e) => setFaceScore(parseInt(e.target.value))}
                        className="flex-1 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Сиськи/Грудь */}
                <div className="bg-neutral-950/45 border border-neutral-850 p-3.5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-neutral-300 uppercase tracking-wide">🍈 Сиськи / Грудь</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-md font-bold">{getPartRatingText(chestScore)}</span>
                      <span className="text-xs font-black text-rose-400">{chestScore}/100</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <input
                      type="text"
                      required
                      value={profileChest}
                      onChange={(e) => setProfileChest(e.target.value)}
                      placeholder="Например: Упругая грудь 3-го размера, розовые соски"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={chestScore}
                        onChange={(e) => setChestScore(parseInt(e.target.value))}
                        className="flex-1 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Талия */}
                <div className="bg-neutral-950/45 border border-neutral-850 p-3.5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-neutral-300 uppercase tracking-wide">⏳ Талия</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-md font-bold">{getPartRatingText(waistScore)}</span>
                      <span className="text-xs font-black text-rose-400">{waistScore}/100</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <input
                      type="text"
                      required
                      value={profileWaist}
                      onChange={(e) => setProfileWaist(e.target.value)}
                      placeholder="Например: Тонкая осиная талия, плоский животик, пирсинг"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={waistScore}
                        onChange={(e) => setWaistScore(parseInt(e.target.value))}
                        className="flex-1 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Бедра */}
                <div className="bg-neutral-950/45 border border-neutral-850 p-3.5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-neutral-300 uppercase tracking-wide">🍑 Бёдра</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-md font-bold">{getPartRatingText(hipsScore)}</span>
                      <span className="text-xs font-black text-rose-400">{hipsScore}/100</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <input
                      type="text"
                      required
                      value={profileHips}
                      onChange={(e) => setProfileHips(e.target.value)}
                      placeholder="Например: Широкие, округлые аппетитные бёдра"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={hipsScore}
                        onChange={(e) => setHipsScore(parseInt(e.target.value))}
                        className="flex-1 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Вагина/Пах */}
                <div className="bg-neutral-950/45 border border-neutral-850 p-3.5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-neutral-300 uppercase tracking-wide">🐱 Вагина / Пах</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-md font-bold">{getPartRatingText(vaginaScore)}</span>
                      <span className="text-xs font-black text-rose-400">{vaginaScore}/100</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <input
                      type="text"
                      required
                      value={profileVagina}
                      onChange={(e) => {
                        setProfileVagina(e.target.value);
                        setProfileIntimate(e.target.value); // Sync for legacy
                      }}
                      placeholder="Например: Нежная, гладко выбритая узкая вагина"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={vaginaScore}
                        onChange={(e) => setVaginaScore(parseInt(e.target.value))}
                        className="flex-1 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Анус/Попа */}
                <div className="bg-neutral-950/45 border border-neutral-850 p-3.5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-neutral-300 uppercase tracking-wide">🍩 Анус / Попа</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-md font-bold">{getPartRatingText(anusScore)}</span>
                      <span className="text-xs font-black text-rose-400">{anusScore}/100</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <input
                      type="text"
                      required
                      value={profileAnus}
                      onChange={(e) => setProfileAnus(e.target.value)}
                      placeholder="Например: Подтянутая круглая попка, отбеленный анус"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={anusScore}
                        onChange={(e) => setAnusScore(parseInt(e.target.value))}
                        className="flex-1 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Ноги */}
                <div className="bg-neutral-950/45 border border-neutral-850 p-3.5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-neutral-300 uppercase tracking-wide">🦵 Ноги</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-md font-bold">{getPartRatingText(legsScore)}</span>
                      <span className="text-xs font-black text-rose-400">{legsScore}/100</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <input
                      type="text"
                      required
                      value={profileLegs}
                      onChange={(e) => setProfileLegs(e.target.value)}
                      placeholder="Например: Длинные стройные ножки, нежная кожа"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={legsScore}
                        onChange={(e) => setLegsScore(parseInt(e.target.value))}
                        className="flex-1 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-950/45 border border-neutral-850 p-3.5 rounded-2xl">
                <label className="block text-[10px] font-bold text-neutral-400 mb-1 uppercase">Общее описание тела & Здоровье *</label>
                <textarea
                  required
                  rows={2}
                  value={profileOverall}
                  onChange={(e) => setProfileOverall(e.target.value)}
                  placeholder="Например: Спортивное телосложение, ухоженная кожа, без дефектов"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* AI Detailed Analysis under physical traits */}
            {(profileDetailedAnalysis || profileImageSceneDescription || profilePlotContext) && (
              <div className="border-t border-neutral-800/60 pt-4 space-y-4 text-left">
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <span>🔮</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Углубленный ИИ-Анализ Внешности и Сюжета</span>
                </div>
                
                <div className="space-y-3">
                  {profileDetailedAnalysis && (
                    <div className="bg-indigo-950/25 border border-indigo-900/30 p-3.5 rounded-xl space-y-1">
                      <span className="font-bold text-[9px] text-indigo-300 uppercase tracking-wider block">🎨 Психофизический Анализ & Харизма:</span>
                      <p className="text-neutral-300 text-xs leading-relaxed whitespace-pre-wrap">{profileDetailedAnalysis}</p>
                    </div>
                  )}

                  {profileImageSceneDescription && (
                    <div className="bg-purple-950/25 border border-purple-900/30 p-3.5 rounded-xl space-y-1">
                      <span className="font-bold text-[9px] text-purple-300 uppercase tracking-wider block">📸 Описание сцены & одежды на фото:</span>
                      <p className="text-neutral-300 text-xs leading-relaxed whitespace-pre-wrap">{profileImageSceneDescription}</p>
                    </div>
                  )}

                  {profilePlotContext && (
                    <div className="bg-rose-950/25 border border-rose-900/30 p-3.5 rounded-xl space-y-1">
                      <span className="font-bold text-[9px] text-rose-300 uppercase tracking-wider block">📖 Влияние на Сюжет & Реакции Окружающих:</span>
                      <p className="text-neutral-300 text-xs leading-relaxed whitespace-pre-wrap">{profilePlotContext}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {profileFormError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-semibold text-center select-none animate-pulse">
                ⚠️ {profileFormError}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className={`w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-purple-950/40 transition-all flex items-center justify-center gap-2 ${
                  isSavingProfile ? "opacity-75 cursor-not-allowed" : "cursor-pointer active:scale-[0.99]"
                }`}
              >
                {isSavingProfile ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Инициализация сюжетной линии...</span>
                  </>
                ) : (
                  <>
                    <span>Начать Сюжетную Игру 🚀</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </motion.div>
      </div>
    );
  }

  return (
    <div id="app-root" className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col overflow-hidden relative">
      
      {/* Visual Overlay Notifications */}
      <AnimatePresence>
        {gossipNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 text-neutral-950 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md max-w-md border border-amber-300 font-semibold text-xs"
          >
            <Radio className="w-5 h-5 animate-pulse shrink-0" />
            <div>{gossipNotification}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20 shrink-0">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span className="hidden xs:inline">Интерактивная</span> ролевая переписка
              <span className="hidden sm:inline-block text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono font-medium">v2.0</span>
            </h1>
            <p className="hidden sm:flex text-[10px] text-neutral-400 items-center gap-1.5 select-none mt-0.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isLoading ? "bg-amber-400 animate-ping" : "bg-emerald-500 animate-pulse"}`}></span>
              <span>{isLoading ? `ИИ-Анализ и Генерация...` : "Система: Активна и в порядке"}</span>
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <select
              value={aiMode}
              onChange={(e) => setAiMode(e.target.value as any)}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg px-2 py-1.5 text-[10px] sm:text-xs font-semibold text-neutral-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              title="Режим искусственного интеллекта"
            >
              <option value="standard">🤖 Обычный (Flash)</option>
              <option value="high_thinking">🧠 Мышление (Pro)</option>
              <option value="low_latency">⚡ Быстрый (Lite)</option>
            </select>
          </div>

          <button
            onClick={openEditProfile}
            title="Ваш Профиль"
            className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold rounded-lg border border-neutral-800 transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Герой: {userProfile?.name}</span>
          </button>

          <button
            onClick={handleResetData}
            title="Начать всё сначала"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Начать заново</span>
          </button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* PANEL 1: Left Column - Character Selection & Settings */}
        <aside className="w-80 border-r border-neutral-800 bg-neutral-900/30 flex flex-col shrink-0 hidden md:flex">
          
          {/* Navigation Tab Header (Inside Sidebar for Desktop) */}
          <div className="p-4 border-b border-neutral-800/60 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
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
              <div className="space-y-1.5">
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
                      onClick={() => {
                        setSelectedChatId(group.id);
                        setActiveTab("chat");
                      }}
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
            <div className="space-y-1.5">
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
                      onSelect={() => {
                        setSelectedChatId(char.id);
                        setActiveTab("chat");
                      }}
                    />
                  );
                })
              )}
            </div>

          </div>

          {/* Quick info panel at bottom of sidebar */}
          <div className="p-4 border-t border-neutral-800/60 bg-neutral-900/10 text-[10px] text-neutral-500 flex flex-col gap-1.5">
            <div className="flex items-center gap-1 text-neutral-400">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-semibold">Персонаж Начинает Вторым</span>
            </div>
            <p>Диалоги теперь чисты по умолчанию. Ваше первое слово и личность игрока задают тон всей ролевой ветке.</p>
          </div>
        </aside>

        {/* PANEL 2: Central Column - Chat View or Scenario deck */}
        <main className="flex-1 flex flex-col bg-neutral-950 overflow-hidden relative">
          
          {/* Mobile Bottom Tab Selection for small screen devices */}
          <div className="md:hidden flex border-b border-neutral-800 p-1 bg-neutral-900/50 shrink-0">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg flex flex-col items-center gap-0.5 transition-all ${
                activeTab === "chat" ? "bg-neutral-800 text-white" : "text-neutral-400"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Чаты</span>
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg flex flex-col items-center gap-0.5 transition-all ${
                activeTab === "map" ? "bg-neutral-800 text-white" : "text-neutral-400"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Карта</span>
            </button>
            <button
              onClick={() => setActiveTab("story")}
              className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg flex flex-col items-center gap-0.5 transition-all ${
                activeTab === "story" ? "bg-neutral-800 text-white" : "text-neutral-400"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Сюжет</span>
            </button>
            <button
              onClick={() => setActiveTab("lore")}
              className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg flex flex-col items-center gap-0.5 transition-all ${
                activeTab === "lore" ? "bg-neutral-800 text-white" : "text-neutral-400"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Сплетни</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg flex flex-col items-center gap-0.5 transition-all ${
                activeTab === "profile" ? "bg-neutral-800 text-white" : "text-neutral-400"
              }`}
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Профиль</span>
            </button>
          </div>

          {activeTab === "chat" ? (
            /* --- ACTIVE VIEW: CHAT INTERFACE --- */
            <div className="flex-1 flex flex-col overflow-hidden relative">
              
              {/* Horizontal Chat Selector for Mobile (visible only on mobile) */}
              <div className="md:hidden flex items-center gap-2.5 p-2 bg-neutral-950 border-b border-neutral-850 overflow-x-auto shrink-0 scrollbar-none select-none">
                {/* Create Actions inside mobile menu */}
                <button
                  onClick={() => openCharacterModal(null)}
                  title="Добавить персонажа"
                  className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-850 flex items-center justify-center text-indigo-400 border border-neutral-800 shrink-0 cursor-pointer active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowGroupModal(true)}
                  title="Создать группу"
                  className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-850 flex items-center justify-center text-indigo-400 border border-neutral-800 shrink-0 cursor-pointer active:scale-95 transition-all"
                >
                  <Users className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-6 bg-neutral-800 shrink-0 mx-1"></div>

                {groupChats.map(group => {
                  const isSelected = group.id === selectedChatId;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setSelectedChatId(group.id)}
                      className={`relative shrink-0 flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-600/15 border border-indigo-500/25 text-white" 
                          : "border border-transparent text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${group.avatarColor} flex items-center justify-center text-white font-extrabold text-[10px] shadow-sm`}>
                        {group.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[8px] max-w-[45px] truncate font-semibold mt-0.5">
                        {group.name}
                      </span>
                    </button>
                  );
                })}

                {characters.map(char => {
                  const isSelected = char.id === selectedChatId;
                  return (
                    <button
                      key={char.id}
                      onClick={() => setSelectedChatId(char.id)}
                      className={`relative shrink-0 flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-600/15 border border-indigo-500/25 text-white" 
                          : "border border-transparent text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${char.avatarColor} flex items-center justify-center text-white font-bold text-[12px] shadow-sm relative`}>
                        {char.name[0]}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-neutral-900 ${
                          char.status === "В сети" ? "bg-emerald-500" :
                          char.status === "Занят" ? "bg-amber-500" :
                          char.status === "Играет" ? "bg-purple-500" :
                          char.status === "Печатает..." ? "bg-cyan-500 animate-pulse" : "bg-neutral-500"
                        }`}></span>
                      </div>
                      <span className="text-[8px] max-w-[45px] truncate font-semibold mt-0.5">
                        {char.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {/* Chat Header */}
              <div className="px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {activeGroup ? (
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${activeGroup.avatarColor} flex items-center justify-center text-white font-extrabold text-sm shadow-md`}>
                      {activeGroup.name.substring(0, 2).toUpperCase()}
                    </div>
                  ) : (
                    activeChar && (
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${activeChar.avatarColor} flex items-center justify-center text-white font-bold text-base shadow-md`}>
                        {activeChar.name[0]}
                      </div>
                    )
                  )}

                  <div className="min-w-0">
                    <h2 className="font-bold text-xs text-neutral-50 flex items-center gap-1.5">
                      {activeGroup ? activeGroup.name : activeChar?.name}
                      <span className="text-[9px] px-2 py-0.5 bg-neutral-850 border border-neutral-800 text-neutral-400 rounded-full font-normal">
                        {activeGroup ? "Групповой чат" : activeChar?.role}
                      </span>
                    </h2>
                    
                    <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                      {activeGroup ? (
                        <>
                          <Users className="w-3 h-3 text-neutral-500 shrink-0" />
                          <span className="truncate">Участники: {activeGroupParticipants.map(p => p.name).join(", ")}</span>
                        </>
                      ) : (
                        activeChar && (
                          <>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>{activeChar.status}</span>
                            <span className="text-neutral-700">•</span>
                            <span className="text-indigo-400 font-semibold">{activeChar.attitude}</span>
                          </>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowChatSwitcherModal(true)}
                    className="px-2.5 py-1.5 sm:px-3 bg-indigo-600/15 border border-indigo-500/30 hover:bg-indigo-600/25 text-indigo-400 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold select-none transition-all text-[11px] sm:text-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Все чаты</span>
                    <span className="inline xs:hidden">Чаты</span>
                  </button>

                  {activeChar && (
                    <>
                      {/* Dossier Button */}
                      <button
                        onClick={() => setShowCharInfoModal(true)}
                        title={`Показать досье и характеристики ${activeChar.name}`}
                        className="px-2.5 py-1.5 bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/35 text-indigo-400 hover:text-indigo-300 rounded-xl transition-all cursor-pointer flex items-center gap-1 font-semibold text-[11px] sm:text-xs select-none animate-pulse"
                      >
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Досье</span>
                      </button>

                      {/* Thoughts Button */}
                      <button
                        onClick={handleFetchThoughts}
                        title={`Узнать мысли и скрытые мотивы ${activeChar.name}`}
                        className="px-2.5 py-1.5 bg-purple-600/15 hover:bg-purple-600/30 border border-purple-500/35 text-purple-400 hover:text-purple-300 rounded-xl transition-all cursor-pointer flex items-center gap-1 font-semibold text-[11px] sm:text-xs select-none"
                      >
                        <Brain className="w-3.5 h-3.5 animate-pulse text-purple-400" />
                        <span>Мысли</span>
                      </button>

                      {/* Call Trigger Button */}
                      <button
                        onClick={() => handleStartCall("phone")}
                        title={`Позвонить ${activeChar.name}`}
                        className="p-2 bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-xl transition-all cursor-pointer"
                      >
                        <Phone className="w-4 h-4" />
                      </button>

                      {/* Live In-person Talk Trigger Button */}
                      <button
                        onClick={() => handleStartCall("in_person")}
                        title={`Разговор вживую с ${activeChar.name} (отыгрыш встречи)`}
                        className="p-2 bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-xl transition-all cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-emerald-400" />
                      </button>

                      {/* Seduction / Intimacy Trigger Button */}
                      <button
                        onClick={() => handleStartSeduction(activeChar)}
                        title={`Интимная близость / Соблазнить ${activeChar.name}`}
                        className="p-2 bg-rose-600/15 hover:bg-rose-600/30 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:text-rose-300 rounded-xl transition-all cursor-pointer animate-pulse"
                      >
                        <Flame className="w-4 h-4 text-rose-400" />
                      </button>

                      {/* Manual Edit Button */}
                      <button
                        onClick={() => openCharacterModal(activeChar.id)}
                        title="Настроить характер персонажа вручную"
                        className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer"
                      >
                        <PenSquare className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Segmented Control for Communication Modes */}
              {(activeGroup || activeChar) && (
                <div className="px-4 py-2 bg-neutral-900/40 border-b border-neutral-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0 select-none">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                      ГДЕ ИДЕТ ОБЩЕНИЕ:
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide border flex items-center gap-1.5 ${
                      currentCommMode === "live"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 animate-pulse"
                        : currentCommMode === "call"
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/25"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/25"
                    }`}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          currentCommMode === "live" ? "bg-emerald-400" : currentCommMode === "call" ? "bg-indigo-400" : "bg-blue-400"
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                          currentCommMode === "live" ? "bg-emerald-500" : currentCommMode === "call" ? "bg-indigo-500" : "bg-blue-500"
                        }`}></span>
                      </span>
                      {activeGroup ? (
                        currentCommMode === "live" ? "Реальная встреча всей компании вживую" : "Групповой чат (Мессенджер)"
                      ) : (
                        currentCommMode === "live" ? "Реальный разговор вживую" : currentCommMode === "call" ? "Телефонный звонок" : "Чат телефона (Мессенджер)"
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800/60 self-start sm:self-auto shadow-inner">
                    <button
                      onClick={() => handleSwitchCommMode("chat")}
                      className={`px-3 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        currentCommMode === "chat"
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/25 shadow-sm font-extrabold"
                          : "text-neutral-500 hover:text-neutral-300 border border-transparent"
                      }`}
                    >
                      <span>📱</span>
                      <span>Чат</span>
                    </button>
                    {!activeGroup && (
                      <button
                        onClick={() => handleSwitchCommMode("call")}
                        className={`px-3 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          currentCommMode === "call"
                            ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/25 shadow-sm font-extrabold"
                            : "text-neutral-500 hover:text-neutral-300 border border-transparent"
                        }`}
                      >
                        <span>📞</span>
                        <span>Звонок</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleSwitchCommMode("live")}
                      className={`px-3 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        currentCommMode === "live"
                          ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/25 shadow-sm font-extrabold"
                          : "text-neutral-500 hover:text-neutral-300 border border-transparent"
                      }`}
                    >
                      <span>👥</span>
                      <span>Вживую</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Message Bubble Viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:16px_16px]">
                
                {/* System Error & Diagnostics Dashboard Banner */}
                {systemError && (
                  <div className="max-w-xl mx-auto my-3 bg-red-950/45 border border-red-900/60 p-4 rounded-2xl text-left space-y-2 backdrop-blur-md relative overflow-hidden shadow-xl shadow-red-950/20">
                    <div className="absolute top-0 right-0 p-2">
                      <button 
                        onClick={() => setSystemError(null)} 
                        className="text-red-400 hover:text-white transition-all cursor-pointer"
                        title="Закрыть уведомление"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-500/10 rounded-xl text-red-400 shrink-0 mt-0.5">
                        <AlertTriangle className="w-5 h-5 animate-bounce" />
                      </div>
                      <div className="space-y-1 pr-6">
                        <h4 className="font-bold text-xs text-red-200">⚠️ Неполадка в ИИ-подсистеме (Диагностика)</h4>
                        <p className="text-[11px] text-neutral-300 leading-relaxed">
                          Нейросеть вернула ошибку при генерации ответа. Проверьте диагностические данные ниже:
                        </p>
                        <div className="mt-2 bg-neutral-950/80 rounded-lg p-2.5 border border-red-900/30 font-mono text-[9px] text-rose-300 select-all overflow-x-auto max-h-32 custom-scrollbar">
                          {systemError}
                        </div>
                        <p className="text-[10px] text-neutral-400 leading-normal pt-1.5">
                          💡 **Что делать:** Вероятно, превышена квота или отсутствует ключ API. Убедитесь, что `GEMINI_API_KEY` задан в панели Secrets в AI Studio.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Character/Group context card */}
                <div className="bg-neutral-900/40 border border-neutral-800/80 p-4 rounded-2xl max-w-xl mx-auto my-3 text-center flex flex-col items-center gap-2 backdrop-blur-md">
                  {activeGroup ? (
                    <>
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${activeGroup.avatarColor} flex items-center justify-center text-white font-extrabold text-lg shadow-lg`}>
                        {activeGroup.name.substring(0, 2).toUpperCase()}
                      </div>
                      <h3 className="font-bold text-sm mt-1">{activeGroup.name}</h3>
                      <p className="text-[10px] text-indigo-400 font-semibold">Групповое сюжетное приключение</p>
                      <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mt-1">
                        Вы общаетесь в группе с несколькими ИИ-персонажами одновременно. Выбирайте, кто ответит на ваше сообщение, или запрашивайте реплики по очереди!
                      </p>
                    </>
                  ) : (
                    activeChar && (
                      <>
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${activeChar.avatarColor} flex items-center justify-center text-white font-extrabold text-lg shadow-lg`}>
                          {activeChar.name[0]}
                        </div>
                        <h3 className="font-bold text-sm mt-1">{activeChar.name}</h3>
                        <p className="text-[10px] text-indigo-400 font-semibold">{activeChar.role} • Круг «{activeChar.group}»</p>
                        <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
                          Подробное досье, фетиши, показатели отношений и интимные характеристики персонажа доступны по кнопке <strong className="text-indigo-400">«Досье»</strong> в верхнем меню чата.
                        </p>
                      </>
                    )
                  )}
                </div>

                {/* Empty State Screen when no messages exist */}
                {displayedChatMessages.length === 0 && (
                  <div className="py-12 max-w-sm mx-auto text-center space-y-4">
                    <div className="p-4 bg-neutral-900/60 rounded-2xl border border-neutral-800">
                      <MessageSquare className="w-8 h-8 text-indigo-400 mx-auto opacity-50 mb-2" />
                      <h4 className="font-bold text-xs text-neutral-200">Диалог пуст</h4>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Все переписки начинаете именно вы. Напишите сообщение ниже или воспользуйтесь подсказками, чтобы завязать беседу.
                      </p>
                    </div>

                    {activeChar && activeChar.suggestedGreetings && activeChar.suggestedGreetings.length > 0 && (
                      <div className="space-y-1.5 text-left">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block text-center">Начать с готовой фразы:</span>
                        <div className="flex flex-col gap-1.5">
                          {activeChar.suggestedGreetings.map((greet, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendSuggestedGreeting(greet)}
                              className="text-left text-xs bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 rounded-xl p-2.5 transition-all font-medium cursor-pointer"
                            >
                              💬 "{greet}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Rendering Chat Messages */}
                 {displayedChatMessages.map((msg) => (
                   <MessageItem
                     key={msg.id}
                     msg={msg}
                     userProfile={userProfile}
                     characters={characters}
                     activeChar={activeChar}
                     activeGroup={activeGroup}
                     onDelete={handleDeleteMessage}
                     onZoomImage={setZoomImageUrl}
                   />
                 ))}

                {/* Bot Typing Simulator & Detailed System Loading Feedback */}
                {isLoading && (
                  <div className="flex justify-start items-center gap-2.5">
                    <div className="bg-neutral-900/90 border border-neutral-800/80 rounded-2xl rounded-bl-none px-4 py-3 shadow-md space-y-2 max-w-sm animate-pulse">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                        </div>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">ИИ-Собеседник генерирует ответ...</span>
                      </div>
                      
                      <p className="text-[11px] text-neutral-300 font-medium">
                        {systemStatusMessage || "Анализ контекста и генерация реплики..."}
                      </p>

                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Attached Image or Video Preview bar */}
              {attachedImage && (
                <div className="px-4 py-2 bg-neutral-900/90 border-t border-neutral-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-neutral-700">
                      {attachedImage.startsWith("data:video/") ? (
                        <video src={attachedImage} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <img src={attachedImage} alt="Preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-neutral-200">
                        {attachedImage.startsWith("data:video/") ? "Видео прикреплено" : "Изображение прикреплено"}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {attachedImage.startsWith("data:video/") ? "Персонаж проанализирует это видео в ответе" : "Персонаж проанализирует это фото в ответе"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

               {/* Chat Input & Controller Bar */}
              <div className="border-t border-neutral-850 bg-neutral-900/30 shrink-0 flex flex-col gap-1">
                
                {/* Narrator/Hero/NPC Writer Mode Toggle */}
                <div className="px-4 py-1.5 bg-neutral-950/40 border-b border-neutral-850 flex items-center justify-between text-[10px] flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-neutral-500 font-bold uppercase select-none">Вы пишете как:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSendAsNarrator(false);
                          setSendAsCharacter(false);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 border ${
                          !sendAsNarrator && !sendAsCharacter
                            ? "bg-indigo-600/15 text-indigo-400 border-indigo-500/30 font-extrabold"
                            : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"
                        }`}
                      >
                        <User className="w-3 h-3" />
                        <span>Герой ({userProfile?.name})</span>
                      </button>

                      {!activeGroup && activeChar && (
                        <button
                          type="button"
                          onClick={() => {
                            setSendAsNarrator(false);
                            setSendAsCharacter(true);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 border ${
                            sendAsCharacter
                              ? "bg-pink-500/15 text-pink-400 border-pink-500/30 font-extrabold"
                              : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"
                          }`}
                        >
                          <span>💬</span>
                          <span>{activeChar.name} (Реплика ИИ)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSendAsNarrator(true);
                          setSendAsCharacter(false);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 border ${
                          sendAsNarrator
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30 font-extrabold"
                            : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"
                        }`}
                      >
                        <span>🎭</span>
                        <span>Рассказчик (Сюжет)</span>
                      </button>
                    </div>
                  </div>
                  {sendAsNarrator && (
                    <span className="text-[9px] text-amber-500 animate-pulse font-semibold">
                      ✨ Свободная корректировка сцены и поведения персонажей!
                    </span>
                  )}
                  {sendAsCharacter && (
                    <span className="text-[9px] text-pink-400 animate-pulse font-semibold">
                      🗣️ Напишите реплику за {activeChar?.name}, чтобы увидеть реакцию героини!
                    </span>
                  )}
                  {!activeGroup && currentCommMode !== "live" && (
                    <button
                      type="button"
                      onClick={handleCreateLiveMeetingEvent}
                      className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-md text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1.5 md:ml-auto"
                      title="Начать личную встречу через Рассказчика"
                    >
                      <span>🤝</span>
                      <span>Устроить встречу вживую</span>
                    </button>
                  )}
                </div>

                {/* Group Chat responder control row */}
                {activeGroup && (
                  <div className="px-4 py-2 bg-neutral-950/80 border-b border-neutral-850 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="text-neutral-400 font-bold uppercase shrink-0">Кто ответит?</span>
                    <button
                      onClick={() => {
                        setGroupResponders({ ...groupResponders, [activeGroup.id]: "auto" });
                      }}
                      className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold cursor-pointer transition-all ${
                        (groupResponders[activeGroup.id] || "auto") === "auto"
                          ? "bg-indigo-600 text-white border-indigo-500"
                          : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200"
                      }`}
                    >
                      🤖 Авто-выбор ИИ
                    </button>

                    {activeGroupParticipants.map(participant => (
                      <button
                        key={participant.id}
                        onClick={() => {
                          setGroupResponders({ ...groupResponders, [activeGroup.id]: participant.id });
                        }}
                        className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold cursor-pointer transition-all ${
                          groupResponders[activeGroup.id] === participant.id
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200"
                        }`}
                      >
                        🗣️ {participant.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Replies Suggestions */}
                {selectedChatId && quickReplies[selectedChatId] && quickReplies[selectedChatId].length > 0 && (
                  <div className="px-4 py-2 bg-neutral-950/20 border-b border-neutral-850/60 flex flex-col gap-1.5 text-xs">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      💡 Предлагаемые быстрые ответы ГГ:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {quickReplies[selectedChatId].map((replyText, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setInputText(replyText)}
                          className="px-3.5 py-2 bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 hover:text-indigo-200 rounded-xl transition-all font-semibold text-xs text-left cursor-pointer truncate max-w-full"
                          title={replyText}
                        >
                          {replyText}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Bar Form */}
                <form onSubmit={(e) => handleSendMessage(e)} className="p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    
                    {/* Photo & Video Attachment Button */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFile}
                      accept="image/*,video/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={triggerImageUpload}
                      title="Прикрепить изображение или видео"
                      className="p-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-indigo-400 rounded-xl border border-neutral-800 transition-all cursor-pointer shrink-0"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>

                    {/* Text Input Container with Dynamic Label */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={
                          sendAsNarrator
                            ? "Опишите событие/действие от лица Рассказчика... (например: 'Внезапно гаснет свет...')"
                            : sendAsCharacter
                              ? `Напишите реплику или действие за ${activeChar?.name}...`
                              : isVoiceMode
                                ? "Запись голосового (введите текст, который вы скажете)..."
                                : activeGroup 
                                  ? `Написать в группу "${activeGroup.name}"...`
                                  : `Написать сообщение для ${activeChar?.name}...`
                        }
                        className={`w-full bg-neutral-900 border ${
                          sendAsNarrator
                            ? "border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/20"
                            : sendAsCharacter
                              ? "border-pink-500/60 focus:border-pink-500 focus:ring-pink-500/20"
                              : isVoiceMode 
                                ? "border-amber-500/50 focus:border-amber-500 focus:ring-amber-500/20" 
                                : "border-neutral-800 focus:border-indigo-500 focus:ring-indigo-500/20"
                        } rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 placeholder-neutral-500 text-neutral-100 font-serif italic`}
                      />
                      
                      {/* Voice or Narrator or Character mode visual icon indicator inside input */}
                      {isVoiceMode && !sendAsNarrator && !sendAsCharacter && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                      )}
                      {sendAsNarrator && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                      )}
                      {sendAsCharacter && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                        </span>
                      )}
                    </div>

                    {/* Toggle Voice Simulation Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSendAsNarrator(false);
                        setSendAsCharacter(false);
                        setIsVoiceMode(!isVoiceMode);
                      }}
                      title={isVoiceMode ? "Переключить на текстовое" : "Переключить на голосовое"}
                      className={`p-3 rounded-xl border transition-all cursor-pointer shrink-0 ${
                        isVoiceMode && !sendAsNarrator && !sendAsCharacter
                          ? "bg-amber-500/10 border-amber-500 text-amber-400 hover:bg-amber-500/20"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-amber-500 hover:bg-neutral-800"
                      }`}
                    >
                      <Mic className="w-5 h-5" />
                    </button>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={(!inputText.trim() && !attachedImage) || isLoading}
                      className={`p-3 text-white rounded-xl shadow-lg transition-all cursor-pointer shrink-0 ${
                        sendAsNarrator
                          ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
                          : sendAsCharacter
                            ? "bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400"
                            : "bg-indigo-600 hover:bg-indigo-500"
                      } disabled:bg-neutral-800 disabled:text-neutral-600`}
                    >
                      {sendAsNarrator ? <span>🎭</span> : sendAsCharacter ? <span>🗣️</span> : <Send className="w-5 h-5" />}
                    </button>

                  </div>

                  {/* Input helper line */}
                  <div className="flex items-center justify-between px-1 text-[9px] text-neutral-500 select-none">
                    <span>
                      {sendAsNarrator
                        ? "🎭 Вмешательство рассказчика: ИИ сразу отреагирует на описанное вами событие!"
                        : sendAsCharacter
                          ? `🗣️ От лица ${activeChar?.name}: Вы пишете его реплику, а Героиня мгновенно ответит!`
                          : isVoiceMode 
                            ? "🎙️ Голосовой режим: Описание окружения и шумов в ответе будет расширенным!" 
                            : "💬 Обычный чат"}
                    </span>
                    <span>Enter для отправки</span>
                  </div>
                </form>

              </div>

            </div>
          ) : activeTab === "map" ? (
            <CityMap 
              currentLocation={currentLocation}
              onTravel={(locId) => {
                setCurrentLocation(locId);
                setGameClock(prev => prev + 1);
              }}
              gameClock={gameClock}
              maxSuspicion={maxSuspicion}
              onUpdateSuspicion={setMaxSuspicion}
              characters={characters}
              sharedFacts={sharedFacts}
              onAddGossip={(text, sourceId) => {
                const newGossip: SharedFact = {
                  id: "fact_" + Date.now(),
                  text,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  sourceCharacterId: sourceId,
                  group: "Все",
                  knownBy: [sourceId]
                };
                setSharedFacts(prev => [newGossip, ...prev]);
              }}
              onResetGame={() => {
                executeResetData();
              }}
            />
          ) : activeTab === "story" ? (
            /* --- ACTIVE VIEW: DYNAMIC STORYTELLER LOGS --- */
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
          ) : activeTab === "lore" ? (
            /* --- ACTIVE VIEW: GOSSIP AND FACT RADAR --- */
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

                        (document.getElementById("manual-fact-input") as HTMLInputElement).value = "";

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
                                        <span className={`w-1.5 h-1.5 rounded-full ${kn.statusColor || "bg-emerald-500"}`}></span>
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
                      {Object.entries(GOSSIP_CONNECTIONS).map(([speakerId, targets]) => {
                        const speaker = characters.find(c => c.id === speakerId);
                        if (!speaker) return null;
                        return (
                          <div key={speakerId} className="space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-neutral-300">
                              <span className={`w-1.5 h-1.5 rounded-full ${speaker.statusColor || "bg-emerald-500"}`}></span>
                              <span>{speaker.name}</span>
                              {(speaker.id === "masha" || speaker.id === "semenych") && (
                                <span className="text-[8px] bg-red-600/15 text-red-400 border border-red-500/25 px-1 py-0.2 rounded font-black">
                                  📢 СПЛЕТНИК
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-1 pl-3 text-[10px] text-neutral-400">
                              {targets.map(tg => {
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
          ) : (
            /* --- ACTIVE VIEW: USER PROFILE & SETTINGS (MOBILE) --- */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-neutral-950">
              <div className="max-w-xl mx-auto space-y-5">
                
                {/* Title */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <User className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold uppercase tracking-wider text-xs">Личный кабинет Героя</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">Профиль и Настройки</h2>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Здесь вы можете просмотреть свои параметры, изменить внешность главного героя или полностью перезапустить симуляцию.
                  </p>
                </div>

                {/* Main Profile Info Card */}
                {userProfile && (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
                    {/* Decorative radial gradient */}
                    <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"></div>
                    
                    <div className="flex items-start gap-4">
                      {userProfile.photo ? (
                        <img 
                          src={userProfile.photo} 
                          alt={userProfile.name} 
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-xl object-cover border border-neutral-700/60 shadow-inner"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-lg text-white shadow-md shadow-indigo-950/30">
                          {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "Г"}
                        </div>
                      )}
                      
                      <div className="space-y-1 text-left min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-neutral-100 truncate">{userProfile.name}</h3>
                          <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-indigo-500/10">{userProfile.age} лет</span>
                        </div>
                        <p className="text-xs text-neutral-400 font-semibold">{userProfile.gender}</p>
                      </div>
                    </div>

                    <div className="border-t border-neutral-800/80 pt-4 space-y-3.5 text-left text-xs">
                      <div>
                        <span className="font-bold text-[9px] text-neutral-500 uppercase tracking-wider block mb-1">🎭 Черты характера:</span>
                        <div className="flex flex-wrap gap-1">
                          {(userProfile.traits || "").split(",").filter(Boolean).map((trait, idx) => (
                            <span key={idx} className="bg-neutral-950 border border-neutral-800 text-neutral-300 px-2.5 py-1 rounded-lg text-[10px] font-medium">
                              ✨ {trait.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-[9px] text-neutral-500 uppercase tracking-wider block mb-1">📖 Короткая Биография:</span>
                        <p className="text-neutral-300 leading-relaxed bg-neutral-950/50 p-2.5 border border-neutral-800/30 rounded-xl">
                          {userProfile.bio}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Physical traits and appearance */}
                {userProfile && (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl text-left">
                    <h3 className="font-bold text-xs text-neutral-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-800 pb-2">
                      <span>🍓 Параметры Внешности:</span>
                    </h3>

                    {/* Привлекательность ГГ */}
                    <div className="bg-gradient-to-r from-rose-950/20 to-indigo-950/20 border border-rose-500/10 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>🔥</span> Уровень Привлекательности ГГ
                        </span>
                        <span className="text-sm font-extrabold text-rose-400">{userProfile.attractiveness ?? 80}%</span>
                      </div>
                      <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
                        <div 
                          className="bg-gradient-to-r from-rose-500 to-indigo-500 h-full transition-all duration-300" 
                          style={{ width: `${userProfile.attractiveness ?? 80}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal">
                        Барометр красоты вашей героини. Высокий балл (75-100%) вызывает у мужских персонажей непреодолимое вожделение и откровенный, нефильтрованный флирт, а муж Макс начинает безумно ревновать. Вы можете настроить этот балл при редактировании анкеты.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-2.5 text-center">
                      <div className="bg-neutral-950 border border-neutral-800/60 p-2.5 rounded-xl">
                        <span className="text-[9px] text-neutral-500 uppercase font-semibold block">Лицо</span>
                        <span className="text-xs font-bold text-neutral-200">{userProfile.face}</span>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800/60 p-2.5 rounded-xl">
                        <span className="text-[9px] text-neutral-500 uppercase font-semibold block">Грудь</span>
                        <span className="text-xs font-bold text-neutral-200">{userProfile.chest}</span>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800/60 p-2.5 rounded-xl">
                        <span className="text-[9px] text-neutral-500 uppercase font-semibold block">Талия</span>
                        <span className="text-xs font-bold text-neutral-200">{userProfile.waist}</span>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800/60 p-2.5 rounded-xl">
                        <span className="text-[9px] text-neutral-500 uppercase font-semibold block">Бёдра</span>
                        <span className="text-xs font-bold text-neutral-200">{userProfile.hips}</span>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800/60 p-2.5 rounded-xl">
                        <span className="text-[9px] text-neutral-500 uppercase font-semibold block">Интим. зоны</span>
                        <span className="text-xs font-bold text-neutral-200">{userProfile.intimate}</span>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800/60 p-2.5 rounded-xl">
                        <span className="text-[9px] text-neutral-500 uppercase font-semibold block">Ноги</span>
                        <span className="text-xs font-bold text-neutral-200">{userProfile.legs}</span>
                      </div>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-800/60 p-3 rounded-xl space-y-1">
                      <span className="text-[9px] text-neutral-500 uppercase font-semibold block">Общее состояние:</span>
                      <p className="text-xs text-neutral-300 leading-relaxed">{userProfile.overall}</p>
                    </div>

                    {/* Button to open edit modal */}
                    <button
                      onClick={openEditProfile}
                      className="w-full mt-2 py-3 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-indigo-400 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <span>📝 Редактировать анкету и фото</span>
                    </button>
                  </div>
                )}

                {/* AI Detailed Analysis section on mobile profile */}
                {(profileDetailedAnalysis || profileImageSceneDescription || profilePlotContext) && (
                  <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4 text-left">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-800 pb-2">
                      <span>🔮 Углубленный ИИ-Анализ Внешности:</span>
                    </span>
                    
                    <div className="space-y-3">
                      {profileDetailedAnalysis && (
                        <div className="bg-indigo-950/20 border border-indigo-900/30 p-3.5 rounded-xl space-y-1">
                          <span className="font-bold text-[9px] text-indigo-300 uppercase tracking-wider block">🎨 Психофизический Анализ & Харизма:</span>
                          <p className="text-neutral-300 text-[11px] leading-relaxed whitespace-pre-wrap">{profileDetailedAnalysis}</p>
                        </div>
                      )}

                      {profileImageSceneDescription && (
                        <div className="bg-purple-950/20 border border-purple-900/30 p-3.5 rounded-xl space-y-1">
                          <span className="font-bold text-[9px] text-purple-300 uppercase tracking-wider block">📸 Описание сцены & одежды на фото:</span>
                          <p className="text-neutral-300 text-[11px] leading-relaxed whitespace-pre-wrap">{profileImageSceneDescription}</p>
                        </div>
                      )}

                      {profilePlotContext && (
                        <div className="bg-rose-950/20 border border-rose-900/30 p-3.5 rounded-xl space-y-1">
                          <span className="font-bold text-[9px] text-rose-300 uppercase tracking-wider block">📖 Влияние на Сюжет & Реакции Окружающих:</span>
                          <p className="text-neutral-300 text-[11px] leading-relaxed whitespace-pre-wrap">{profilePlotContext}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {/* DANGER ZONE - Game Reset Button with huge safe touch target */}
                <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-5 space-y-4 text-left shadow-xl shadow-red-950/10">
                  <div className="flex items-center gap-2 text-red-400 border-b border-red-900/30 pb-2">
                    <AlertTriangle className="w-5 h-5 animate-pulse text-red-500" />
                    <span className="font-extrabold uppercase tracking-wider text-xs text-red-400">Опасная зона</span>
                  </div>

                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Вы можете полностью стереть текущую игру и начать заново. Это безвозвратно сотрет все ваши переписки, созданных персонажей, шкалы отношений и сюжетные сводки Рассказчика.
                  </p>

                  <button
                    onClick={handleResetData}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all duration-150 cursor-pointer shadow-lg shadow-red-950/35 flex items-center justify-center gap-2.5 active:scale-[0.98] min-h-[50px]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>НАЧАТЬ ВСЁ СНАЧАЛА</span>
                  </button>
                </div>

              </div>
            </div>
          )}

        </main>

        {/* PANEL 3: Right Column - Gossip radar panel (Desktop only) */}
        <aside className="w-80 border-l border-neutral-800 bg-neutral-900/10 flex flex-col shrink-0 hidden lg:flex overflow-y-auto p-4 space-y-4 custom-scrollbar">
          
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 select-none">
              <Radio className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
              <span>Мировая Память</span>
            </h3>
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              Факты циркулируют между людьми. Сосед дядя Толя не узнает ваши дела с работы, если только Сергей не расскажет их ему напрямую в общей группе!
            </p>
          </div>

          {/* Quick Info User Profile card inside sidebar */}
          <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 mb-1">
              <span className="font-bold text-neutral-200 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Личность Игрока
              </span>
              <button onClick={openEditProfile} className="text-[10px] text-indigo-400 hover:underline">
                Изм.
              </button>
            </div>
            <div className="flex gap-2.5 items-start">
              {userProfile && userProfile.photo && (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-neutral-800 shrink-0">
                  <img src={userProfile.photo} alt="GG" className="w-full h-full object-cover" />
                </div>
              )}
              {userProfile ? (
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-neutral-300"><strong>Имя:</strong> {userProfile.name} ({userProfile.gender}, {userProfile.age} л.)</p>
                  <p className="text-[11px] text-neutral-400 truncate"><strong>Черты:</strong> {userProfile.traits}</p>
                  <p className="text-[11px] text-rose-400 font-semibold mt-0.5"><strong>Привлекательность:</strong> {userProfile.attractiveness ?? 80}%</p>
                </div>
              ) : (
                <div className="min-w-0 flex-1 text-neutral-500 text-[11px]">Профиль не создан</div>
              )}
            </div>
          </div>

          {/* Secret Thoughts & Motives of Active Character */}
          {activeChar && (
            <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl space-y-2 text-xs flex flex-col shrink-0 shadow-md">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 mb-1">
                <span className="font-bold text-neutral-200 flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Мысли: {activeChar.name}</span>
                </span>
                <button
                  onClick={() => fetchThoughtsForCharacter(activeChar.id)}
                  disabled={!!charThoughtsLoading[activeChar.id]}
                  className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer font-bold shrink-0"
                  title="Обновить мысли и тайные мотивы"
                >
                  {charThoughtsLoading[activeChar.id] ? "Чтение..." : "Считать"}
                </button>
              </div>

              {charThoughtsLoading[activeChar.id] ? (
                <div className="py-4 text-center space-y-2">
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-[10px] text-neutral-500 animate-pulse">Проникаем в подсознание...</p>
                </div>
              ) : charThoughts[activeChar.id] ? (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  <div>
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wide block">💭 Внутренний монолог</span>
                    <p className="text-[10.5px] text-neutral-300 italic leading-relaxed bg-neutral-950/40 p-2 rounded-lg border border-neutral-800/40 mt-0.5">
                      «{charThoughts[activeChar.id].thoughts}»
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide block">🎯 Скрытые мотивы и цели</span>
                    <p className="text-[10.5px] text-neutral-300 leading-normal mt-0.5">
                      {charThoughts[activeChar.id].motives}
                    </p>
                  </div>
                  {charThoughts[activeChar.id].visualAttitude && (
                    <div>
                      <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wide block">🍓 Взгляд на тело ГГ</span>
                      <p className="text-[10.5px] text-neutral-300 leading-normal mt-0.5">
                        {charThoughts[activeChar.id].visualAttitude}
                      </p>
                    </div>
                  )}
                  {charThoughts[activeChar.id].nextActionPlan && (
                    <div>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide block">♟️ План действий</span>
                      <p className="text-[10.5px] text-neutral-300 leading-normal mt-0.5">
                        {charThoughts[activeChar.id].nextActionPlan}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2 text-center text-[10px] text-neutral-500 space-y-1.5 leading-normal">
                  <p>Мысли персонажа еще не прочитаны или изменились после диалога.</p>
                  <button
                    onClick={() => fetchThoughtsForCharacter(activeChar.id)}
                    className="w-full py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/25 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Считать мысли 🧠
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active rumor radar inside sidebar */}
          <div className="space-y-2 flex-1 flex flex-col min-h-0">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 select-none">
              Активные факты в мире ({sharedFacts.length})
            </h4>

            {sharedFacts.length === 0 ? (
              <div className="bg-neutral-950/40 border border-neutral-800/40 p-5 rounded-xl text-center text-[10px] text-neutral-500 leading-relaxed flex-1 flex flex-col items-center justify-center">
                <Radio className="w-5 h-5 text-neutral-700 mb-1.5" />
                <span>База воспоминаний пуста. Вбросьте слух во вкладке «Сплетни»!</span>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {sharedFacts.map(fact => {
                  return (
                    <div
                      key={fact.id}
                      className="bg-neutral-900 border border-neutral-800/60 p-2.5 rounded-lg flex flex-col gap-1 relative group text-xs"
                    >
                      <button
                        onClick={() => setSharedFacts(prev => prev.filter(f => f.id !== fact.id))}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 p-0.5 rounded transition-all"
                        title="Удалить слух"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <p className="text-[11px] text-neutral-200 pr-3.5 leading-normal">
                        {fact.text}
                      </p>
                      
                      <div className="flex items-center justify-between text-[8px] text-neutral-500 mt-1">
                        <span className="text-indigo-400">
                          {fact.group === "Все" ? "Глобальный" : `Круг: ${fact.group}`}
                        </span>
                        <span>{fact.timestamp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </aside>

      </div>

      {/* MODAL 1: Character Add / Edit Form */}
      <AnimatePresence>
        {showCharModal && (
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
                  onClick={() => setShowCharModal(false)}
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
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500"
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
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1 font-bold">Социальный круг *</label>
                  <select
                    value={charGroup}
                    onChange={(e) => setCharGroup(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500"
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
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500"
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
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1 font-bold">Манера общения</label>
                    <input
                      type="text"
                      value={charSpeech}
                      onChange={(e) => setCharSpeech(e.target.value)}
                      placeholder="Шлет капс и кучу сердечек"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500"
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
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500"
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
                        value={charFetishes}
                        onChange={(e) => setCharFetishes(e.target.value)}
                        placeholder="Доминирование, Чулки, Dirty talk"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1 font-semibold">🧠 Склонности (через запятую)</label>
                      <input
                        type="text"
                        value={charInclinations}
                        onChange={(e) => setCharInclinations(e.target.value)}
                        placeholder="Ревность, Собственничество"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-neutral-800 flex items-center justify-between shrink-0">
                  {editingCharId ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteCharacter(editingCharId)}
                      className="px-4 py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-500/20 text-red-400 rounded-xl font-bold text-xs cursor-pointer transition-all"
                    >
                      🗑️ Удалить персонажа
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCharModal(false)}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs cursor-pointer shadow-lg"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Create Group Modal */}
      <AnimatePresence>
        {showGroupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Users className="w-5 h-5" />
                  <h3 className="font-bold text-base text-white">Создать групповой чат</h3>
                </div>
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="p-5 space-y-4 overflow-y-auto custom-scrollbar text-xs">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5 font-bold">Название группы *</label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Например: Семья в сборе, Курилка-Пятница"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5 font-bold">Выберите участников группы *</label>
                  <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-800 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {characters.map(char => {
                      const isChecked = selectedParticipants.includes(char.id);
                      return (
                        <label
                          key={char.id}
                          className="flex items-center gap-3.5 p-1.5 hover:bg-neutral-900 rounded-lg cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedParticipants(prev => prev.filter(id => id !== char.id));
                              } else {
                                setSelectedParticipants(prev => [...prev, char.id]);
                              }
                            }}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-semibold text-neutral-200">{char.name}</span>
                          <span className="text-[10px] text-neutral-500">({char.role})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowGroupModal(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold text-xs"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-950"
                  >
                    Создать группу
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Photo Zoom View */}
      <AnimatePresence>
        {zoomImageUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
            <button
              onClick={() => setZoomImageUrl(null)}
              className="absolute top-4 right-4 p-2 bg-neutral-800/85 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl backdrop-blur-md cursor-pointer transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden border border-neutral-800 shadow-2xl"
            >
              <img src={zoomImageUrl} alt="Zoomed" className="object-contain max-h-[90vh]" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: User Profile Editing */}
      <AnimatePresence>
        {showProfileModal && userProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col text-xs max-h-[90vh]"
            >
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-indigo-400">
                  <User className="w-5 h-5 animate-pulse" />
                  <h3 className="font-bold text-sm text-white">Редактирование профиля героя</h3>
                </div>
                <button type="button" onClick={() => setShowProfileModal(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Левая колонка: Основная информация */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block border-b border-neutral-800/50 pb-1">📋 Основные данные:</span>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Имя *</label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100"
                        />
                      </div>

                      {/* Фото ГГ (Главного Героя) */}
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                          Фотография Персонажа (ГГ)
                        </label>
                        <div className="flex items-center gap-4 bg-neutral-950/40 border border-neutral-800/80 p-3 rounded-xl">
                          <div className="w-16 h-16 rounded-xl border border-neutral-800 bg-neutral-950 flex items-center justify-center overflow-hidden shrink-0">
                            {isEvaluatingPhoto ? (
                              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : profilePhoto ? (
                              <img src={profilePhoto} alt="GG Preview" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-neutral-600 text-[10px] text-center px-1">Без фото</span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isEvaluatingPhoto}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUploadAndEvaluation(file);
                              }}
                              className="hidden"
                              id="gg-photo-upload"
                            />
                            <label
                              htmlFor="gg-photo-upload"
                              className={`px-3 py-1.5 text-[11px] font-medium rounded-lg text-center transition-all select-none ${
                                isEvaluatingPhoto
                                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                  : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
                              }`}
                            >
                              {isEvaluatingPhoto ? "Анализ фото..." : profilePhoto ? "Изменить фото" : "Загрузить фото"}
                            </label>
                            {profilePhoto && !isEvaluatingPhoto && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProfilePhoto(null);
                                  // Reset parameters
                                  setProfileFace("Привлекательное, чистое лицо");
                                  setProfileChest("Упругая, округлая грудь");
                                  setProfileWaist("Тонкая талия, плоский живот");
                                  setProfileHips("Выразительные, округлые бёдра");
                                  setProfileIntimate("Аккуратные, ухоженные интимные зоны");
                                  setProfileLegs("Стройные, длинные ноги");
                                  setProfileOverall("Здоровое, спортивное и ухоженное тело без уродств");
                                }}
                                className="text-[10px] text-red-400 hover:text-red-300 font-semibold text-left transition-all cursor-pointer self-start"
                              >
                                Удалить фото
                              </button>
                            )}
                          </div>
                        </div>
                        {evaluationError && (
                          <p className="text-[9px] text-amber-400 mt-1">{evaluationError}</p>
                        )}
                        <p className="text-[9px] text-neutral-500 mt-1">
                          Загруженное фото ГГ позволяет остальным персонажам оценивать внешность и формировать влечение!
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Возраст *</label>
                          <input
                            type="number"
                            required
                            value={profileAge}
                            onChange={(e) => setProfileAge(parseInt(e.target.value) || 20)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Пол *</label>
                          <div className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-400 text-xs font-semibold select-none flex items-center gap-1.5">
                            <span className="text-rose-500 font-bold">♀</span> Женский (фиксирован)
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase">Уровень привлекательности главной героини: <span className="text-rose-400 font-extrabold">{profileAttractiveness}%</span></label>
                          <span className="text-[9px] text-rose-300 font-semibold">
                            {profileAttractiveness >= 85 ? "🔥 Сногсшибательная" : profileAttractiveness >= 65 ? "✨ Привлекательная" : profileAttractiveness >= 40 ? "😊 Обычная" : "🥶 Невзрачная"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={profileAttractiveness}
                            onChange={(e) => setProfileAttractiveness(parseInt(e.target.value))}
                            className="flex-1 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="text-xs font-black text-rose-400 w-8 text-right">{profileAttractiveness}%</span>
                        </div>
                        <p className="text-[9px] text-neutral-500 mt-0.5 leading-normal">
                          Позволяет динамически корректировать вожделение других персонажей к вам.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Черты характера *</label>
                        <input
                          type="text"
                          required
                          value={profileTraits}
                          onChange={(e) => setProfileTraits(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Короткая Био *</label>
                        <textarea
                          required
                          rows={2.5}
                          value={profileBio}
                          onChange={(e) => setProfileBio(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100"
                        />
                      </div>
                    </div>

                    {/* Правая колонка: Физические параметры */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block border-b border-neutral-800/50 pb-1">🍓 Параметры Внешности (21+):</span>
                      
                      <div className="bg-neutral-950/35 border border-neutral-800/50 p-4 rounded-xl space-y-3">
                        {/* Лицо */}
                        <div className="space-y-1.5 border-b border-neutral-800/40 pb-2">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-neutral-400">👩 ЛИЦО:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded font-semibold">{getPartRatingText(faceScore)}</span>
                              <span className="text-rose-400 font-extrabold">{faceScore}/100</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              required
                              value={profileFace}
                              onChange={(e) => setProfileFace(e.target.value)}
                              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-neutral-100 text-[11px]"
                            />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={faceScore}
                              onChange={(e) => setFaceScore(parseInt(e.target.value))}
                              className="w-full sm:w-24 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer mt-1 sm:mt-2"
                            />
                          </div>
                        </div>

                        {/* Сиськи/Грудь */}
                        <div className="space-y-1.5 border-b border-neutral-800/40 pb-2">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-neutral-400">🍈 СИСЬКИ / ГРУДЬ:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded font-semibold">{getPartRatingText(chestScore)}</span>
                              <span className="text-rose-400 font-extrabold">{chestScore}/100</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              required
                              value={profileChest}
                              onChange={(e) => setProfileChest(e.target.value)}
                              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-neutral-100 text-[11px]"
                            />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={chestScore}
                              onChange={(e) => setChestScore(parseInt(e.target.value))}
                              className="w-full sm:w-24 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer mt-1 sm:mt-2"
                            />
                          </div>
                        </div>

                        {/* Талия */}
                        <div className="space-y-1.5 border-b border-neutral-800/40 pb-2">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-neutral-400">⏳ ТАЛИЯ:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded font-semibold">{getPartRatingText(waistScore)}</span>
                              <span className="text-rose-400 font-extrabold">{waistScore}/100</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              required
                              value={profileWaist}
                              onChange={(e) => setProfileWaist(e.target.value)}
                              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-neutral-100 text-[11px]"
                            />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={waistScore}
                              onChange={(e) => setWaistScore(parseInt(e.target.value))}
                              className="w-full sm:w-24 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer mt-1 sm:mt-2"
                            />
                          </div>
                        </div>

                        {/* Бедра */}
                        <div className="space-y-1.5 border-b border-neutral-800/40 pb-2">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-neutral-400">🍑 БЁДРА:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded font-semibold">{getPartRatingText(hipsScore)}</span>
                              <span className="text-rose-400 font-extrabold">{hipsScore}/100</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              required
                              value={profileHips}
                              onChange={(e) => setProfileHips(e.target.value)}
                              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-neutral-100 text-[11px]"
                            />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={hipsScore}
                              onChange={(e) => setHipsScore(parseInt(e.target.value))}
                              className="w-full sm:w-24 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer mt-1 sm:mt-2"
                            />
                          </div>
                        </div>

                        {/* Вагина/Пах */}
                        <div className="space-y-1.5 border-b border-neutral-800/40 pb-2">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-neutral-400">🐱 ВАГИНА / ПАХ:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded font-semibold">{getPartRatingText(vaginaScore)}</span>
                              <span className="text-rose-400 font-extrabold">{vaginaScore}/100</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              required
                              value={profileVagina}
                              onChange={(e) => {
                                setProfileVagina(e.target.value);
                                setProfileIntimate(e.target.value);
                              }}
                              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-neutral-100 text-[11px]"
                            />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={vaginaScore}
                              onChange={(e) => setVaginaScore(parseInt(e.target.value))}
                              className="w-full sm:w-24 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer mt-1 sm:mt-2"
                            />
                          </div>
                        </div>

                        {/* Анус/Попа */}
                        <div className="space-y-1.5 border-b border-neutral-800/40 pb-2">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-neutral-400">🍩 АНУС / ПОПА:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded font-semibold">{getPartRatingText(anusScore)}</span>
                              <span className="text-rose-400 font-extrabold">{anusScore}/100</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              required
                              value={profileAnus}
                              onChange={(e) => setProfileAnus(e.target.value)}
                              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-neutral-100 text-[11px]"
                            />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={anusScore}
                              onChange={(e) => setAnusScore(parseInt(e.target.value))}
                              className="w-full sm:w-24 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer mt-1 sm:mt-2"
                            />
                          </div>
                        </div>

                        {/* Ноги */}
                        <div className="space-y-1.5 border-b border-neutral-800/40 pb-2">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-neutral-400">🦵 НОГИ:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded font-semibold">{getPartRatingText(legsScore)}</span>
                              <span className="text-rose-400 font-extrabold">{legsScore}/100</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              required
                              value={profileLegs}
                              onChange={(e) => setProfileLegs(e.target.value)}
                              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-neutral-100 text-[11px]"
                            />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={legsScore}
                              onChange={(e) => setLegsScore(parseInt(e.target.value))}
                              className="w-full sm:w-24 accent-rose-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer mt-1 sm:mt-2"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] text-neutral-400 mb-1 font-bold uppercase">Общее состояние и здоровье *</label>
                          <textarea
                            required
                            rows={2}
                            value={profileOverall}
                            onChange={(e) => setProfileOverall(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-100 text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Detailed Analysis and Plot Context section inside profile editing modal */}
                  {(profileDetailedAnalysis || profileImageSceneDescription || profilePlotContext) && (
                    <div className="mt-4 border-t border-neutral-800/80 pt-4 space-y-4 text-left">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">🔮 Углубленный ИИ-Анализ Внешности и Сюжета:</span>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {profileDetailedAnalysis && (
                          <div className="bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-xl space-y-1">
                            <span className="font-bold text-[9px] text-indigo-300 uppercase tracking-wider block">🎨 Психофизический Анализ & Харизма:</span>
                            <p className="text-neutral-300 text-[11px] leading-relaxed whitespace-pre-wrap">{profileDetailedAnalysis}</p>
                          </div>
                        )}

                        {profileImageSceneDescription && (
                          <div className="bg-purple-950/20 border border-purple-900/30 p-3 rounded-xl space-y-1">
                            <span className="font-bold text-[9px] text-purple-300 uppercase tracking-wider block">📸 Описание сцены & одежды на фото:</span>
                            <p className="text-neutral-300 text-[11px] leading-relaxed whitespace-pre-wrap">{profileImageSceneDescription}</p>
                          </div>
                        )}

                        {profilePlotContext && (
                          <div className="bg-rose-950/20 border border-rose-900/30 p-3 rounded-xl space-y-1">
                            <span className="font-bold text-[9px] text-rose-300 uppercase tracking-wider block">📖 Влияние на Сюжет & Реакции Окружающих:</span>
                            <p className="text-neutral-300 text-[11px] leading-relaxed whitespace-pre-wrap">{profilePlotContext}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                <div className="p-4 border-t border-neutral-800 flex justify-between items-center bg-neutral-900/90 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="px-3.5 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-xl font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                    title="Сбросить всю игру"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Сбросить всё</span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(false)}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold text-[11px]"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[11px]"
                    >
                      Сохранить изменения
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Interactive Seduction & Sex Scene (21+ adult RPG) */}
      <AnimatePresence>
        {activeSeductionChar && (
          <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col md:flex-row overflow-hidden font-sans select-none">
            {/* Left Sidebar: Seduction Metrics & Scales */}
            <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-rose-950/40 bg-neutral-950 flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-5 space-y-6 relative">
              <div className="absolute -left-20 -top-20 w-40 h-40 bg-rose-600/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest">
                  <Flame className="w-4 h-4 animate-pulse" />
                  <span>Интимный радар</span>
                </div>
                <button
                  onClick={handleCloseSeduction}
                  className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-lg transition-all"
                  title="Закончить близость"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Character Info Card */}
              <div className="bg-gradient-to-b from-neutral-900/50 to-rose-950/10 border border-rose-950/30 p-4 rounded-2xl space-y-3 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeSeductionChar.avatarColor} flex items-center justify-center font-bold text-white shadow-md text-sm shrink-0`}>
                    {activeSeductionChar.name[0]}
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="font-bold text-sm text-white truncate">{activeSeductionChar.name}</h3>
                    <p className="text-[10px] text-rose-400 font-semibold">{activeSeductionChar.role}</p>
                  </div>
                </div>
                
                <p className="text-[11px] text-neutral-400 text-left italic border-t border-neutral-800/60 pt-2 leading-relaxed">
                  "{activeSeductionChar.attitude || "Возбужден вашим присутствием"}"
                </p>
              </div>

              {/* Scales */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-left">Параметры возбуждения</h4>
                <div className="space-y-3 text-left">
                  {/* Lust Scale */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-rose-400">🔥 Вожделение (Lust)</span>
                      <span className="text-rose-400">{activeSeductionChar.scales?.lust || 0}%</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800/80">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-500"
                        style={{ width: `${activeSeductionChar.scales?.lust || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Intimacy Scale */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-pink-400">💖 Близость (Intimacy)</span>
                      <span className="text-pink-400">{activeSeductionChar.scales?.intimacy || 0}%</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800/80">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-rose-400 h-full transition-all duration-500"
                        style={{ width: `${activeSeductionChar.scales?.intimacy || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Love Scale */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-rose-500">❤️ Любовь (Love)</span>
                      <span className="text-rose-500">{activeSeductionChar.scales?.love || 0}%</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800/80">
                      <div
                        className="bg-rose-500 h-full transition-all duration-500"
                        style={{ width: `${activeSeductionChar.scales?.love || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Trust Scale */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-indigo-400">🤝 Доверие (Trust)</span>
                      <span className="text-indigo-400">{activeSeductionChar.scales?.trust || 0}%</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800/80">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-500"
                        style={{ width: `${activeSeductionChar.scales?.trust || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Semen & Climax indicators */}
              <div className="border-t border-neutral-800/80 pt-4 space-y-4">
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-left">Физиологические параметры</h4>
                
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="bg-neutral-900/40 border border-neutral-800 p-2.5 rounded-xl text-center">
                    <div className="text-[9px] text-neutral-500 font-bold uppercase">Член</div>
                    <div className="text-xs font-mono font-bold text-neutral-200 mt-1">
                      {activeSeductionChar.penisSizeDiscovered ? `📏 ${activeSeductionChar.penisSize || 15} см` : "❓ Скрыт"}
                    </div>
                  </div>
                  <div className="bg-neutral-900/40 border border-neutral-800 p-2.5 rounded-xl text-center">
                    <div className="text-[9px] text-neutral-500 font-bold uppercase">Наполнение яиц</div>
                    <div className="text-xs font-mono font-bold text-rose-400 mt-1">
                      🍒 {activeSeductionChar.ballFullness ?? 50}%
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-left text-[11px] text-neutral-300">
                  <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                    <span className="text-neutral-500 font-medium">🌷 В вагину ГГ:</span>
                    <span className="font-mono font-bold text-rose-300">
                      {activeSeductionChar.ejaculatedVagina || 0} мл
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                    <span className="text-neutral-500 font-medium">🍩 В анус ГГ:</span>
                    <span className="font-mono font-bold text-rose-300">
                      {activeSeductionChar.ejaculatedAnus || 0} мл
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                    <span className="text-neutral-500 font-medium">👄 В рот ГГ:</span>
                    <span className="font-mono font-bold text-rose-300">
                      {activeSeductionChar.ejaculatedMouth || 0} мл
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                    <span className="text-neutral-500 font-medium">💦 На тело/лицо:</span>
                    <span className="font-mono font-bold text-pink-300">
                      {activeSeductionChar.ejaculatedOnPhoto || 0} мл
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                    <span className="text-neutral-500 font-medium">👉 Всего секса:</span>
                    <span className="font-mono font-bold text-indigo-300">
                      {activeSeductionChar.sexCount || 0} раз
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1"></div>

              {/* Info text */}
              <div className="text-[9px] text-neutral-600 bg-neutral-900/20 p-3 rounded-xl border border-neutral-900 text-left leading-relaxed">
                Каждое прикосновение повышает страсть. Выборы, которые вы совершаете, определяют глубину интимного оргазма.
              </div>
            </aside>

            {/* Right Main Column: Seduction Chat View & Actions */}
            <main className="flex-1 bg-neutral-950 flex flex-col overflow-hidden relative border-t md:border-t-0 border-rose-950/30">
              {/* Intimacy ambient glow background */}
              <div className="absolute right-0 bottom-0 w-96 h-96 bg-rose-600/5 rounded-full blur-[120px] pointer-events-none"></div>
              
              {/* Header */}
              <div className="p-4 bg-neutral-900/20 border-b border-rose-950/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Интерактивный сеанс близости</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-bold">21+ NSFW RPG</span>
                </div>
              </div>

              {/* Chat Viewport */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar relative flex flex-col">
                <div className="space-y-4 text-left w-full">
                  {seductionHistory.map((step, idx) => {
                    const isUser = step.role === "user";
                    const isNarrator = step.role === "narrator";
                    
                    if (isNarrator) {
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-rose-950/15 border border-rose-900/25 p-4 rounded-2xl text-rose-300 text-xs italic leading-relaxed text-center"
                        >
                          {step.content}
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse text-right" : "mr-auto text-left"}`}
                      >
                        {!isUser && (
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeSeductionChar.avatarColor} flex items-center justify-center font-bold text-white text-xs shrink-0 shadow`}>
                            {activeSeductionChar.name[0]}
                          </div>
                        )}
                        <div className="space-y-1 max-w-full">
                          <div className={`text-[10px] font-bold ${isUser ? "text-rose-400" : "text-neutral-400"}`}>
                            {isUser ? userProfile?.name : activeSeductionChar.name}
                          </div>
                          <div className={`p-3.5 rounded-2xl text-xs sm:text-xs leading-relaxed break-words whitespace-pre-wrap ${
                            isUser 
                              ? "bg-rose-600 text-white rounded-tr-none shadow-[0_2px_10px_rgba(244,63,94,0.2)]" 
                              : "bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-tl-none"
                          }`}>
                            {step.content}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Pulse loader */}
                  {isSeductionLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-rose-400/80 bg-rose-600/10 border border-rose-500/20 px-4 py-3 rounded-2xl max-w-sm mr-auto"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <span className="text-[11px] font-bold animate-pulse">
                        {activeSeductionChar.name} прикусывает губы и ласкает твоё тело...
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Action Area: Choices grid and inputs */}
              <div className="p-4 bg-neutral-950 border-t border-rose-950/20 space-y-4 shrink-0">
                {seductionIsFinished ? (
                  // Climax Finished State Screen
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-br from-rose-950/30 to-amber-950/20 border border-rose-500/30 p-5 rounded-2xl text-center space-y-4"
                  >
                    <div className="flex justify-center text-3xl">🎉💦🥂</div>
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Кульминация близости достигнута!</h3>
                    <p className="text-xs text-neutral-300 leading-relaxed max-w-md mx-auto">
                      Вы провели незабываемое и безумно жаркое время наедине. Шкала вожделения {activeSeductionChar.name} испытала невероятный взрыв, вы оба чувствуете сладкое изнеможение...
                    </p>
                    <div className="text-xs font-bold text-rose-400">
                      📈 Доверительные и интимные отношения поднялись до пиковых высот!
                    </div>
                    <button
                      type="button"
                      onClick={handleCloseSeduction}
                      className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer"
                    >
                      Вернуться к чатам и переписке
                    </button>
                  </motion.div>
                ) : (
                  // Active Scene Choices
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-left">Ваши эротические действия:</div>
                    
                    {/* Grid of options */}
                    {seductionChoices && seductionChoices.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {seductionChoices.map((choice, idx) => (
                          <button
                            key={idx}
                            disabled={isSeductionLoading}
                            onClick={() => handleSeductionStep(choice)}
                            className="p-3 text-left bg-neutral-900 hover:bg-rose-950/30 border border-neutral-800 hover:border-rose-500/30 rounded-xl text-neutral-200 hover:text-rose-200 text-[11px] font-bold transition-all disabled:opacity-50 disabled:hover:bg-neutral-900 disabled:hover:border-neutral-800 disabled:cursor-not-allowed cursor-pointer"
                          >
                            👉 {choice}
                          </button>
                        ))}
                      </div>
                    ) : !isSeductionLoading ? (
                      <div className="text-[10px] text-neutral-500 italic">Нет доступных готовых вариантов. Задайте свое действие ниже!</div>
                    ) : null}

                    {/* Custom text action input */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={customSeductionInput}
                        onChange={(e) => setCustomSeductionInput(e.target.value)}
                        placeholder="Опишите свое действие или реплику (например: 'Провести языком по его губам'...)"
                        disabled={isSeductionLoading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && customSeductionInput.trim()) {
                            handleSeductionStep(customSeductionInput.trim());
                          }
                        }}
                        className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-neutral-100 text-xs placeholder-neutral-700 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isSeductionLoading || !customSeductionInput.trim()}
                        onClick={() => handleSeductionStep(customSeductionInput.trim())}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Действовать</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: Character Thoughts and Motives */}
      <ThoughtsModal
        isOpen={showThoughtsModal}
        onClose={() => setShowThoughtsModal(false)}
        activeChar={activeChar}
        thoughtsLoading={thoughtsLoading}
        thoughtsError={thoughtsError}
        thoughtsData={thoughtsData}
        handleFetchThoughts={handleFetchThoughts}
      />

      {/* MODAL 5B: Character Characteristics (Optimized for Mobile and Desktop with Scroll and Close) */}
      <CharacteristicsModal
        isOpen={showCharInfoModal}
        onClose={() => setShowCharInfoModal(false)}
        activeChar={activeChar}
        visibleFacts={visibleFacts}
      />

      {/* MODAL 5: Immersive Voice Call Screen Overlay */}
      <LiveVoiceCall
        activeCall={activeCall}
        activeChar={activeChar}
        currentChatMessages={currentChatMessages}
        callInputText={callInputText}
        setCallInputText={setCallInputText}
        handleSendMessage={handleSendMessage}
        handleHangupCall={handleHangupCall}
        isLoading={isLoading}
      />

      {/* Chat Switcher Modal */}
      <AnimatePresence>
        {showChatSwitcherModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85 backdrop-blur-sm p-4 text-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col h-[85vh] max-h-[600px] overflow-hidden shadow-2xl relative"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-base font-bold select-none">
                    💬
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Выбор собеседника</h3>
                    <p className="text-[10px] text-neutral-400">Выберите, кому вы хотите написать, или настройте персонажей</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChatSwitcherModal(false)}
                  className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="px-5 py-3 border-b border-neutral-800/60 bg-neutral-950/20 flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setShowChatSwitcherModal(false);
                    openCharacterModal(null);
                  }}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Новый персонаж</span>
                </button>
                <button
                  onClick={() => {
                    setShowChatSwitcherModal(false);
                    setShowGroupModal(true);
                  }}
                  className="flex-1 py-2 bg-neutral-850 hover:bg-neutral-800 text-indigo-400 font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-neutral-850 transition-all cursor-pointer text-xs active:scale-95"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Создать группу</span>
                </button>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* Group Chats section */}
                {groupChats.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Групповые чаты ({groupChats.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {groupChats.map(group => {
                        const isSelected = group.id === selectedChatId;
                        return (
                          <button
                            key={group.id}
                            onClick={() => {
                              setSelectedChatId(group.id);
                              setShowChatSwitcherModal(false);
                            }}
                            className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600/15 border-indigo-500/40 text-white"
                                : "bg-neutral-950/40 border-neutral-850 hover:bg-neutral-800/40 text-neutral-300"
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${group.avatarColor} flex items-center justify-center text-white font-extrabold text-[11px] shadow-md shrink-0`}>
                              {group.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs truncate">{group.name}</div>
                              <div className="text-[10px] text-neutral-500 truncate">
                                {group.participantIds.length} участников
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Personal Chats Section */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Личные чаты ({characters.length})</h4>
                  <div className="space-y-2">
                    {characters.map(char => {
                      const isSelected = char.id === selectedChatId;
                      const hasCallOption = true;
                      return (
                        <div
                          key={char.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isSelected
                              ? "bg-indigo-600/15 border-indigo-500/40 text-white"
                              : "bg-neutral-950/40 border-neutral-850 hover:bg-neutral-800/40 text-neutral-300"
                          }`}
                        >
                          <button
                            onClick={() => {
                              setSelectedChatId(char.id);
                              setShowChatSwitcherModal(false);
                            }}
                            className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                          >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${char.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}>
                              {char.name[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs truncate text-neutral-100">{char.name}</span>
                                <span className="text-[8px] bg-neutral-800 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">
                                  {char.group}
                                </span>
                              </div>
                              <div className="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
                                {char.role}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[8px] flex-wrap">
                                <span className="text-emerald-400 font-semibold">● {char.status}</span>
                                <span className="text-neutral-500">• Отношение: <span className="text-pink-400 font-semibold">{char.attitude}</span></span>
                              </div>
                            </div>
                          </button>

                          <div className="flex items-center gap-1.5 ml-2">
                            {hasCallOption && (
                              <button
                                onClick={() => {
                                  setSelectedChatId(char.id);
                                  setShowChatSwitcherModal(false);
                                  setActiveCall({
                                    characterId: char.id,
                                    status: "calling",
                                    duration: 0,
                                    type: "phone"
                                  });
                                  setTimeout(() => {
                                    setActiveCall(prev => {
                                      if (!prev) return null;
                                      return { ...prev, status: "connected" };
                                    });
                                  }, 2500);
                                }}
                                title="Позвонить"
                                className="w-8 h-8 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 flex items-center justify-center cursor-pointer transition-all active:scale-90"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setShowChatSwitcherModal(false);
                                openCharacterModal(char.id);
                              }}
                              title="Редактировать характер"
                              className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-90"
                            >
                              <PenSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 text-center text-[10px] text-neutral-500 shrink-0 select-none font-bold">
                🔒 Все переписки хранятся локально на вашем устройстве
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-55 flex items-center justify-center bg-neutral-950/85 backdrop-blur-sm p-4 text-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-xl mx-auto">
                  ⚠️
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Начать всё сначала?</h3>
                  <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                    Вы уверены, что хотите полностью стереть историю переписок, созданные группы, измененные характеры персонажей и сюжет? Это действие необратимо.
                  </p>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold rounded-xl transition-all cursor-pointer text-[11px]"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={executeResetData}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-red-950/40 text-[11px]"
                  >
                    Да, стереть всё
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Character Confirmation Modal */}
      <AnimatePresence>
        {charIdToDelete && (
          <div className="fixed inset-0 z-55 flex items-center justify-center bg-neutral-950/85 backdrop-blur-sm p-4 text-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center text-xl mx-auto">
                  🗑️
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Удалить персонажа?</h3>
                  <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                    Вы уверены, что хотите удалить этого персонажа? Вся переписка и история чата с ним будут безвозвратно стерты.
                  </p>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setCharIdToDelete(null)}
                    className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold rounded-xl transition-all cursor-pointer text-[11px]"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => executeDeleteCharacter(charIdToDelete)}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-950/40 text-[11px]"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
