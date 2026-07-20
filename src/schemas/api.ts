import { z } from "zod";

// Base64 limit: 50MB (approximately 52428800 characters)
const BASE64_MAX_SIZE = 52428800;

// Shared character relationships & scales
export const scalesSchema = z.object({
  trust: z.number().min(0).max(100),
  love: z.number().min(0).max(100),
  lust: z.number().min(0).max(100),
  anger: z.number().min(0).max(100),
  intimacy: z.number().min(0).max(100).optional().nullable(),
});

export const characterSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(200),
  role: z.string().max(500),
  group: z.enum(["Друзья", "Семья", "Работа", "Соседи"]),
  personality: z.string().max(10000),
  speechStyle: z.string().max(5000).optional().nullable(),
  attitude: z.string().max(2000),
  greeting: z.string().max(10000).optional().nullable(),
  status: z.string().max(100).optional().nullable(),
  avatarColor: z.string().max(100).optional().nullable(),
  penisSize: z.number().optional().nullable(),
  penisSizeDiscovered: z.boolean().optional().nullable(),
  ejaculatedOnPhoto: z.number().optional().nullable(),
  ejaculatedInside: z.number().optional().nullable(),
  ballFullness: z.number().optional().nullable(),
  scales: scalesSchema.optional().nullable(),
  fetishes: z.array(z.string().max(500)).max(100).optional().nullable(),
  inclinations: z.array(z.string().max(500)).max(100).optional().nullable(),
});

export const messageSchema = z.object({
  id: z.string().max(100),
  role: z.enum(["user", "model", "narrator"]),
  content: z.string().max(50000),
  senderId: z.string().max(100).optional().nullable(),
  timestamp: z.string().max(100).optional().nullable(),
  image: z.string().max(BASE64_MAX_SIZE).optional().nullable(),
  isVoice: z.boolean().optional().nullable(),
  isCall: z.boolean().optional().nullable(),
  isLive: z.boolean().optional().nullable(),
});

export const sharedFactSchema = z.object({
  id: z.string().max(100),
  text: z.string().max(5000),
  sourceCharacterId: z.string().max(100).optional().nullable(),
  timestamp: z.string().max(100).optional().nullable(),
  knownBy: z.array(z.string().max(100)).max(100).optional().nullable(),
});

export const appearanceSchema = z.object({
  face: z.string().max(10000),
  chest: z.string().max(10000),
  waist: z.string().max(10000),
  hips: z.string().max(10000),
  intimate: z.string().max(10000),
  legs: z.string().max(10000),
  overall: z.string().max(10000),
  vagina: z.string().max(10000).optional().nullable(),
  anus: z.string().max(10000).optional().nullable(),
  faceScore: z.number().min(0).max(100).optional().nullable(),
  chestScore: z.number().min(0).max(100).optional().nullable(),
  waistScore: z.number().min(0).max(100).optional().nullable(),
  hipsScore: z.number().min(0).max(100).optional().nullable(),
  vaginaScore: z.number().min(0).max(100).optional().nullable(),
  anusScore: z.number().min(0).max(100).optional().nullable(),
  legsScore: z.number().min(0).max(100).optional().nullable(),
});

export const userProfileSchema = z.object({
  name: z.string().max(100),
  gender: z.enum(["Мужской", "Женский", "Другой"]),
  age: z.number().min(0).max(150),
  bio: z.string().max(10000),
  traits: z.string().max(10000),
  attractiveness: z.number().min(0).max(100).optional().nullable(),
  appearance: appearanceSchema.optional().nullable(),
  photo: z.string().max(BASE64_MAX_SIZE).optional().nullable(),
  detailedAnalysis: z.string().max(50000).optional().nullable(),
  imageSceneDescription: z.string().max(50000).optional().nullable(),
  plotContext: z.string().max(50000).optional().nullable(),
});

export const storyLogSchema = z.object({
  storySummary: z.string().max(50000),
  keyChapters: z.array(z.string().max(500)).max(100),
});

// Endpoint schemas

export const apiChatSchema = z.object({
  character: characterSchema,
  messages: z.array(messageSchema).max(1000), // Protect against overly long dialogue histories
  sharedFacts: z.array(z.string().max(10000)).max(500).optional().nullable(),
  isVoice: z.boolean().optional().nullable(),
  attachedImage: z.string().max(BASE64_MAX_SIZE).optional().nullable(),
  userProfile: userProfileSchema.optional().nullable(),
  groupParticipants: z.array(z.string().max(200)).max(50).optional().nullable(),
  isCall: z.boolean().optional().nullable(),
  isLive: z.boolean().optional().nullable(),
  aiMode: z.string().max(50).optional().nullable(),
  storyLog: storyLogSchema.optional().nullable(),
});

export const apiStorytellerSchema = z.object({
  userProfile: userProfileSchema.optional().nullable(),
  sharedFacts: z.array(sharedFactSchema).max(500).optional().nullable(),
  messagesSummary: z.string().max(100000).optional().nullable(),
  customDirective: z.string().max(5000).optional().nullable(),
  aiMode: z.string().max(50).optional().nullable(),
});

export const apiThoughtsSchema = z.object({
  character: characterSchema,
  messages: z.array(messageSchema).max(1000),
  sharedFacts: z.array(z.string().max(10000)).max(500).optional().nullable(),
  userProfile: userProfileSchema.optional().nullable(),
  aiMode: z.string().max(50).optional().nullable(),
  storyLog: storyLogSchema.optional().nullable(),
});

export const apiEvaluateProfilePhotoSchema = z.object({
  photo: z.string().max(BASE64_MAX_SIZE),
});

export const apiEvaluateAppearanceTextSchema = z.object({
  face: z.string().max(10000).optional().nullable(),
  chest: z.string().max(10000).optional().nullable(),
  waist: z.string().max(10000).optional().nullable(),
  hips: z.string().max(10000).optional().nullable(),
  intimate: z.string().max(10000).optional().nullable(),
  vagina: z.string().max(10000).optional().nullable(),
  anus: z.string().max(10000).optional().nullable(),
  legs: z.string().max(10000).optional().nullable(),
  overall: z.string().max(10000).optional().nullable(),
  faceScore: z.number().min(0).max(100).optional().nullable(),
  chestScore: z.number().min(0).max(100).optional().nullable(),
  waistScore: z.number().min(0).max(100).optional().nullable(),
  hipsScore: z.number().min(0).max(100).optional().nullable(),
  vaginaScore: z.number().min(0).max(100).optional().nullable(),
  anusScore: z.number().min(0).max(100).optional().nullable(),
  legsScore: z.number().min(0).max(100).optional().nullable(),
  attractiveness: z.number().min(0).max(100).optional().nullable(),
});

export const apiGenerateHeroineReplySchema = z.object({
  character: characterSchema,
  greetingText: z.string().max(10000),
  userProfile: userProfileSchema.optional().nullable(),
});

export const apiGenerateHeroineChatReplySchema = z.object({
  character: characterSchema,
  messages: z.array(messageSchema).max(1000),
  userProfile: userProfileSchema.optional().nullable(),
  storyLog: storyLogSchema.optional().nullable(),
});

export const apiInteractiveSeductionSchema = z.object({
  character: characterSchema,
  choice: z.string().max(10000),
  history: z.array(z.object({
    role: z.enum(["user", "model", "narrator"]),
    content: z.string().max(50000),
    timestamp: z.string().max(100).optional().nullable(),
  })).max(500),
  userProfile: userProfileSchema.optional().nullable(),
  aiMode: z.string().max(50).optional().nullable(),
});
