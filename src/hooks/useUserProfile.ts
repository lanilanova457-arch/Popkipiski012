import { useState, useEffect, Dispatch, SetStateAction, FormEvent } from "react";
import { UserProfile, Character } from "../types";
import { safeSetLocalStorage, compressImage } from "../utils/helpers";
import { api } from "../api/client";

export function useUserProfile(
  setCharacters: Dispatch<SetStateAction<Character[]>>,
  setGossipNotification: (text: string | null) => void
) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("roleplay_user_profile_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          parsed.gender = "Женский";
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing user profile", e);
      }
    }
    return null;
  });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFormError, setProfileFormError] = useState<string | null>(null);
  const [isEvaluatingPhoto, setIsEvaluatingPhoto] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [setupStage, setSetupStage] = useState(0);

  const [profileName, setProfileName] = useState(userProfile?.name || "");
  const [profileGender, setProfileGender] = useState<"Мужской" | "Женский" | "Другой">(userProfile?.gender || "Женский");
  const [profileAge, setProfileAge] = useState<number>(userProfile?.age || 23);
  const [profileBio, setProfileBio] = useState(userProfile?.bio || "");
  const [profileTraits, setProfileTraits] = useState(userProfile?.traits || "");
  const [profileAttractiveness, setProfileAttractiveness] = useState<number>(userProfile?.attractiveness ?? 80);

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

  const [profilePhoto, setProfilePhoto] = useState<string | null>(userProfile?.photo || null);
  const [profileDetailedAnalysis, setProfileDetailedAnalysis] = useState(userProfile?.detailedAnalysis || "");
  const [profileImageSceneDescription, setProfileImageSceneDescription] = useState(userProfile?.imageSceneDescription || "");
  const [profilePlotContext, setProfilePlotContext] = useState(userProfile?.plotContext || "");

  useEffect(() => {
    safeSetLocalStorage("roleplay_user_profile_v2", userProfile ? JSON.stringify(userProfile) : "");
  }, [userProfile]);

  const openProfileModal = () => {
    if (userProfile) {
      setProfileName(userProfile.name);
      setProfileGender(userProfile.gender);
      setProfileAge(userProfile.age);
      setProfileBio(userProfile.bio);
      setProfileTraits(userProfile.traits);
      setProfilePhoto(userProfile.photo || null);
      if (userProfile.appearance) {
        setProfileFace(userProfile.appearance.face);
        setProfileChest(userProfile.appearance.chest);
        setProfileWaist(userProfile.appearance.waist);
        setProfileHips(userProfile.appearance.hips);
        setProfileIntimate(userProfile.appearance.intimate);
        setProfileLegs(userProfile.appearance.legs);
        setProfileOverall(userProfile.appearance.overall);
        setProfileVagina(userProfile.appearance.vagina || "Нежная, узкая розовая вагина");
        setProfileAnus(userProfile.appearance.anus || "Аккуратная, отбеленная попка");

        setFaceScore(userProfile.appearance.faceScore);
        setChestScore(userProfile.appearance.chestScore);
        setWaistScore(userProfile.appearance.waistScore);
        setHipsScore(userProfile.appearance.hipsScore);
        setVaginaScore(userProfile.appearance.vaginaScore || 80);
        setAnusScore(userProfile.appearance.anusScore || 80);
        setLegsScore(userProfile.appearance.legsScore);
      }
      setProfileDetailedAnalysis(userProfile.detailedAnalysis || "");
      setProfileImageSceneDescription(userProfile.imageSceneDescription || "");
      setProfilePlotContext(userProfile.plotContext || "");
      setProfileAttractiveness(userProfile.attractiveness ?? 80);
    }
    setShowProfileModal(true);
  };

  const handlePhotoUploadAndEvaluation = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      setIsEvaluatingPhoto(true);
      setEvaluationError(null);

      const base64Str = await compressImage(rawBase64);
      setProfilePhoto(base64Str);

      try {
        const data = await api.evaluateProfilePhoto(base64Str);
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

          // Calculate average attractiveness from Gemini parameters
          const scoresSum = 
            (data.faceScore || 80) + 
            (data.chestScore || 80) + 
            (data.waistScore || 80) + 
            (data.hipsScore || 80) + 
            (data.legsScore || 80);
          const avgScore = Math.round(scoresSum / 5);
          setProfileAttractiveness(avgScore);
        }
      } catch (err) {
        console.error("Evaluation photo API error:", err);
        setEvaluationError("Не удалось выполнить анализ лица и тела через ИИ. Заполните параметры вручную.");
      } finally {
        setIsEvaluatingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileFormError(null);

    if (!profileName.trim() || !profileBio.trim()) {
      setProfileFormError("⚠️ Пожалуйста, заполните имя и краткую биографию героини.");
      return;
    }

    setIsSavingProfile(true);
    setSetupStage(1); // Stage 1: Saving profile database

    await new Promise(resolve => setTimeout(resolve, 200));
    setSetupStage(2); // Stage 2: Running physical parameters check

    if (!profilePhoto) {
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
      try {
        const data = await api.evaluateAppearanceText({
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
        });
        if (data.lustScores) {
          setCharacters(prev => prev.map(c => {
            const score = data.lustScores?.[c.id];
            return score !== undefined ? {
              ...c,
              scales: c.scales ? { ...c.scales, lust: score } : { trust: 50, love: 0, lust: score, anger: 0 }
            } : c;
          }));
        }
      } catch (err) {
        console.log("Evaluation of appearance text complete with fallback/result.");
      }
    }

    await new Promise(resolve => setTimeout(resolve, 200));
    setSetupStage(3);

    await new Promise(resolve => setTimeout(resolve, 150));
    setSetupStage(4);

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

  return {
    userProfile,
    setUserProfile,
    showProfileModal,
    setShowProfileModal,
    profileFormError,
    setProfileFormError,
    isEvaluatingPhoto,
    setIsEvaluatingPhoto,
    evaluationError,
    setEvaluationError,
    isSavingProfile,
    setIsSavingProfile,
    setupStage,
    setSetupStage,
    profileName,
    setProfileName,
    profileGender,
    setProfileGender,
    profileAge,
    setProfileAge,
    profileBio,
    setProfileBio,
    profileTraits,
    setProfileTraits,
    profileAttractiveness,
    setProfileAttractiveness,
    profileFace,
    setProfileFace,
    profileChest,
    setProfileChest,
    profileWaist,
    setProfileWaist,
    profileHips,
    setProfileHips,
    profileIntimate,
    setProfileIntimate,
    profileLegs,
    setProfileLegs,
    profileOverall,
    setProfileOverall,
    profileVagina,
    setProfileVagina,
    profileAnus,
    setProfileAnus,
    faceScore,
    setFaceScore,
    chestScore,
    setChestScore,
    waistScore,
    setWaistScore,
    hipsScore,
    setHipsScore,
    vaginaScore,
    setVaginaScore,
    anusScore,
    setAnusScore,
    legsScore,
    setLegsScore,
    profilePhoto,
    setProfilePhoto,
    profileDetailedAnalysis,
    setProfileDetailedAnalysis,
    profileImageSceneDescription,
    setProfileImageSceneDescription,
    profilePlotContext,
    setProfilePlotContext,
    openProfileModal,
    handlePhotoUploadAndEvaluation,
    handleSaveProfile
  };
}
