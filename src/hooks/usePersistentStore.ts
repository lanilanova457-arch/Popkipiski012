import { useReducer, useEffect, useRef } from "react";
import { UserProfile, Character, GroupChat, Message, SharedFact, StoryLog } from "../types";
import { CHARACTERS } from "../characters";
import { getDbItem, setDbItem, clearDb } from "../utils/db";

export interface RoleplayStoreState {
  userProfile: UserProfile | null;
  characters: Character[];
  groupChats: GroupChat[];
  selectedChatId: string;
  messages: Record<string, Message[]>;
  aiMode: "standard" | "high_thinking" | "low_latency";
  currentLocation: string;
  gameClock: number;
  maxSuspicion: number;
  sharedFacts: SharedFact[];
  storyLog: StoryLog | null;
  chatModes: Record<string, "chat" | "call" | "live">;
  rumorLogs: any[];
}

type StoreAction =
  | { type: "SET_USER_PROFILE"; payload: UserProfile | null }
  | { type: "SET_CHARACTERS"; payload: Character[] | ((prev: Character[]) => Character[]) }
  | { type: "SET_GROUP_CHATS"; payload: GroupChat[] | ((prev: GroupChat[]) => GroupChat[]) }
  | { type: "SET_SELECTED_CHAT_ID"; payload: string }
  | { type: "SET_MESSAGES"; payload: Record<string, Message[]> | ((prev: Record<string, Message[]>) => Record<string, Message[]>) }
  | { type: "SET_AI_MODE"; payload: "standard" | "high_thinking" | "low_latency" }
  | { type: "SET_CURRENT_LOCATION"; payload: string | ((prev: string) => string) }
  | { type: "SET_GAME_CLOCK"; payload: number | ((prev: number) => number) }
  | { type: "SET_MAX_SUSPICION"; payload: number | ((prev: number) => number) }
  | { type: "SET_SHARED_FACTS"; payload: SharedFact[] | ((prev: SharedFact[]) => SharedFact[]) }
  | { type: "SET_STORY_LOG"; payload: StoryLog | null | ((prev: StoryLog | null) => StoryLog | null) }
  | { type: "SET_CHAT_MODES"; payload: Record<string, "chat" | "call" | "live"> | ((prev: Record<string, "chat" | "call" | "live">) => Record<string, "chat" | "call" | "live">) }
  | { type: "SET_RUMOR_LOGS"; payload: any[] | ((prev: any[]) => any[]) }
  | { type: "SET_FULL_STATE"; payload: RoleplayStoreState }
  | { type: "RESET_STORE" };

function getInitialState(): RoleplayStoreState {
  try {
    const unifiedSaved = localStorage.getItem("roleplay_unified_store_v2");
    if (unifiedSaved) {
      const parsed = JSON.parse(unifiedSaved);
      if (parsed && typeof parsed === "object") {
        return {
          userProfile: parsed.userProfile || null,
          characters: parsed.characters || [],
          groupChats: parsed.groupChats || [],
          selectedChatId: parsed.selectedChatId || "max",
          messages: parsed.messages || {},
          aiMode: parsed.aiMode || "standard",
          currentLocation: parsed.currentLocation || "apartment",
          gameClock: parsed.gameClock !== undefined ? parsed.gameClock : 12,
          maxSuspicion: parsed.maxSuspicion !== undefined ? parsed.maxSuspicion : 0,
          sharedFacts: parsed.sharedFacts || [],
          storyLog: parsed.storyLog || null,
          chatModes: parsed.chatModes || {},
          rumorLogs: parsed.rumorLogs || [],
        };
      }
    }
  } catch (e) {
    console.warn("Failed to load unified store from localStorage, attempting individual fallback:", e);
  }

  // --- Fallback to Individual Legacy Keys ---
  let profile: UserProfile | null = null;
  try {
    const saved = localStorage.getItem("roleplay_user_profile_v2");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed) {
        parsed.gender = "Женский";
        profile = parsed;
      }
    }
  } catch (e) {
    console.error("Error parsing fallback user profile", e);
  }

  let chars: Character[] = [];
  try {
    const profileSaved = localStorage.getItem("roleplay_user_profile_v2");
    const profileObj = profileSaved ? JSON.parse(profileSaved) : null;
    const hasPhoto = !!profileObj?.photo;

    const adjustLustForNoPhoto = (charsList: Character[]) => {
      if (!hasPhoto) {
        const attr = profileObj?.attractiveness ?? 80;
        return charsList.map(c => {
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
      return charsList;
    };

    const saved = localStorage.getItem("roleplay_characters_v2");
    if (saved) {
      const parsed = JSON.parse(saved) as Character[];
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
      chars = adjustLustForNoPhoto(merged).map(c => ({
        ...c,
        sexCount: c.sexCount ?? 0,
        ejaculatedVagina: c.ejaculatedVagina ?? 0,
        ejaculatedAnus: c.ejaculatedAnus ?? 0,
        ejaculatedMouth: c.ejaculatedMouth ?? 0,
      }));
    } else {
      chars = adjustLustForNoPhoto(CHARACTERS).map(c => ({
        ...c,
        sexCount: c.sexCount ?? 0,
        ejaculatedVagina: c.ejaculatedVagina ?? 0,
        ejaculatedAnus: c.ejaculatedAnus ?? 0,
        ejaculatedMouth: c.ejaculatedMouth ?? 0,
      }));
    }
  } catch (e) {
    chars = CHARACTERS.map(c => ({
      ...c,
      sexCount: c.sexCount ?? 0,
      ejaculatedVagina: c.ejaculatedVagina ?? 0,
      ejaculatedAnus: c.ejaculatedAnus ?? 0,
      ejaculatedMouth: c.ejaculatedMouth ?? 0,
    }));
  }

  let groups: GroupChat[] = [];
  try {
    const saved = localStorage.getItem("roleplay_group_chats_v2");
    groups = saved ? JSON.parse(saved) : [];
  } catch (e) {}

  let selChatId = "max";
  try {
    const saved = localStorage.getItem("roleplay_selected_chat_id_v2");
    if (saved) selChatId = saved;
  } catch (e) {}

  let msgs: Record<string, Message[]> = {};
  try {
    const saved = localStorage.getItem("roleplay_messages_v2");
    msgs = saved ? JSON.parse(saved) : {};
  } catch (e) {}

  let mode: "standard" | "high_thinking" | "low_latency" = "standard";
  try {
    const saved = localStorage.getItem("roleplay_ai_mode_v2");
    if (saved === "standard" || saved === "high_thinking" || saved === "low_latency") {
      mode = saved;
    }
  } catch (e) {}

  let loc = "apartment";
  try {
    const saved = localStorage.getItem("roleplay_location_v2");
    if (saved) loc = saved;
  } catch (e) {}

  let clockVal = 12;
  try {
    const saved = localStorage.getItem("roleplay_clock_v2");
    if (saved) clockVal = Number(saved);
  } catch (e) {}

  let suspVal = 0;
  try {
    const saved = localStorage.getItem("roleplay_suspicion_v2");
    if (saved) suspVal = Number(saved);
  } catch (e) {}

  let facts: SharedFact[] = [];
  try {
    const saved = localStorage.getItem("roleplay_shared_facts_v2");
    facts = saved ? JSON.parse(saved) : [];
  } catch (e) {}

  let story: StoryLog | null = null;
  try {
    const saved = localStorage.getItem("roleplay_story_log_v2");
    story = saved ? JSON.parse(saved) : null;
  } catch (e) {}

  let modes: Record<string, "chat" | "call" | "live"> = {};
  try {
    const saved = localStorage.getItem("roleplay_chat_modes_v2");
    modes = saved ? JSON.parse(saved) : {};
  } catch (e) {}

  let rumors: any[] = [];
  try {
    const saved = localStorage.getItem("roleplay_rumor_logs_v2");
    rumors = saved ? JSON.parse(saved) : [];
  } catch (e) {}

  return {
    userProfile: profile,
    characters: chars,
    groupChats: groups,
    selectedChatId: selChatId,
    messages: msgs,
    aiMode: mode,
    currentLocation: loc,
    gameClock: clockVal,
    maxSuspicion: suspVal,
    sharedFacts: facts,
    storyLog: story,
    chatModes: modes,
    rumorLogs: rumors,
  };
}

function getInitialStateAfterClear(): RoleplayStoreState {
  return {
    userProfile: null,
    characters: CHARACTERS.map(c => ({
      ...c,
      sexCount: 0,
      ejaculatedVagina: 0,
      ejaculatedAnus: 0,
      ejaculatedMouth: 0,
    })),
    groupChats: [],
    selectedChatId: "max",
    messages: {},
    aiMode: "standard",
    currentLocation: "apartment",
    gameClock: 12,
    maxSuspicion: 0,
    sharedFacts: [],
    storyLog: null,
    chatModes: {},
    rumorLogs: [],
  };
}

function storeReducer(state: RoleplayStoreState, action: StoreAction): RoleplayStoreState {
  switch (action.type) {
    case "SET_USER_PROFILE":
      return { ...state, userProfile: action.payload };
    case "SET_CHARACTERS":
      return {
        ...state,
        characters: typeof action.payload === "function" ? action.payload(state.characters) : action.payload
      };
    case "SET_GROUP_CHATS":
      return {
        ...state,
        groupChats: typeof action.payload === "function" ? action.payload(state.groupChats) : action.payload
      };
    case "SET_SELECTED_CHAT_ID":
      return { ...state, selectedChatId: action.payload };
    case "SET_MESSAGES":
      return {
        ...state,
        messages: typeof action.payload === "function" ? action.payload(state.messages) : action.payload
      };
    case "SET_AI_MODE":
      return { ...state, aiMode: action.payload };
    case "SET_CURRENT_LOCATION":
      return {
        ...state,
        currentLocation: typeof action.payload === "function" ? action.payload(state.currentLocation) : action.payload
      };
    case "SET_GAME_CLOCK":
      return {
        ...state,
        gameClock: typeof action.payload === "function" ? action.payload(state.gameClock) : action.payload
      };
    case "SET_MAX_SUSPICION":
      return {
        ...state,
        maxSuspicion: typeof action.payload === "function" ? action.payload(state.maxSuspicion) : action.payload
      };
    case "SET_SHARED_FACTS":
      return {
        ...state,
        sharedFacts: typeof action.payload === "function" ? action.payload(state.sharedFacts) : action.payload
      };
    case "SET_STORY_LOG":
      return {
        ...state,
        storyLog: typeof action.payload === "function" ? action.payload(state.storyLog) : action.payload
      };
    case "SET_CHAT_MODES":
      return {
        ...state,
        chatModes: typeof action.payload === "function" ? action.payload(state.chatModes) : action.payload
      };
    case "SET_RUMOR_LOGS":
      return {
        ...state,
        rumorLogs: typeof action.payload === "function" ? action.payload(state.rumorLogs) : action.payload
      };
    case "SET_FULL_STATE":
      return action.payload;
    case "RESET_STORE":
      return getInitialStateAfterClear();
    default:
      return state;
  }
}

// Strip out base64 photos and save them to IndexedDB, returning a clean state for localStorage
async function extractAndSavePhotos(state: RoleplayStoreState): Promise<RoleplayStoreState> {
  const cleanState = { ...state };

  try {
    // 1. User profile photo
    if (cleanState.userProfile && cleanState.userProfile.photo) {
      const photoStr = cleanState.userProfile.photo;
      if (photoStr.startsWith("data:image/") && photoStr.length > 100) {
        await setDbItem("user_profile_photo", photoStr);
        cleanState.userProfile = {
          ...cleanState.userProfile,
          photo: "idb_ref:user_profile_photo"
        };
      }
    }

    // 2. Message attachment photos
    if (cleanState.messages) {
      const messagesCopy = { ...cleanState.messages };
      let updatedAnyMessage = false;

      for (const chatId of Object.keys(messagesCopy)) {
        const chatMsgs = messagesCopy[chatId];
        if (!chatMsgs) continue;

        let chatCopy: Message[] | null = null;
        for (let i = 0; i < chatMsgs.length; i++) {
          const msg = chatMsgs[i];
          if (msg.image && msg.image.startsWith("data:image/") && msg.image.length > 100) {
            if (!chatCopy) chatCopy = [...chatMsgs];
            const imgKey = `message_photo_${msg.id}`;
            await setDbItem(imgKey, msg.image);
            chatCopy[i] = {
              ...msg,
              image: `idb_ref:${imgKey}`
            };
            updatedAnyMessage = true;
          }
        }
        if (chatCopy) {
          messagesCopy[chatId] = chatCopy;
        }
      }

      if (updatedAnyMessage) {
        cleanState.messages = messagesCopy;
      }
    }
  } catch (e) {
    console.warn("Error in extractAndSavePhotos:", e);
  }

  return cleanState;
}

// Restore photos from IndexedDB into the in-memory state
async function restorePhotosFromDb(state: RoleplayStoreState, onUpdate: (restoredState: RoleplayStoreState) => void): Promise<void> {
  const restoredState = JSON.parse(JSON.stringify(state)) as RoleplayStoreState;
  let didChange = false;

  try {
    // 1. User profile photo
    if (restoredState.userProfile && restoredState.userProfile.photo === "idb_ref:user_profile_photo") {
      const photoStr = await getDbItem("user_profile_photo");
      if (photoStr) {
        restoredState.userProfile.photo = photoStr;
        didChange = true;
      } else {
        restoredState.userProfile.photo = null;
        didChange = true;
      }
    }

    // 2. Message attachment photos
    if (restoredState.messages) {
      for (const chatId of Object.keys(restoredState.messages)) {
        const chatMsgs = restoredState.messages[chatId];
        if (!chatMsgs) continue;

        for (let i = 0; i < chatMsgs.length; i++) {
          const msg = chatMsgs[i];
          if (msg.image && msg.image.startsWith("idb_ref:")) {
            const imgKey = msg.image.replace("idb_ref:", "");
            const photoStr = await getDbItem(imgKey);
            if (photoStr) {
              chatMsgs[i].image = photoStr;
              didChange = true;
            } else {
              delete chatMsgs[i].image;
              didChange = true;
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("Error in restorePhotosFromDb:", e);
  }

  if (didChange) {
    onUpdate(restoredState);
  }
}

export function usePersistentStore() {
  const [state, dispatch] = useReducer(storeReducer, null, getInitialState);
  const isInitialMount = useRef(true);

  // Load photos asynchronously on mount
  useEffect(() => {
    let active = true;
    async function loadImages() {
      try {
        await restorePhotosFromDb(state, (restoredState) => {
          if (active) {
            dispatch({ type: "SET_FULL_STATE", payload: restoredState });
          }
        });
      } catch (e) {
        console.error("Failed to restore photos from IndexedDB", e);
      }
    }
    loadImages();
    return () => {
      active = false;
    };
  }, []);

  // Debounced synchronization effect with localStorage
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handle = setTimeout(async () => {
      try {
        const cleanState = await extractAndSavePhotos(state);
        localStorage.setItem("roleplay_unified_store_v2", JSON.stringify(cleanState));
      } catch (e) {
        console.error("Failed to sync unified store to localStorage", e);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(handle);
  }, [state]);

  // Setters
  const setUserProfile = (payload: UserProfile | null) => {
    dispatch({ type: "SET_USER_PROFILE", payload });
  };

  const setCharacters = (payload: Character[] | ((prev: Character[]) => Character[])) => {
    dispatch({ type: "SET_CHARACTERS", payload });
  };

  const setGroupChats = (payload: GroupChat[] | ((prev: GroupChat[]) => GroupChat[])) => {
    dispatch({ type: "SET_GROUP_CHATS", payload });
  };

  const setSelectedChatId = (payload: string) => {
    dispatch({ type: "SET_SELECTED_CHAT_ID", payload });
  };

  const setMessages = (payload: Record<string, Message[]> | ((prev: Record<string, Message[]>) => Record<string, Message[]>)) => {
    dispatch({ type: "SET_MESSAGES", payload });
  };

  const setAiMode = (payload: "standard" | "high_thinking" | "low_latency") => {
    dispatch({ type: "SET_AI_MODE", payload });
  };

  const setCurrentLocation = (payload: string | ((prev: string) => string)) => {
    dispatch({ type: "SET_CURRENT_LOCATION", payload });
  };

  const setGameClock = (payload: number | ((prev: number) => number)) => {
    dispatch({ type: "SET_GAME_CLOCK", payload });
  };

  const setMaxSuspicion = (payload: number | ((prev: number) => number)) => {
    dispatch({ type: "SET_MAX_SUSPICION", payload });
  };

  const setSharedFacts = (payload: SharedFact[] | ((prev: SharedFact[]) => SharedFact[])) => {
    dispatch({ type: "SET_SHARED_FACTS", payload });
  };

  const setStoryLog = (payload: StoryLog | null | ((prev: StoryLog | null) => StoryLog | null)) => {
    dispatch({ type: "SET_STORY_LOG", payload });
  };

  const setChatModes = (payload: Record<string, "chat" | "call" | "live"> | ((prev: Record<string, "chat" | "call" | "live">) => Record<string, "chat" | "call" | "live">)) => {
    dispatch({ type: "SET_CHAT_MODES", payload });
  };

  const setRumorLogs = (payload: any[] | ((prev: any[]) => any[])) => {
    dispatch({ type: "SET_RUMOR_LOGS", payload });
  };

  const resetStore = () => {
    dispatch({ type: "RESET_STORE" });
  };

  return {
    ...state,
    userProfile: state.userProfile,
    characters: state.characters,
    groupChats: state.groupChats,
    selectedChatId: state.selectedChatId,
    messages: state.messages,
    aiMode: state.aiMode,
    currentLocation: state.currentLocation,
    gameClock: state.gameClock,
    maxSuspicion: state.maxSuspicion,
    sharedFacts: state.sharedFacts,
    storyLog: state.storyLog,
    chatModes: state.chatModes,
    rumorLogs: state.rumorLogs,
    setUserProfile,
    setCharacters,
    setGroupChats,
    setSelectedChatId,
    setMessages,
    setAiMode,
    setCurrentLocation,
    setGameClock,
    setMaxSuspicion,
    setSharedFacts,
    setStoryLog,
    setChatModes,
    setRumorLogs,
    resetStore,
  };
}
