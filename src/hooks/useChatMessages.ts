import { useState, useEffect, FormEvent, Dispatch, SetStateAction } from "react";
import { Message, Character, GroupChat, UserProfile, SharedFact, StoryLog, CallState } from "../types";
import { safeSetLocalStorage } from "../utils/helpers";
import { api } from "../api/client";

export function useChatMessages(
  userProfile: UserProfile | null,
  characters: Character[],
  setCharacters: Dispatch<SetStateAction<Character[]>>,
  sharedFacts: SharedFact[],
  setSharedFacts: Dispatch<SetStateAction<SharedFact[]>>,
  propagateRumors: (facts: SharedFact[], charactersList: Character[]) => SharedFact[],
  setGossipNotification: (text: string | null) => void,
  aiMode: string,
  storyLog: StoryLog | null
) {
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem("roleplay_messages_v2");
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedChatId, setSelectedChatId] = useState<string>(() => {
    const saved = localStorage.getItem("roleplay_selected_chat_id_v2");
    return saved || "max";
  });

  const [inputText, setInputText] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [quickReplies, setQuickReplies] = useState<Record<string, string[]>>({});
  const [systemError, setSystemError] = useState<string | null>(null);
  const [systemStatusMessage, setSystemStatusMessage] = useState<string>("Все системы работают стабильно");

  const [sendAsNarrator, setSendAsNarrator] = useState(false);
  const [sendAsCharacter, setSendAsCharacter] = useState(false);

  const [chatModes, setChatModes] = useState<Record<string, "chat" | "call" | "live">>((() => {
    try {
      const saved = localStorage.getItem("roleplay_chat_modes_v2");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  })());

  const [activeCall, setActiveCall] = useState<CallState | null>(null);

  const [callInputText, setCallInputText] = useState("");

  const [activeSeductionChar, setActiveSeductionChar] = useState<Character | null>(null);
  const [seductionHistory, setSeductionHistory] = useState<{ role: "user" | "model" | "narrator"; content: string; timestamp: string }[]>([]);
  const [seductionChoices, setSeductionChoices] = useState<string[]>([]);
  const [isSeductionLoading, setIsSeductionLoading] = useState(false);
  const [customSeductionInput, setCustomSeductionInput] = useState("");
  const [seductionIsFinished, setSeductionIsFinished] = useState(false);

  useEffect(() => {
    safeSetLocalStorage("roleplay_messages_v2", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    safeSetLocalStorage("roleplay_selected_chat_id_v2", selectedChatId);
  }, [selectedChatId]);

  const handleSwitchCommMode = (mode: "chat" | "call" | "live", chatId = selectedChatId) => {
    setChatModes(prev => {
      const updated = { ...prev, [chatId]: mode };
      safeSetLocalStorage("roleplay_chat_modes_v2", JSON.stringify(updated));
      return updated;
    });
  };

  const handleCreateLiveMeetingEvent = () => {
    setSendAsNarrator(true);
    handleSwitchCommMode("live");
    setInputText("*Вы договорились о встрече. Теперь вы находитесь в [место встречи], встретились вживую и находитесь рядом друг с другом...*");
  };

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

  // Helper to update character metrics globally in state
  const updateCharacterMetrics = (charId: string, data: any) => {
    setCharacters(prev => prev.map(c => {
      if (c.id === charId) {
        const currentScales = c.scales || { trust: 50, love: 50, lust: 50, anger: 0, intimacy: 30 };
        const adj = data.scaleAdjustments || { trust: 0, love: 0, lust: 0, anger: 0, intimacy: 0 };
        
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

  const handleStartSeduction = async (char: Character) => {
    setActiveSeductionChar(char);
    setIsSeductionLoading(true);
    setSeductionIsFinished(false);

    const initialText = `*Вы приглушили свет, сели ближе к ${char.name}... В воздухе повисло сильное эротическое напряжение. Вы заглядываете ему в глаза и нежно прикасаетесь к его руке...*`;
    const initialStep = {
      role: "narrator" as const,
      content: initialText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setSeductionHistory([initialStep]);

    try {
      const data = await api.interactiveSeduction({
        character: char,
        choice: "Начать соблазнение и интимное сближение",
        history: [initialStep],
        userProfile,
        aiMode
      });

      const modelStep = {
        role: "model" as const,
        content: data.narrative,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setSeductionHistory([initialStep, modelStep]);
      setSeductionChoices(data.suggestedChoices || []);
      setSeductionIsFinished(data.isFinished || false);

      updateCharacterMetrics(char.id, data);
    } catch (e) {
      console.error("Error starting seduction:", e);
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
      const data = await api.interactiveSeduction({
        character: activeSeductionChar,
        choice: choiceText,
        history: newHistory,
        userProfile,
        aiMode
      });

      const modelStep = {
        role: "model" as const,
        content: data.narrative,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setSeductionHistory(prev => [...prev, modelStep]);
      setSeductionChoices(data.suggestedChoices || []);
      setSeductionIsFinished(data.isFinished || false);

      updateCharacterMetrics(activeSeductionChar.id, data);

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

  const handleSendMessage = async (
    e: FormEvent | null,
    customText?: string,
    isFromCall = false,
    activeChar?: Character | null,
    activeGroup?: GroupChat | null,
    activeGroupParticipants: Character[] = []
  ) => {
    if (e) e.preventDefault();
    
    const textToSend = customText !== undefined ? customText : inputText;
    if ((!textToSend.trim() && !attachedImage) || isLoading) return;

    const currentText = textToSend.trim() || "Смотри прикрепленное изображение";
    const imageToSend = attachedImage;

    const isNpcSend = (customText === undefined && sendAsCharacter);

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
      setSendAsNarrator(false);
      setSendAsCharacter(false);
    } else {
      setCallInputText("");
    }

    const activeCommMode = chatModes[selectedChatId] || "chat";
    const isCallMode = isFromCall ? (activeCall?.type === "phone") : (activeCommMode === "call");
    const isLiveModeMessage = isFromCall ? (activeCall?.type === "in_person") : (activeCommMode === "live");

    let responder: Character;
    let groupPartNames: string[] = [];

    if (activeGroup) {
      const autoSelectedId = activeGroup.participantIds[Math.floor(Math.random() * activeGroup.participantIds.length)];
      const charObj = characters.find(c => c.id === autoSelectedId);
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
        const data = await api.generateHeroineChatReply({
          character: characterData,
          messages: updatedHistory,
          userProfile,
          storyLog
        });

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

      const visibleFacts = sharedFacts.filter(fact => {
        if (fact.group === "Все") return true;
        if (activeGroup) {
          return activeGroup.participantIds.includes(fact.sourceCharacterId) ||
                 fact.knownBy?.some(id => activeGroup.participantIds.includes(id));
        }
        return fact.sourceCharacterId === responder.id ||
               (fact.knownBy && fact.knownBy.includes(responder.id));
      });
      const factsTexts = visibleFacts.map(f => f.text);

      setSystemStatusMessage("Отправка запроса в Gemini ИИ и генерация ответа...");
      const data = await api.sendChatMessage({
        character: characterData,
        messages: updatedHistory,
        sharedFacts: factsTexts,
        isVoice: isVoiceMode || isFromCall,
        isCall: isCallMode,
        isLive: isLiveModeMessage,
        attachedImage: imageToSend,
        userProfile,
        groupParticipants: activeGroup ? groupPartNames : undefined,
        aiMode,
        storyLog
      });

      setSystemStatusMessage("Обновление шкал отношений и извлечение слухов...");

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

      setMessages(prev => ({
        ...prev,
        [selectedChatId]: [...updatedHistory, modelMessage]
      }));

      if (data.quickReplies && Array.isArray(data.quickReplies)) {
        setQuickReplies(prev => ({
          ...prev,
          [selectedChatId]: data.quickReplies
        }));
      }

      setCharacters(prev => prev.map(c => {
        if (c.id === responder.id) {
          const status = data.dynamicStatus || c.status;
          const attitude = data.dynamicAttitude || c.attitude;
          
          let scales = c.scales ? { ...c.scales } : { trust: 50, love: 0, lust: 0, anger: 0, intimacy: 20 };
          if (data.scaleAdjustments) {
            const parseAdjustment = (val: any): number => {
              const parsed = parseInt(val);
              return isNaN(parsed) ? 0 : Math.round(parsed / 3);
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

      if (data.newSharedFacts && Array.isArray(data.newSharedFacts) && data.newSharedFacts.length > 0) {
        const addedFacts: SharedFact[] = [];
        data.newSharedFacts.forEach((factText: string) => {
          if (!sharedFacts.some(f => f.text.toLowerCase().trim() === factText.toLowerCase().trim())) {
            addedFacts.push({
              id: `extracted-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              text: factText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sourceCharacterId: responder.id,
              group: responder.group as any,
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

  const handleSendSuggestedGreeting = async (
    greetingText: string,
    activeChar: Character
  ) => {
    if (isLoading || !userProfile) return;

    setIsLoading(true);
    setSystemError(null);
    setSystemStatusMessage("Персонаж начинает диалог...");

    const charMsg: Message = {
      id: `char-start-${Date.now()}`,
      role: "model",
      senderId: activeChar.id,
      content: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const currentHistory = messages[selectedChatId] || [];
    const withCharMsgHistory = [...currentHistory, charMsg];
    
    setMessages(prev => ({
      ...prev,
      [selectedChatId]: withCharMsgHistory
    }));

    setSystemStatusMessage("Генерация ответа главной героини...");

    try {
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

      const data = await api.generateHeroineReply({
        character: characterData,
        greetingText,
        userProfile
      });

      const heroineMsg: Message = {
        id: `heroine-reply-${Date.now()}`,
        role: "user",
        content: data.reply || "*(Задумалась...)*",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const withHeroineHistory = [...withCharMsgHistory, heroineMsg];
      setMessages(prev => ({
        ...prev,
        [selectedChatId]: withHeroineHistory
      }));

      setSystemStatusMessage(`Подготовка ответа ${activeChar.name}...`);
      
      const chatData = await api.sendChatMessage({
        character: characterData,
        messages: withHeroineHistory,
        sharedFacts: sharedFacts.map(f => f.text),
        isVoice: false,
        isCall: false,
        isLive: false,
        attachedImage: null,
        userProfile,
        aiMode,
        storyLog
      });

      const modelMessage: Message = {
        id: `model-${Date.now()}`,
        role: "model",
        senderId: activeChar.id,
        content: chatData.reply || "*(Молчание собеседника...)*",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => ({
        ...prev,
        [selectedChatId]: [...withHeroineHistory, modelMessage]
      }));

    } catch (e) {
      console.error("Error sending suggested greeting:", e);
    } finally {
      setIsLoading(false);
      setSystemStatusMessage("Все системы работают стабильно");
    }
  };

  return {
    messages,
    setMessages,
    selectedChatId,
    setSelectedChatId,
    inputText,
    setInputText,
    isVoiceMode,
    setIsVoiceMode,
    attachedImage,
    setAttachedImage,
    isLoading,
    setIsLoading,
    quickReplies,
    setQuickReplies,
    systemError,
    setSystemError,
    systemStatusMessage,
    setSystemStatusMessage,
    sendAsNarrator,
    setSendAsNarrator,
    sendAsCharacter,
    setSendAsCharacter,
    chatModes,
    setChatModes,
    activeCall,
    setActiveCall,
    callInputText,
    setCallInputText,
    activeSeductionChar,
    setActiveSeductionChar,
    seductionHistory,
    setSeductionHistory,
    seductionChoices,
    setSeductionChoices,
    isSeductionLoading,
    setIsSeductionLoading,
    customSeductionInput,
    setCustomSeductionInput,
    seductionIsFinished,
    setSeductionIsFinished,
    handleSwitchCommMode,
    handleCreateLiveMeetingEvent,
    handleDeleteMessage,
    handleStartSeduction,
    handleSeductionStep,
    handleCloseSeduction,
    handleSendMessage,
    handleSendSuggestedGreeting
  };
}
