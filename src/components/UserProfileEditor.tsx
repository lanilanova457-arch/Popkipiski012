import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, X, RefreshCw } from "lucide-react";
import { UserProfile } from "../types";
import { getPartRatingText } from "../utils/helpers";

interface UserProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  profileName: string;
  setProfileName: (v: string) => void;
  profilePhoto: string | null;
  setProfilePhoto: (v: string | null) => void;
  isEvaluatingPhoto: boolean;
  evaluationError: string | null;
  handlePhotoUploadAndEvaluation: (file: File) => void;
  profileAge: number;
  setProfileAge: (v: number) => void;
  profileAttractiveness: number;
  setProfileAttractiveness: (v: number) => void;
  profileTraits: string;
  setProfileTraits: (v: string) => void;
  profileBio: string;
  setProfileBio: (v: string) => void;
  faceScore: number;
  setFaceScore: (v: number) => void;
  profileFace: string;
  setProfileFace: (v: string) => void;
  chestScore: number;
  setChestScore: (v: number) => void;
  profileChest: string;
  setProfileChest: (v: string) => void;
  waistScore: number;
  setWaistScore: (v: number) => void;
  profileWaist: string;
  setProfileWaist: (v: string) => void;
  hipsScore: number;
  setHipsScore: (v: number) => void;
  profileHips: string;
  setProfileHips: (v: string) => void;
  vaginaScore: number;
  setVaginaScore: (v: number) => void;
  profileVagina: string;
  setProfileVagina: (v: string) => void;
  setProfileIntimate: (v: string) => void;
  anusScore: number;
  setAnusScore: (v: number) => void;
  profileAnus: string;
  setProfileAnus: (v: string) => void;
  legsScore: number;
  setLegsScore: (v: number) => void;
  profileLegs: string;
  setProfileLegs: (v: string) => void;
  profileOverall: string;
  setProfileOverall: (v: string) => void;
  profileDetailedAnalysis: string;
  profileImageSceneDescription: string;
  profilePlotContext: string;
  handleSaveProfile: (e: React.FormEvent) => void;
  handleResetData: () => void;
}

export const UserProfileEditor: React.FC<UserProfileEditorProps> = ({
  isOpen,
  onClose,
  userProfile,
  profileName,
  setProfileName,
  profilePhoto,
  setProfilePhoto,
  isEvaluatingPhoto,
  evaluationError,
  handlePhotoUploadAndEvaluation,
  profileAge,
  setProfileAge,
  profileAttractiveness,
  setProfileAttractiveness,
  profileTraits,
  setProfileTraits,
  profileBio,
  setProfileBio,
  faceScore,
  setFaceScore,
  profileFace,
  setProfileFace,
  chestScore,
  setChestScore,
  profileChest,
  setProfileChest,
  waistScore,
  setWaistScore,
  profileWaist,
  setProfileWaist,
  hipsScore,
  setHipsScore,
  profileHips,
  setProfileHips,
  vaginaScore,
  setVaginaScore,
  profileVagina,
  setProfileVagina,
  setProfileIntimate,
  anusScore,
  setAnusScore,
  profileAnus,
  setProfileAnus,
  legsScore,
  setLegsScore,
  profileLegs,
  setProfileLegs,
  profileOverall,
  setProfileOverall,
  profileDetailedAnalysis,
  profileImageSceneDescription,
  profilePlotContext,
  handleSaveProfile,
  handleResetData
}) => {
  return (
    <AnimatePresence>
      {isOpen && userProfile && (
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
              <button
                type="button"
                onClick={onClose}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
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
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-medium"
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
                            <img src={profilePhoto} alt="GG Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg text-center transition-all select-none ${
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
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-medium"
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
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Короткая Био *</label>
                      <textarea
                        required
                        rows={2.5}
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-medium"
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
                    onClick={onClose}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold text-[11px] cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[11px] cursor-pointer"
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
  );
};
