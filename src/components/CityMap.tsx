import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, 
  Briefcase, 
  Wrench, 
  Layers, 
  Wine, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Navigation, 
  CheckCircle2, 
  User, 
  Radio, 
  Flame, 
  HelpCircle,
  TrendingUp,
  Heart,
  ShieldAlert,
  Frown,
  RefreshCw
} from "lucide-react";
import { Character, SharedFact } from "../types";

export interface LocationDetails {
  id: string;
  name: string;
  description: string;
  theme: string;
  iconName: "Home" | "Briefcase" | "Wrench" | "Layers" | "Wine";
  color: string;
  coords: { x: number; y: number }; // Percentage coords for the 2D map grid
}

export const LOCATIONS: LocationDetails[] = [
  {
    id: "apartment",
    name: "Квартира Макса",
    description: "Ваш общий дом с мужем. Здесь тепло, но витает дух растущих подозрений. Макс ждет вас тут по вечерам.",
    theme: "from-amber-950/45 via-neutral-900 to-neutral-950 border-amber-500/25",
    iconName: "Home",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    coords: { x: 20, y: 30 }
  },
  {
    id: "office",
    name: "Офис",
    description: "Бизнес-центр. Идеальное прикрытие, чтобы задерживаться допоздна, прикрываясь важными отчетами.",
    theme: "from-sky-950/45 via-neutral-900 to-neutral-950 border-sky-500/25",
    iconName: "Briefcase",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
    coords: { x: 75, y: 25 }
  },
  {
    id: "garage",
    name: "Гараж Артёма",
    description: "Мужской клуб, пропитанный бензином и секретами. Артём и Михалыч проводят тут лучшие часы.",
    theme: "from-emerald-950/45 via-neutral-900 to-neutral-950 border-emerald-500/25",
    iconName: "Wrench",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    coords: { x: 30, y: 75 }
  },
  {
    id: "staircase",
    name: "Подъезд",
    description: "Лестничный пролет. Отсюда Семёныч и соседи ведут круглосуточную слежку и собирают все сплетни дома.",
    theme: "from-zinc-800/40 via-neutral-900 to-neutral-950 border-zinc-700/25",
    iconName: "Layers",
    color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
    coords: { x: 50, y: 50 }
  },
  {
    id: "club",
    name: "Ночной клуб",
    description: "Полумрак, неоновый свет «Неона» и громкие басы. Убежище для ваших самых развратных и пьяных желаний.",
    theme: "from-fuchsia-950/45 via-neutral-900 to-neutral-950 border-fuchsia-500/25",
    iconName: "Wine",
    color: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30",
    coords: { x: 80, y: 70 }
  }
];

interface CityMapProps {
  currentLocation: string;
  onTravel: (locationId: string) => void;
  gameClock: number;
  maxSuspicion: number;
  onUpdateSuspicion: (val: number) => void;
  characters: Character[];
  sharedFacts: SharedFact[];
  onAddGossip: (text: string, characterId: string) => void;
  onResetGame: () => void;
}

export const CityMap = memo(function CityMap({
  currentLocation,
  onTravel,
  gameClock,
  maxSuspicion,
  onUpdateSuspicion,
  characters,
  sharedFacts,
  onAddGossip,
  onResetGame
}: CityMapProps) {
  const [hoveredLoc, setHoveredLoc] = useState<string | null>(null);
  const [showInterrogation, setShowInterrogation] = useState(false);
  const [interrogationAlibi, setInterrogationAlibi] = useState<string | null>(null);
  const [interrogationResult, setInterrogationResult] = useState<{
    success: boolean;
    text: string;
    suspicionChange: number;
  } | null>(null);
  const [previousLocationBeforeTravel, setPreviousLocationBeforeTravel] = useState<string>("apartment");

  // Get current hour representation
  const formatHour = (hour: number) => {
    const adjustedHour = hour % 24;
    return `${adjustedHour.toString().padStart(2, "0")}:00`;
  };

  const getTimeOfDay = (hour: number) => {
    const adjusted = hour % 24;
    if (adjusted >= 6 && adjusted < 12) return { name: "Утро", class: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    if (adjusted >= 12 && adjusted < 18) return { name: "День", class: "text-sky-400 bg-sky-500/10 border-sky-500/20" };
    if (adjusted >= 18 && adjusted < 24) return { name: "Вечер", class: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" };
    return { name: "Ночь", class: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20" };
  };

  const timeInfo = getTimeOfDay(gameClock);

  // Helper function to see which characters are present at a location at the current time of day
  const getCharactersAtLocation = (locId: string, currentHour: number) => {
    const hour = currentHour % 24;
    const isMorning = hour >= 6 && hour < 12;
    const isDay = hour >= 12 && hour < 18;
    const isEvening = hour >= 18 && hour < 24;
    const isNight = hour >= 0 && hour < 6;

    const list: Character[] = [];

    characters.forEach(char => {
      if (char.id === "max" && locId === "apartment") {
        if (isMorning || isEvening || isNight) list.push(char);
      }
      if (char.id === "masha") {
        if (locId === "club" && (isEvening || isNight)) list.push(char);
        if (locId === "apartment" && isDay) list.push(char);
      }
      if (char.id === "artem" && locId === "garage") {
        if (isDay || isEvening || isNight) list.push(char);
      }
      if (char.id === "semenych" && locId === "staircase") {
        if (isMorning || isDay || isEvening) list.push(char);
      }
      if (char.id === "mihalych") {
        if (locId === "garage" && isEvening) list.push(char);
        if (locId === "staircase" && isDay) list.push(char);
      }
      if (char.id === "sergey" && locId === "office") {
        if (isDay || isEvening) list.push(char);
      }
      if (char.id === "neighbor" && locId === "staircase") {
        if (isDay || isEvening) list.push(char);
      }
    });

    return list;
  };

  // Travel action wrapper
  const handleTravelClick = (locId: string) => {
    if (locId === currentLocation) return;

    // Track previous location for alibi calculations
    setPreviousLocationBeforeTravel(currentLocation);

    // Perform travel
    onTravel(locId);

    // If traveling to Apartment and Max is present, trigger a potential interrogation!
    const hour = (gameClock + 1) % 24; // Time of arrival
    const isMaxPresent = hour >= 18 || hour < 12; // Morning, Evening, Night
    
    if (locId === "apartment" && isMaxPresent) {
      // Trigger interrogation modal if suspicion > 10, or returning from late night club / garage (even at low suspicion)
      const isFromSuspiciousPlace = currentLocation === "club" || currentLocation === "garage";
      const isLateTime = hour >= 20 || hour < 6;
      
      if (maxSuspicion > 10 || (isFromSuspiciousPlace && isLateTime)) {
        setTimeout(() => {
          setShowInterrogation(true);
        }, 600);
      }
    } else {
      // If we are at other places, Max might send a suspicious text in chat!
      // Increase suspicion slightly if you are out late with guys
      const isLate = (gameClock + 1) % 24 >= 22 || (gameClock + 1) % 24 < 6;
      if (locId === "garage" && isLate) {
        onUpdateSuspicion(Math.min(100, maxSuspicion + 12));
        onAddGossip(`Семёныч краем глаза заметил, как ГГ заходила в гараж Артёма в районе ${formatHour(gameClock + 1)} ночью.`, "semenych");
      } else if (locId === "club" && isLate) {
        onUpdateSuspicion(Math.min(100, maxSuspicion + 8));
        onAddGossip(`В ночном клубе шепчутся, что ГГ отрывалась до утра без своего мужа.`, "masha");
      }
    }
  };

  // Submit alibi check
  const handleAlibiSubmit = (alibi: string) => {
    setInterrogationAlibi(alibi);

    // Check if player actually is telling the truth or lying
    let isTruth = false;
    if (alibi === "office" && previousLocationBeforeTravel === "office") isTruth = true;
    if (alibi === "club" && previousLocationBeforeTravel === "club") isTruth = true;
    if (alibi === "staircase" && previousLocationBeforeTravel === "staircase") isTruth = true;
    if (alibi === "garage" && previousLocationBeforeTravel === "garage") isTruth = true;
    if (alibi === "apartment" && previousLocationBeforeTravel === "apartment") isTruth = true;

    // Evaluate alibi against Gossip network
    let exposedByGossip = false;
    let exposingGossipText = "";

    // If lying, check if any rumor exposes the true location
    if (!isTruth) {
      // Find rumors matching the actual previous location to catch the lie
      const actualLocName = 
        previousLocationBeforeTravel === "garage" ? "гараж" :
        previousLocationBeforeTravel === "club" ? "клуб" :
        previousLocationBeforeTravel === "staircase" ? "подъезд" :
        previousLocationBeforeTravel === "office" ? "офис" : "квартир";

      const matchedFact = sharedFacts.find(fact => 
        fact.text.toLowerCase().includes(actualLocName) || 
        (previousLocationBeforeTravel === "garage" && fact.text.toLowerCase().includes("артём")) ||
        (previousLocationBeforeTravel === "club" && fact.text.toLowerCase().includes("маш"))
      );

      if (matchedFact) {
        exposedByGossip = true;
        exposingGossipText = matchedFact.text;
      }
    }

    // Determine consequence
    let suspicionChange = 0;
    let resultText = "";
    let success = false;

    if (isTruth) {
      // Telling the truth always relieves Max's stress!
      suspicionChange = -15;
      success = true;
      resultText = `Макс тяжело вздохнул, его плечи расслабились: «Прости, глупая моя... Я просто схожу с ума от ревности, когда тебя нет рядом. Я так люблю тебя. Давай попьем чаю». Вы сказали чистую правду, и подозрения отступили!`;
    } else {
      // Lying!
      if (exposedByGossip) {
        // Catastrophe! Slander/Gossip exposes you!
        suspicionChange = 35;
        success = false;
        resultText = `Макс покраснел от ярости и швырнул телефон на диван: «Ты лжешь мне прямо в глаза! Твердишь про ${
          alibi === "office" ? "офис и работу" : 
          alibi === "club" ? "Машу и девичник" : 
          alibi === "staircase" ? "свежий воздух в подъезде" : "починку машины"
        }, а у меня на руках неопровержимые слухи: "${exposingGossipText}"! За кого ты меня принимаешь?!» Его ревность подскочила до критического уровня!`;
      } else {
        // Safe lie - base chance depending on suspicion
        const randomRoll = Math.random() * 100;
        const failThreshold = 35 + maxSuspicion * 0.4; // higher suspicion makes him more likely to doubt

        if (randomRoll < failThreshold) {
          // Doubts you anyway
          suspicionChange = 25;
          success = false;
          resultText = `Макс недоверчиво сощурился, оглядывая твоё лицо и запах одежды: «Что-то у тебя голос дрожит, дорогая. Да и пахнет от тебя явно не тем, что ты говоришь... Ладно, сделаем вид, что я поверил. Но я буду следить за каждым твоим вздохом». Твое алиби вызвало сильные сомнения!`;
        } else {
          // Believed!
          suspicionChange = -5;
          success = true;
          resultText = `Макс обнял тебя за талию и поцеловал в шею: «Ох, бедная моя девочка... Как же сильно тебя там загоняли. Извини, что накричал, я просто места себе не находил». Ложь прошла безупречно! Вы выкрутились!`;
        }
      }
    }

    // Apply consequences
    const nextSuspicion = Math.max(0, Math.min(100, maxSuspicion + suspicionChange));
    onUpdateSuspicion(nextSuspicion);

    setInterrogationResult({
      success,
      text: resultText,
      suspicionChange
    });
  };

  const closeInterrogation = () => {
    setShowInterrogation(false);
    setInterrogationAlibi(null);
    setInterrogationResult(null);
  };

  // Get SVG icon for locations
  const renderLocIcon = (iconName: string) => {
    const size = "w-5 h-5";
    switch (iconName) {
      case "Home": return <Home className={size} />;
      case "Briefcase": return <Briefcase className={size} />;
      case "Wrench": return <Wrench className={size} />;
      case "Layers": return <Layers className={size} />;
      case "Wine": return <Wine className={size} />;
      default: return <MapPin className={size} />;
    }
  };

  // Total Game Over if suspicion is 100%
  const isGameOver = maxSuspicion >= 100;

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-6 bg-neutral-950 text-left relative" id="city-map-root">
      
      {/* 100% SUSPICION CLIMAX GAME OVER */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center space-y-6 backdrop-blur-lg"
          >
            <div className="w-20 h-20 bg-red-600/20 border border-red-500 rounded-full flex items-center justify-center animate-bounce text-red-500">
              <ShieldAlert className="w-10 h-10" />
            </div>
            
            <div className="max-w-md space-y-3">
              <h1 className="text-3xl font-black text-red-500 uppercase tracking-widest">Брак разрушен!</h1>
              <p className="text-red-300 font-bold text-xs uppercase tracking-wider">Тотальное Разоблачение</p>
              
              <p className="text-neutral-400 text-sm leading-relaxed pt-2">
                Макс собрал все неопровержимые улики, слухи Семёныча и переписки в вашем телефоне. В порыве дикого гнева и ревности он выставил ваши чемоданы за порог квартиры и сменил дверные замки. Ваша тайная двойная жизнь пришла к катастрофическому концу!
              </p>
            </div>

            <button
              onClick={() => {
                onUpdateSuspicion(0);
                onResetGame();
              }}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-red-950 transition-all active:scale-95 cursor-pointer text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Сбросить подозрения мужа и начать заново</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER STATUS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900/45 border border-neutral-850 p-4 rounded-3xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[10px]">Режим навигации</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Интерактивный Город Грез</h2>
          <p className="text-[11px] text-neutral-400 leading-relaxed max-w-xl">
            Путешествуйте по городу, заводите тайные связи вживую и ищите убежища. Каждое путешествие отнимает 1 час, меняя время суток и доступность персонажей.
          </p>
        </div>

        {/* CLOCK & TIME */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-neutral-950 border border-neutral-800 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <Clock className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-xs font-bold text-neutral-400 leading-none">Время дня</p>
              <p className="text-sm font-extrabold text-white mt-1">{formatHour(gameClock)}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${timeInfo.class}`}>
              {timeInfo.name}
            </span>
          </div>
        </div>
      </div>

      {/* MAX SUSPICION PROMINENT BAR */}
      <div className="bg-neutral-900/30 border border-neutral-850 p-4 rounded-3xl space-y-2 relative overflow-hidden shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`w-4 h-4 ${maxSuspicion > 50 ? "text-red-500 animate-pulse" : "text-amber-500"}`} />
            <span className="font-bold text-xs uppercase tracking-wider text-neutral-300">Шкала подозрений мужа (Макса)</span>
          </div>
          <span className={`text-xs font-black ${maxSuspicion > 70 ? "text-red-500" : maxSuspicion > 40 ? "text-amber-500" : "text-emerald-500"}`}>
            {maxSuspicion}% {maxSuspicion >= 80 ? "🔥 Критично!" : maxSuspicion >= 50 ? "⚠️ Высокий риск" : "🟢 Спокоен"}
          </span>
        </div>
        
        {/* Progress bar container */}
        <div className="h-2.5 w-full bg-neutral-950 rounded-full overflow-hidden p-[2px] border border-neutral-800">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${maxSuspicion}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full bg-gradient-to-r ${
              maxSuspicion >= 75 ? "from-red-600 to-rose-500 shadow-md shadow-red-950" : 
              maxSuspicion >= 40 ? "from-amber-600 to-yellow-500" : "from-emerald-600 to-indigo-500"
            }`}
          />
        </div>
        
        <p className="text-[10px] text-neutral-500 leading-relaxed italic">
          *Внимание: Если вы соврете Максу при вопросе «Где ты была?», его подозрения могут подскочить на 30-40%. Подозрение растет, если слухи Семеныча противоречат вашим рассказам!
        </p>
      </div>

      {/* MAP GRID AND SIDE DETAILS */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* MAP 2D CONTAINER */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl min-h-[350px] p-4 relative overflow-hidden flex flex-col justify-between">
          
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, #4f46e5 1px, transparent 1.5px)",
            backgroundSize: "24px 24px"
          }}></div>

          <div className="absolute top-4 left-4 z-10">
            <span className="text-[9px] bg-neutral-950 border border-neutral-800 text-neutral-400 px-2.5 py-1 rounded-full font-mono uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
              2D Навигационная спутниковая схема
            </span>
          </div>

          {/* Actual 2D nodes represent city map */}
          <div className="flex-1 w-full h-full relative min-h-[250px] mt-6">
            
            {/* Draw connecting roads */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
              <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="75%" y1="25%" x2="50%" y2="50%" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="30%" y1="75%" x2="50%" y2="50%" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="80%" y1="70%" x2="50%" y2="50%" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="20%" y1="30%" x2="30%" y2="75%" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="75%" y1="25%" x2="80%" y2="70%" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
            </svg>

            {LOCATIONS.map(loc => {
              const isActive = currentLocation === loc.id;
              const charactersHere = getCharactersAtLocation(loc.id, gameClock);
              const isHovered = hoveredLoc === loc.id;

              return (
                <div
                  key={loc.id}
                  style={{ left: `${loc.coords.x}%`, top: `${loc.coords.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                  onMouseEnter={() => setHoveredLoc(loc.id)}
                  onMouseLeave={() => setHoveredLoc(null)}
                >
                  <button
                    onClick={() => handleTravelClick(loc.id)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                      isActive 
                        ? "bg-indigo-600 border-2 border-white shadow-lg shadow-indigo-500/50 scale-110" 
                        : "bg-neutral-950 border border-neutral-800 hover:border-indigo-500/60 hover:scale-105 hover:bg-neutral-900"
                    }`}
                  >
                    <div className={`${isActive ? "text-white" : "text-neutral-400 group-hover:text-indigo-400"} transition-colors`}>
                      {renderLocIcon(loc.iconName)}
                    </div>

                    {/* Active pin pulse */}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border border-white flex animate-pulse"></span>
                    )}

                    {/* Character avatars counter */}
                    {charactersHere.length > 0 && !isActive && (
                      <span className="absolute -bottom-1 -right-1 bg-neutral-850 border border-neutral-750 text-[9px] text-indigo-400 font-extrabold w-5 h-5 rounded-lg flex items-center justify-center shadow">
                        {charactersHere.length}
                      </span>
                    )}
                  </button>

                  {/* Character mini round heads floating above node */}
                  {charactersHere.length > 0 && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center -space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      {charactersHere.map(char => (
                        <div 
                          key={char.id} 
                          title={`${char.name} (${char.role})`}
                          className={`w-5.5 h-5.5 rounded-full border border-neutral-950 bg-gradient-to-tr ${char.avatarColor} text-[8px] font-bold text-white flex items-center justify-center shadow-md`}
                        >
                          {char.name[0]}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tiny inline tooltip node label */}
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-neutral-950/90 border border-neutral-800 px-2 py-0.5 rounded-lg text-[9px] text-neutral-300 font-bold whitespace-nowrap opacity-90 group-hover:opacity-100 select-none shadow pointer-events-none">
                    {loc.name}
                  </div>
                </div>
              );
            })}

          </div>

          <p className="text-[10px] text-neutral-500 mt-2 text-center pointer-events-none">
            *Кликните по любой иконке, чтобы переехать туда на машине.
          </p>

        </div>

        {/* ACTIVE LOCATION DETAILS PANEL */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between overflow-y-auto space-y-4">
          
          {(() => {
            const activeLoc = LOCATIONS.find(l => l.id === (hoveredLoc || currentLocation)) || LOCATIONS[0];
            const charactersHere = getCharactersAtLocation(activeLoc.id, gameClock);
            const isCurrentlyHere = currentLocation === activeLoc.id;

            return (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-xl border ${activeLoc.color}`}>
                    {renderLocIcon(activeLoc.iconName)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {isCurrentlyHere ? "📍 Текущее местоположение" : "🔍 Информация о точке"}
                    </span>
                    <h3 className="text-lg font-black text-white">{activeLoc.name}</h3>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  {activeLoc.description}
                </p>

                {/* Characters present */}
                <div className="space-y-2 pt-2 flex-1">
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Персонажи в этой точке ({charactersHere.length})
                  </h4>

                  {charactersHere.length === 0 ? (
                    <div className="p-4 bg-neutral-950/40 border border-neutral-850 rounded-2xl text-center text-xs text-neutral-500">
                      В этой точке города сейчас безлюдно. Никого из знакомых.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {charactersHere.map(char => (
                        <div 
                          key={char.id} 
                          className="bg-neutral-950/60 border border-neutral-850/80 p-2.5 rounded-xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${char.avatarColor} text-white text-xs font-bold flex items-center justify-center`}>
                              {char.name[0]}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-white">{char.name}</p>
                              <p className="text-[10px] text-indigo-400 font-semibold">{char.role}</p>
                            </div>
                          </div>

                          <span className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md">
                            Присутствует вживую
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Travel Button */}
                {!isCurrentlyHere && (
                  <button
                    onClick={() => handleTravelClick(activeLoc.id)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-950 cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Поехать сюда (Займет 1 час)</span>
                  </button>
                )}

                {isCurrentlyHere && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-semibold">Вы уже находитесь в этой точке города.</span>
                  </div>
                )}
              </div>
            );
          })()}

        </div>

      </div>

      {/* DETAILED INTERROGATION MODAL OVERLAY */}
      <AnimatePresence>
        {showInterrogation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md text-left"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>

              {/* Interrogation Header */}
              <div className="p-6 border-b border-neutral-800/60 bg-neutral-950 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 shrink-0">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Допрос от Ревнивого Мужа</h3>
                  <p className="text-[11px] text-neutral-400">
                    Макс встречает вас на пороге с хмурым, подозрительным видом. Потребуется алиби!
                  </p>
                </div>
              </div>

              {/* Interrogation Body */}
              <div className="p-6 space-y-4">
                <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl text-xs sm:text-sm text-neutral-100 italic leading-relaxed relative">
                  <span className="absolute -top-2 left-4 px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-[8px] text-red-400 font-bold uppercase tracking-wider">Реплика Макса</span>
                  «Опять явилась в такое время... Я звонил тебе трижды, ты не брала трубку! Где и с кем ты пропадала всё это время?! Назови мне чертово место!»
                </div>

                {/* If result is ready, show outcome */}
                {interrogationResult ? (
                  <div className="space-y-4 pt-2">
                    <div className={`p-4 rounded-2xl border ${
                      interrogationResult.success 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" 
                        : "bg-red-500/10 border-red-500/20 text-red-300"
                    } text-xs leading-relaxed`}>
                      <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                        {interrogationResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        <span>Результат алиби: {interrogationResult.success ? "Успех" : "Провал"}</span>
                      </div>
                      <p>{interrogationResult.text}</p>
                    </div>

                    <div className="flex justify-between items-center bg-neutral-950 p-3 rounded-xl border border-neutral-850">
                      <span className="text-[10px] text-neutral-400">Изменение подозрений:</span>
                      <span className={`text-xs font-bold ${interrogationResult.suspicionChange < 0 ? "text-emerald-400" : "text-red-500"}`}>
                        {interrogationResult.suspicionChange < 0 ? `${interrogationResult.suspicionChange}%` : `+${interrogationResult.suspicionChange}%`}
                      </span>
                    </div>

                    <button
                      onClick={closeInterrogation}
                      className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-750 text-white font-bold rounded-xl text-xs cursor-pointer transition-all active:scale-95 text-center"
                    >
                      Войти в квартиру
                    </button>
                  </div>
                ) : (
                  /* Choose Alibi choices */
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                      Выберите ваше алиби (Будьте осторожны с имеющимися слухами!):
                    </p>

                    <button
                      onClick={() => handleAlibiSubmit("office")}
                      className="w-full p-3 bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 hover:border-indigo-500/40 rounded-xl text-xs text-left text-neutral-200 hover:text-white transition-all cursor-pointer flex justify-between items-center"
                    >
                      <span>📁 «Я сидела в офисе, заканчивала отчёты...»</span>
                      <span className="text-[9px] text-neutral-500 font-mono italic">Алиби: Офис</span>
                    </button>

                    <button
                      onClick={() => handleAlibiSubmit("club")}
                      className="w-full p-3 bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 hover:border-indigo-500/40 rounded-xl text-xs text-left text-neutral-200 hover:text-white transition-all cursor-pointer flex justify-between items-center"
                    >
                      <span>🍹 «Мы сидели с Машей, у неё личная драма...»</span>
                      <span className="text-[9px] text-neutral-500 font-mono italic">Алиби: Маша/Клуб</span>
                    </button>

                    <button
                      onClick={() => handleAlibiSubmit("staircase")}
                      className="w-full p-3 bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 hover:border-indigo-500/40 rounded-xl text-xs text-left text-neutral-200 hover:text-white transition-all cursor-pointer flex justify-between items-center"
                    >
                      <span>🌳 «Просто сидела на лавочке у подъезда, дышала воздухом...»</span>
                      <span className="text-[9px] text-neutral-500 font-mono italic">Алиби: Подъезд</span>
                    </button>

                    <button
                      onClick={() => handleAlibiSubmit("garage")}
                      className="w-full p-3 bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 hover:border-indigo-500/40 rounded-xl text-xs text-left text-neutral-200 hover:text-white transition-all cursor-pointer flex justify-between items-center"
                    >
                      <span>🔧 «Я заезжала к Артёму в гараж помочь с деталями машины...»</span>
                      <span className="text-[9px] text-neutral-500 font-mono italic">Алиби: Гараж</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
});
