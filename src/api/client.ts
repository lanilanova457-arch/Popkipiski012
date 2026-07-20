import { Character, Message, SharedFact, UserProfile, StoryLog, UserAppearance } from "../types";

export interface EvaluateAppearanceTextRequest {
  face: string;
  chest: string;
  waist: string;
  hips: string;
  intimate: string;
  vagina: string;
  anus: string;
  legs: string;
  overall: string;
  faceScore: number;
  chestScore: number;
  waistScore: number;
  hipsScore: number;
  vaginaScore: number;
  anusScore: number;
  legsScore: number;
  attractiveness: number;
}

export interface EvaluateAppearanceTextResponse {
  lustScores?: Record<string, number>;
}

export interface EvaluateProfilePhotoResponse {
  face?: string;
  chest?: string;
  waist?: string;
  hips?: string;
  intimate?: string;
  vagina?: string;
  anus?: string;
  legs?: string;
  overall?: string;
  detailedAnalysis?: string;
  imageSceneDescription?: string;
  plotContext?: string;
  faceScore?: number;
  chestScore?: number;
  waistScore?: number;
  hipsScore?: number;
  vaginaScore?: number;
  anusScore?: number;
  legsScore?: number;
}

export interface InteractiveSeductionRequest {
  character: Character;
  choice: string;
  history: { role: "user" | "model" | "narrator"; content: string; timestamp: string }[];
  userProfile: UserProfile | null;
  aiMode: string;
}

export interface SeductionAdjustment {
  trust?: number;
  love?: number;
  lust?: number;
  anger?: number;
  intimacy?: number;
}

export interface InteractiveSeductionResponse {
  narrative: string;
  suggestedChoices?: string[];
  isFinished?: boolean;
  scaleAdjustments?: SeductionAdjustment;
  ballFullness?: number;
  ejaculatedOnPhoto?: number;
  ejaculatedOnPhotoAdjustment?: number;
  ejaculatedInside?: number;
  ejaculatedInsideAdjustment?: number;
  ejaculatedVagina?: number;
  ejaculatedVaginaAdjustment?: number;
  ejaculatedAnus?: number;
  ejaculatedAnusAdjustment?: number;
  ejaculatedMouth?: number;
  ejaculatedMouthAdjustment?: number;
  sexCountIncrement?: number;
  penisSizeDiscovered?: boolean;
}

export interface GetThoughtsRequest {
  character: Character;
  messages: Message[];
  sharedFacts: string[];
  userProfile: UserProfile | null;
  aiMode: string;
  storyLog: StoryLog | null;
}

export interface GetThoughtsResponse {
  thoughts: string;
  motives: string;
  visualAttitude: string;
  nextActionPlan: string;
}

export interface GenerateHeroineChatReplyRequest {
  character: any;
  messages: Message[];
  userProfile: UserProfile | null;
  storyLog: StoryLog | null;
}

export interface GenerateHeroineChatReplyResponse {
  reply: string;
}

export interface SendChatMessageRequest {
  character: any;
  messages: Message[];
  sharedFacts: string[];
  isVoice: boolean;
  isCall: boolean;
  isLive: boolean;
  attachedImage: string | null;
  userProfile: UserProfile | null;
  groupParticipants?: string[];
  aiMode: string;
  storyLog: StoryLog | null;
}

export interface SendChatMessageResponse {
  reply: string;
  generatedImage?: string;
  scaleAdjustments?: SeductionAdjustment;
  newSharedFacts?: string[];
  ballFullness?: number;
  dynamicStatus?: string;
  dynamicAttitude?: string;
  ejaculatedOnPhotoAdjustment?: number;
  ejaculatedInsideAdjustment?: number;
  penisSizeDiscovered?: boolean;
  ejaculatedVagina?: number;
  ejaculatedAnus?: number;
  ejaculatedMouth?: number;
  sexCountIncrement?: number;
  quickReplies?: string[];
}

export interface GenerateStoryRequest {
  userProfile: UserProfile | null;
  sharedFacts: SharedFact[];
  messagesSummary: string;
  customDirective: string;
  aiMode: string;
}

export interface GenerateStoryResponse {
  storySummary: string;
  keyChapters: string[];
  newSharedFacts?: string[];
}

export interface GenerateHeroineReplyRequest {
  character: any;
  greetingText: string;
  userProfile: UserProfile;
}

export interface GenerateHeroineReplyResponse {
  reply: string;
}

export const api = {
  async evaluateAppearanceText(req: EvaluateAppearanceTextRequest): Promise<EvaluateAppearanceTextResponse> {
    const res = await fetch("/api/evaluate-appearance-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async evaluateProfilePhoto(photo: string): Promise<EvaluateProfilePhotoResponse> {
    const res = await fetch("/api/evaluate-profile-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async interactiveSeduction(req: InteractiveSeductionRequest): Promise<InteractiveSeductionResponse> {
    const res = await fetch("/api/interactive-seduction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async getThoughts(req: GetThoughtsRequest): Promise<GetThoughtsResponse> {
    const res = await fetch("/api/thoughts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async generateHeroineChatReply(req: GenerateHeroineChatReplyRequest): Promise<GenerateHeroineChatReplyResponse> {
    const res = await fetch("/api/generate-heroine-chat-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async sendChatMessage(req: SendChatMessageRequest): Promise<SendChatMessageResponse> {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async generateStory(req: GenerateStoryRequest): Promise<GenerateStoryResponse> {
    const res = await fetch("/api/storyteller", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async generateHeroineReply(req: GenerateHeroineReplyRequest): Promise<GenerateHeroineReplyResponse> {
    const res = await fetch("/api/generate-heroine-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  }
};
