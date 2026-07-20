export interface Message {
  id: string;
  role: "user" | "model" | "narrator";
  senderId?: string; // ID of the character who sent it (if role is "model" in group chats or personal)
  content: string;
  timestamp: string;
  isVoice?: boolean;
  isCall?: boolean; // if this message was sent as part of a text call
  isLive?: boolean; // if this message was sent as part of an in-person meeting
  image?: string; // base64 image data URL
}

export interface Character {
  id: string;
  name: string;
  role: string;
  status: string; // Dynamic status e.g., "В сети", "Злится", "Пьяный", "Спит", etc.
  avatarColor: string;
  group: "Друзья" | "Семья" | "Работа" | "Соседи" | "Все";
  personality: string;
  speechStyle: string;
  attitude: string; // Dynamic attitude towards user
  initialMessage: string;
  suggestedGreetings: string[];
  scales?: {
    trust: number; // 0-100
    love: number;  // 0-100
    lust: number;  // 0-100
    anger: number; // 0-100
    intimacy?: number; // 0-100 (Близость)
  };
  fetishes?: string[];
  inclinations?: string[];
  penisSize?: number;
  penisSizeDiscovered?: boolean;
  ballFullness?: number; // 0-100 for male characters
  ejaculatedOnPhoto?: number; // ml simply masturbating on photos
  ejaculatedInside?: number; // ml inside the heroine
  sexCount?: number; // количество раз занятий сексом с героиней
  ejaculatedVagina?: number; // количество спермы в вагине, мл
  ejaculatedAnus?: number; // количество спермы в анусе, мл
  ejaculatedMouth?: number; // количество спермы во рту, мл
}

export interface SharedFact {
  id: string;
  text: string;
  timestamp: string;
  sourceCharacterId: string; // which character revealed it or "user"
  group: "Друзья" | "Семья" | "Работа" | "Соседи" | "Все";
  knownBy?: string[]; // character IDs who know this fact/rumor
}

export interface UserAppearance {
  face: string;
  chest: string;
  waist: string;
  hips: string;
  intimate: string;
  legs: string;
  overall: string;
  vagina: string;
  anus: string;
  faceScore: number;
  chestScore: number;
  waistScore: number;
  hipsScore: number;
  vaginaScore: number;
  anusScore: number;
  legsScore: number;
}

export interface UserProfile {
  name: string;
  gender: "Мужской" | "Женский" | "Другой";
  age: number;
  bio: string;
  traits: string; // Traits/Personality
  appearance?: UserAppearance;
  photo?: string; // Base64 image data URI of GG
  detailedAnalysis?: string;
  imageSceneDescription?: string;
  plotContext?: string;
  attractiveness?: number;
}

export interface GroupChat {
  id: string;
  name: string;
  avatarColor: string;
  participantIds: string[]; // Character IDs
}

export interface CallState {
  characterId: string;
  status: "calling" | "connected";
  duration: number;
  type: "phone" | "in_person";
}

export interface StoryLog {
  storySummary: string;
  keyChapters: string[];
  lastUpdated: string;
}
