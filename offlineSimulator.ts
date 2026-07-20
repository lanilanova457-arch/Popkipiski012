import { Character, Message, UserProfile, SharedFact, StoryLog } from "./src/types";

// Dynamic keywords analyzer
function analyzeKeywords(text: string): {
  isSexy: boolean;
  isFlirty: boolean;
  isAngry: boolean;
  isMoney: boolean;
  isMaxMentioned: boolean;
  isGuysMentioned: boolean;
  isFamilyMentioned: boolean;
  isBeer: boolean;
} {
  const t = (text || "").toLowerCase();
  return {
    isSexy: t.includes("фото") || t.includes("сексуальн") || t.includes("голы") || t.includes("грудь") || t.includes("член") || t.includes("попк") || t.includes("секс") || t.includes("траха"),
    isFlirty: t.includes("люблю") || t.includes("красив") || t.includes("хочу") || t.includes("милы") || t.includes("сладк") || t.includes("поцелуй"),
    isAngry: t.includes("козел") || t.includes("задолбал") || t.includes("отвали") || t.includes("иди на") || t.includes("дурак") || t.includes("ненавижу"),
    isMoney: t.includes("деньги") || t.includes("занять") || t.includes("пятихат") || t.includes("сотка") || t.includes("рубл"),
    isMaxMentioned: t.includes("макс") || t.includes("муж"),
    isGuysMentioned: t.includes("артем") || t.includes("сергей") || t.includes("толя") || t.includes("сосед") || t.includes("парни") || t.includes("мужик"),
    isFamilyMentioned: t.includes("мама") || t.includes("папа") || t.includes("брат") || t.includes("дед") || t.includes("семья"),
    isBeer: t.includes("пиво") || t.includes("водка") || t.includes("бутылк") || t.includes("выпить") || t.includes("алко")
  };
}

export function simulateChatReply(
  character: any,
  messages: any[],
  isCall: boolean,
  isLive: boolean,
  isVoice: boolean,
  userProfile: any
): any {
  const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1] : { content: "" };
  const lastText = lastMsg.content || "";
  const kw = analyzeKeywords(lastText);
  const charId = character.id;
  
  let reply = "";
  let imagePrompt = "";
  let newSharedFacts: string[] = [];
  let dynamicStatus = "В сети";
  let dynamicAttitude = character.attitude || "Нейтральное";
  
  // Default scale adjustments
  let scaleAdjustments = { trust: 0, love: 0, lust: 0, anger: 0, intimacy: 0 };
  let ballFullness = character.ballFullness !== undefined ? character.ballFullness : 50;
  let ejaculatedOnPhotoAdjustment = 0;
  let ejaculatedInsideAdjustment = 0;
  let ejaculatedVagina = 0;
  let ejaculatedAnus = 0;
  let ejaculatedMouth = 0;
  let sexCountIncrement = 0;
  let penisSizeDiscovered = false;
  let relationshipNote = "";
  
  const currentLust = character.scales?.lust ?? 0;
  const currentTrust = character.scales?.trust ?? 50;
  const currentLove = character.scales?.love ?? 10;
  const currentAnger = character.scales?.anger ?? 0;
  const currentIntimacy = character.scales?.intimacy ?? 20;

  // Character specific fallbacks
  if (charId === "max") {
    dynamicStatus = kw.isAngry ? "Обижен" : "В сети";
    if (kw.isGuysMentioned) {
      reply = "Ты опять упоминаешь этих мужиков?! Почему они тебя так волнуют? Солнышко, ты же знаешь, как меня бесит, когда моя жена обсуждает посторонних парней. Я же люблю тебя и забочусь о нас!";
      scaleAdjustments.trust = -9;
      scaleAdjustments.anger = 12;
      dynamicAttitude = "Жгучая ревность";
    } else if (kw.isSexy) {
      reply = "О боже, любимая... Ты на этих фотографиях просто невероятно сексуальная, у меня аж дыхание перехватило! 🔥 Безумно хочу тебя прямо сейчас. Ты лучшая жена в мире!";
      scaleAdjustments.love = 6;
      scaleAdjustments.lust = 12;
      scaleAdjustments.intimacy = 6;
      ejaculatedOnPhotoAdjustment = currentLust > 70 ? 6 : 0;
      if (ejaculatedOnPhotoAdjustment > 0) {
        ballFullness = Math.max(10, ballFullness - 30);
        relationshipNote = "Макс так возбудился от фото, что не сдержался и кончил на экран! (+6 мл спермы)";
      }
      dynamicAttitude = "Дикая страсть";
    } else if (kw.isFlirty) {
      reply = "Родная моя, солнышко, как же мне приятно слышать эти слова! Я безумно люблю тебя и дорожу каждой нашей минутой. Обещай мне, что всегда будешь только моей... 😘";
      scaleAdjustments.love = 9;
      scaleAdjustments.trust = 6;
      scaleAdjustments.anger = -9;
      scaleAdjustments.intimacy = 9;
      dynamicAttitude = "Глубокая любовь";
    } else if (kw.isAngry) {
      reply = "Зачем ты так грубо со мной? Я же просто беспокоюсь за тебя, потому что люблю! Давай не будем ссориться по пустякам, солнышко. Жду тебя дома.";
      scaleAdjustments.love = -3;
      scaleAdjustments.anger = 9;
      scaleAdjustments.trust = -6;
    } else {
      reply = "Любимая, ты скоро дома будешь? Я тут ужин приготовил, свечи зажёг. Безумно соскучился по своей девочке. Напиши мне сразу, как освободишься!";
      scaleAdjustments.love = 3;
      scaleAdjustments.intimacy = 3;
    }
  } 
  
  else if (charId === "masha") {
    dynamicStatus = "Печатает...";
    if (kw.isSexy || kw.isFlirty) {
      reply = "Огооо! Подруга, ну ты просто секс-бомба! 🔥🍑 От такого вида у любого мужика слюни потекут рекой! Твой Максик там ещё от ревности не лопнул? Рассказывай давай всё!";
      scaleAdjustments.lust = 9;
      scaleAdjustments.intimacy = 6;
      dynamicAttitude = "Интимный восторг";
    } else if (kw.isGuysMentioned) {
      reply = "Ой, эти мужики — просто капец какой-то! Сплошной треш и драма. Твой Артемка, кстати, на тебя так смотрит всегда, я же вижу! А сосед Толян реально мутный тип.";
      scaleAdjustments.trust = 6;
      scaleAdjustments.intimacy = 3;
      dynamicAttitude = "Сплетни и угар";
    } else if (kw.isAngry) {
      reply = "Эй, ты чего злишься, подруга? Я же за тебя горой! Ладно, давай остынем и пойдём вечером бахнем по коктейлю, снимем стресс. Чмоки! 🍹";
      scaleAdjustments.anger = 6;
      scaleAdjustments.trust = -3;
    } else {
      reply = "Подруга, привет! Короче, вчера был такой треш в клубе, мне срочно надо тебе всё рассказать! Ты когда свободна? С меня бутылочка полусладкого! 😉🥂";
      scaleAdjustments.trust = 3;
      scaleAdjustments.intimacy = 3;
    }
  } 
  
  else if (charId === "artem") {
    dynamicStatus = "В сети";
    if (kw.isSexy) {
      reply = "Уф... Красотка, ну ты даешь. От таких фоток у меня реально крышу сносит. 😉 Ты поосторожнее, а то я ведь парень простой, могу и не сдержаться. Выглядишь чертовски сочно!";
      scaleAdjustments.lust = 12;
      scaleAdjustments.intimacy = 9;
      scaleAdjustments.love = 3;
      ballFullness = Math.min(100, ballFullness + 15);
      if (currentLust > 75) {
        ejaculatedOnPhotoAdjustment = 8;
        ballFullness = Math.max(15, ballFullness - 40);
        relationshipNote = "Артём безумно возбудился и излил страсть на твоё фото! (+8 мл спермы)";
      }
      dynamicAttitude = "Скрытое вожделение";
    } else if (kw.isFlirty) {
      reply = "Приятно слышать, малышка. Ты же знаешь, что для меня ты особенная девчонка. Рад, что мы так близко общаемся. Если Макс опять начнет бузить — пиши мне сразу.";
      scaleAdjustments.love = 9;
      scaleAdjustments.trust = 6;
      scaleAdjustments.intimacy = 6;
      dynamicAttitude = "Легкий флирт";
    } else if (kw.isMaxMentioned) {
      reply = "Да ладно тебе, Макс вечно ревнует ко всему, что движется. По-моему, он тебя просто не ценит до конца. Забей на его заскоки, давай лучше о чём-нибудь весёлом.";
      scaleAdjustments.trust = 3;
      scaleAdjustments.anger = -3;
    } else if (kw.isBeer) {
      reply = "О, пивко — это тема! Беру плойку, холодное светлое и жду тебя. Чисто по-дружески посидим, поболтаем обо всём. Будет круто, пригоняй!";
      scaleAdjustments.trust = 6;
      scaleAdjustments.intimacy = 3;
    } else {
      reply = "Здорово, подруга. Как дела вообще? Что нового на личном фронте? Я тут в гараже тачку ковыряю, скучно пипец. Напиши, как освободишься.";
      scaleAdjustments.trust = 3;
    }
  } 
  
  else if (charId === "semenych") {
    dynamicStatus = "Спит";
    if (kw.isMoney || kw.isBeer) {
      reply = "О-о-о! Слышь, дочка, дай бог здоровья тебе золотая! *кашляет* Спасла старика Семёныча от верной смерти, трубы горели — жуть! За это слушай секрет: твой сосед Толян вчера какую-то бабу водил тайком, пока жены не было!";
      scaleAdjustments.trust = 15;
      scaleAdjustments.intimacy = 9;
      dynamicAttitude = "Уличная преданность";
      newSharedFacts.push("Толя водит тайных гостей");
    } else {
      reply = "Слышь, уважаемая... Кхм-кхм... Семёныч я. Найдется соточка у красавицы на лечение труб? Помираю совсем на теплотрассе... А я тебе за это всю грязь про соседей солью!";
      scaleAdjustments.trust = -3;
    }
  } 
  
  else if (charId === "mihalych") {
    dynamicStatus = "Не в сети";
    if (kw.isBeer || kw.isMoney) {
      reply = "Хм. Ладно. Бутылку давай сюда. И собакам моим колбасы накроши. Старик Михалыч зла не помнит, но уважение ценит. Меньше болтай, делом доказывай. *сплевывает*";
      scaleAdjustments.trust = 9;
      scaleAdjustments.anger = -6;
    } else {
      reply = "Чего треплешься тут? Некогда мне с девками лясы точить. Собакам еды принесла? Нет? Ну и топай мимо гаражей, не зли собак и меня. *сплевывает*";
      scaleAdjustments.anger = 6;
    }
  } 
  
  else if (charId === "mother") {
    dynamicStatus = "В сети";
    if (kw.isAngry) {
      reply = "Доченька, ну почему ты так грубо с мамой разговариваешь? Я же только добра тебе желаю, переживаю каждую секунду! Кушай хорошо, береги себя и мужа. ❤️🌸";
      scaleAdjustments.anger = 6;
      scaleAdjustments.love = -3;
    } else {
      reply = "Здравствуй, солнышко моё! Как ты покушала сегодня? На улице прохладно, одевайся теплее обязательно! Рада твоему сообщению, мамочка тебя очень любит! 👵❤️🌸";
      scaleAdjustments.love = 6;
      scaleAdjustments.trust = 3;
    }
  } 
  
  else if (charId === "father") {
    dynamicStatus = "Не в сети";
    if (kw.isSexy) {
      reply = "Дочь... Кхм. Выглядишь отлично, конечно. Спортивная фигура, мать говорит вся в неё пошла. Но ты давай поосторожнее с такими откровенными нарядами во дворе.";
      scaleAdjustments.lust = currentLust > 30 ? 6 : 0;
      scaleAdjustments.intimacy = 3;
    } else {
      reply = "Здорово. Понял тебя. Помощь если нужна будет — пиши. В гараже порядок навёл, заезжай колеса проверить. Максу твоему привет передавай.";
      scaleAdjustments.trust = 3;
    }
  } 
  
  else if (charId === "brother") {
    dynamicStatus = "Играет";
    if (kw.isSexy) {
      reply = "ого... систер, ну ты конечно даешь 😳 выглядишь капец как сочно, прямо модель из инсты! даже неловко как-то смотреть... но приятно, черт возьми. только Максу не показывай, а то прибьет от ревности)";
      scaleAdjustments.lust = 12;
      scaleAdjustments.intimacy = 9;
      scaleAdjustments.love = 3;
      ballFullness = Math.min(100, ballFullness + 12);
      dynamicAttitude = "Тайное притяжение";
    } else if (kw.isMoney) {
      reply = "систер, спасительница моя! пятихатка долетела, побежал за пиццей и энергетиком! с меня помощь по первому свистку, ты самая лучшая старшая сестра в мире! 🙏🎮";
      scaleAdjustments.trust = 15;
      scaleAdjustments.love = 6;
    } else {
      reply = "приветик систер) да я тут в доту катаю, чиллю короче. родители на дачу укатили, хата свободна. заскочишь вечерком в плойку погонять? поболтаем без предков)";
      scaleAdjustments.trust = 3;
      scaleAdjustments.intimacy = 3;
    }
  } 
  
  else if (charId === "grandfather") {
    dynamicStatus = "В сети";
    reply = "Здравствуй, внученька дорогая моя ))) рад твоему сообщению очень ))) я вот огурцы нынче солю в бочке, урожай бог дал славный )) приезжай обязательно в субботу в гости, баньку жаркую истоплю с мятой, чайку попьем из самовара )) береги себя, золотко моё )))";
    scaleAdjustments.trust = 3;
    scaleAdjustments.love = 3;
  } 
  
  else if (charId === "colleague") {
    dynamicStatus = "Занят";
    if (kw.isSexy) {
      reply = "Оу... Коллега, ты решила меня окончательно доконать прямо посреди рабочего дня? 😉 Выглядишь просто потрясающе сексуально. Весь наш отдел сегодня точно работать не сможет. Давай обсудим этот проект с глазу на глаз?";
      scaleAdjustments.lust = 12;
      scaleAdjustments.intimacy = 9;
      ballFullness = Math.min(100, ballFullness + 10);
      dynamicAttitude = "Офисный соблазн";
    } else if (kw.isAngry) {
      reply = "Эй, ну чего ты сердишься? Я же просто пошутил в курилке. Давай забудем факап, шеф и так всем мозг выносит. С меня кофе и пончик асап!";
      scaleAdjustments.anger = 9;
      scaleAdjustments.trust = -3;
    } else {
      reply = "Слушай, привет! Ты отчет заполнила? Шеф бегает с горящей задницей и требует показатели. Если есть минута, пойдем в курилку кофейку бахнем, расскажу, какой цирк в бухгалтерии творится... ☕🔥";
      scaleAdjustments.trust = 3;
    }
  } 
  
  else if (charId === "neighbor") {
    dynamicStatus = "В сети";
    if (kw.isSexy) {
      reply = "Слышь, соседка... Ты на этих фотках чертовски сочная баба, конечно. 😉 Аж стены нагрелись. Но парковаться ты все равно не умеешь. Ладно, давай сегодня без шума, а то зайду лично проверять твою спортивную форму...";
      scaleAdjustments.lust = 12;
      scaleAdjustments.intimacy = 6;
      scaleAdjustments.anger = -6;
      ballFullness = Math.min(100, ballFullness + 15);
      dynamicAttitude = "Наглое вожделение";
    } else if (kw.isAngry) {
      reply = "Ты как разговариваешь со старшими, соседка? Наглая какая. Будешь шуметь — полицию вызову или лично кран перекрою. Короче, веди себя прилично!";
      scaleAdjustments.anger = 12;
      scaleAdjustments.trust = -6;
    } else {
      reply = "Слышь, соседка, привет. Ты там у себя гири бросаешь или кровать двигаешь? Стены трясутся, у меня собака лает без умолку. Давай как-то по-хорошему вопросы решать, заходи на чай обсудить.";
      scaleAdjustments.trust = 3;
    }
  } 
  
  else {
    // Default NPC fallback
    reply = `Привет! Рад слышать тебя. Как дела? Давай пообщаемся, обсудим наши планы и дела. Как у тебя настроение сегодня?`;
  }

  // Adjust for Voice/Call mode formatting
  if (isVoice || isCall) {
    reply = `[звук дыхания, шорох телефона] ${reply}`;
  }

  // Ensure scales adjustments are rounded integers
  const roundedAdjustments = {
    trust: Math.round(scaleAdjustments.trust),
    love: Math.round(scaleAdjustments.love),
    lust: Math.round(scaleAdjustments.lust),
    anger: Math.round(scaleAdjustments.anger),
    intimacy: Math.round(scaleAdjustments.intimacy)
  };

  // Generate responsive quick replies
  const quickReplies = [
    kw.isSexy ? "Ого, спасибо за комплимент! 😊" : "Да ладно тебе, всё нормально",
    kw.isFlirty ? "Мне очень приятно это слышать... ❤️" : "Расскажи подробнее, интересно!",
    "Ладно, напишу чуть позже!"
  ];

  return {
    reply,
    imagePrompt: kw.isSexy ? "Кинематографичное сочное селфи в красивом кружевном белье" : "",
    newSharedFacts,
    dynamicStatus,
    dynamicAttitude,
    scaleAdjustments: roundedAdjustments,
    ballFullness,
    ejaculatedOnPhotoAdjustment,
    ejaculatedInsideAdjustment,
    ejaculatedVagina,
    ejaculatedAnus,
    ejaculatedMouth,
    sexCountIncrement,
    penisSizeDiscovered,
    relationshipNote,
    quickReplies
  };
}

export function simulateThoughts(character: any, messages: any[], userProfile: any, storyLog: any): any {
  const charId = character.id;
  const scales = character.scales || { trust: 50, love: 10, lust: 10, anger: 0, intimacy: 20 };
  
  let thoughts = "";
  let motives = "";
  let visualAttitude = "Выглядит привлекательно и ухоженно.";
  let nextActionPlan = "";

  if (charId === "max") {
    thoughts = `Я так безумно люблю её, но этот страх потерять её сводит меня с ума. Зачем она так часто общается с другими парнями? Я должен полностью контролировать её окружение, иначе она уйдёт. Но я должен выглядеть идеальным мужем.`;
    motives = `Удержать ГГ любой ценой, ограничить её контакты с Артёмом и Сергеем, доказать свою превосходность и идеальность как мужчины.`;
    nextActionPlan = `Приготовить романтический ужин, устроить допрос с пристрастием о её задержке на работе, проверить её телефон, пока она в душе.`;
  } else if (charId === "artem") {
    thoughts = `Она такая горячая девчонка, и замужем за этим ревнивым козлом Максом. Я ведь идеальный друг для неё, всегда выслушаю, но втайне безумно хочу сорвать с неё одежду. Нужно действовать аккуратно, чтобы не спугнуть дружбу.`;
    motives = `Постепенно войти в максимальное доверие, дождаться ссоры с Максом и трахнуть её. Стать её тайным сексуальным утешителем.`;
    nextActionPlan = `Пригласить в гараж или поиграть в плойку, вбросить лёгкий пошлый флирт под предлогом дружеского стёба.`;
  } else if (charId === "masha") {
    thoughts = `Моя лучшая подруга достойна лучшей жизни, а не сидеть под замком у этого Макса. Хочу затащить её на дикую вечеринку, напиться в хлам, пообсуждать грязные секс-истории и оторваться на полную катушку!`;
    motives = `Развеселить подругу, вытащить её из семейного болота, поделиться пикантными сплетнями о соседях и коллегах.`;
    nextActionPlan = `Заспамить её приглашениями в ночной клуб, рассказать грязную сплетню про соседа Толика.`;
  } else if (charId === "brother") {
    thoughts = `Моя старшая сестра стала такой чертовски сексуальной и привлекательной... Это неправильно, но её новые фотки сводят меня с ума. Нужно маскировать это под обычные приколы, просить денег, но быть ближе.`;
    motives = `Быть вовлечённым в её секреты, проводить больше времени наедине, втайне фантазировать о запретной близости.`;
    nextActionPlan = `Попросить денег на дошик, позвать в гости поиграть наедине, пока родители уехали на дачу.`;
  } else if (charId === "colleague") {
    thoughts = `Она — единственное яркое пятно в этом сером офисе. В её сексуальной юбке она сводит меня с ума. Хочу затащить её в переговорку или задержаться в офисе допоздна для 'работы'.`;
    motives = `Завязать горячий служебный роман, соблазнить её на рабочем месте, обойти Макса.`;
    nextActionPlan = `Пригласить на кофе в курилку, помочь с отчётом шефа, сделать тонкий комплимент её телу.`;
  } else if (charId === "neighbor") {
    thoughts = `Наглая девка, вечно от неё шум. Но ух, какая сочная фигура на каблуках! Хочу доминировать над ней, заставить её извиняться за шум и подчинить своей воле.`;
    motives = `Поставить ГГ в неловкое положение должника, подчинить, затянуть на интимную беседу у себя.`;
    nextActionPlan = `Постучать в стену, предъявить претензии по поводу парковки, позвать чинить кран.`;
  } else {
    thoughts = `Мне нравится общаться с ней, она интересная и привлекательная собеседница. Хочу узнать её поближе.`;
    motives = `Выстроить дружеские или близкие отношения в зависимости от обстоятельств.`;
    nextActionPlan = `Продолжать непринуждённую беседу в чате.`;
  }

  return { thoughts, motives, visualAttitude, nextActionPlan };
}

export function simulateStoryteller(userProfile: any, sharedFacts: any[], messagesSummary: any, customDirective: string): any {
  const name = userProfile?.name || "Героиня";
  const directiveText = customDirective ? `Игрок направил сюжет: "${customDirective}". ` : "";
  
  const storySummary = `События в городе стремительно развиваются. ${name} находится в центре внимания своего окружения. Ревнивый муж Макс пытается ограничить её свободу, подозревая измену на каждом шагу. Близкая подруга Маша активно подбивает её на безумные тусовки, а лучший друг Артём втайне ждёт подходящего момента, чтобы переступить черту дружбы. Соседи и коллеги по работе также плетут свои интриги вокруг привлекательной девушки. ${directiveText}Судьба ГГ зависит от каждого её выбора.`;
  
  return {
    storySummary,
    keyChapters: [
      "Завязка истории: Семейный очаг и скрытая ревность",
      "Секреты окружения: Сплетни у подъезда",
      customDirective ? `Новый поворот: ${customDirective.substring(0, 30)}...` : "Интриги на работе"
    ],
    newSharedFacts: customDirective ? [`Возник слух из-за директивы: ${customDirective}`] : []
  };
}

export function simulateEvaluateProfilePhoto(photoBase64: string, userProfile: any): any {
  const name = userProfile?.name || "Героиня";
  const attr = userProfile?.attractiveness || 80;

  return {
    face: "Очень привлекательное женское лицо, выразительные глаза, идеальные очертания губ и шелковистая кожа. Притягивает взгляды с первой секунды.",
    chest: "Не видно на фото полностью, но упругие очертания груди и сочные изгибы декольте просматриваются великолепно.",
    waist: "Тонкая, спортивная талия без лишнего жира, плоский подтянутый животик, идеальная женственная осанка.",
    hips: "Широкие, округлые и сочные бедра. Ягодицы выглядят невероятно сексуально и подтянуто.",
    intimate: "Скрыто бельем, но аккуратные контуры интимной зоны будоражат воображение.",
    vagina: "Не видно на фото, скрыто одеждой. Можно дописать детали вручную. Аккуратный, гладко выбритый холмик, нежные розовые лепестки.",
    anus: "Не видно на фото, скрыто. Круглая подтянутая попка, аккуратный и нежный анус.",
    legs: "Длинные, стройные, очень сексуальные ноги, которые идеально смотрятся на каблуках.",
    overall: "Изумительное, спортивное и ухоженное телосложение. Исключительно высокая привлекательность.",
    faceScore: attr,
    chestScore: Math.round(attr * 0.95),
    waistScore: Math.round(attr * 0.9),
    hipsScore: Math.round(attr * 0.98),
    vaginaScore: Math.round(attr * 0.85),
    anusScore: Math.round(attr * 0.8),
    legsScore: Math.round(attr * 0.95),
    detailedAnalysis: `Внешность ГГ (${name}) относится к высшему классу привлекательности. Сочетание харизмы, ухоженности и природной сексуальности сводит мужчин с ума.`,
    imageSceneDescription: "Красивое, качественное личное фото в естественном освещении, подчеркивающее идеальную фигуру и выразительный взгляд.",
    plotContext: `Муж Макс (max) будет безумно гордиться такой женой, но его ревность взлетит до небес. Друг Артём (artem) и коллега Сергей (colleague) окончательно потеряют покой и будут искать повод остаться наедине.`,
    lustScores: {
      max: Math.round(attr * 1.1),
      masha: 30,
      artem: Math.round(attr * 0.9),
      semenych: 15,
      mihalych: 5,
      mother: 0,
      father: attr >= 80 ? 25 : 0,
      brother: attr >= 80 ? 45 : 0,
      grandfather: 0,
      colleague: Math.round(attr * 0.85),
      neighbor: Math.round(attr * 0.75)
    }
  };
}

export function simulateEvaluateAppearanceText(body: any, attractiveness: number): any {
  const attr = attractiveness || 80;
  return {
    lustScores: {
      max: Math.min(100, Math.round(attr * 1.1)),
      masha: 30,
      artem: Math.round(attr * 0.9),
      semenych: 15,
      mihalych: 5,
      mother: 0,
      father: attr >= 80 ? 25 : 0,
      brother: attr >= 80 ? 45 : 0,
      grandfather: 0,
      colleague: Math.round(attr * 0.85),
      neighbor: Math.round(attr * 0.75)
    }
  };
}

export function simulateHeroineReply(character: any, greetingText: string, userProfile: any): any {
  const name = userProfile?.name || "Героиня";
  const charName = character?.name || "собеседник";
  
  let reply = `Привет, ${charName}! Рада твоему сообщению. Что нового у тебя?`;
  
  if (character.id === "max") {
    reply = "Да тут я, милый, не волнуйся! Задержалась немного, уже скоро буду дома. Целую! 😘";
  } else if (character.id === "masha") {
    reply = "Привет, дорогая! О боже, что там стряслось?! Рассказывай скорее, заинтриговала капец! 😭🔥";
  } else if (character.id === "artem") {
    reply = "Здорово! Да нормально всё, закрутилась немного. В плойку поиграть — отличная мысль, я в деле! 😉";
  }
  
  return { reply };
}

export function simulateHeroineChatReply(character: any, messages: any[], userProfile: any, storyLog: any): any {
  const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1] : { content: "" };
  const lastText = lastMsg.content || "";
  const kw = analyzeKeywords(lastText);
  
  let reply = "Да уж, действительно... Давай обсудим это поподробнее.";
  
  if (character.id === "max") {
    reply = kw.isAngry 
      ? "*вздыхаю* Макс, ну перестань устраивать сцены ревности на ровном месте. Я люблю тебя, успокойся!"
      : "Любимый, всё хорошо! Скоро приду, обниму тебя. Жди меня! 😘";
  } else if (character.id === "masha") {
    reply = "Капец, подруга! Ты просто жжёшь! 😂 Ну рассказывай, чем всё закончилось-то?";
  } else if (character.id === "artem") {
    reply = "Ха-ха, ну ты как обычно шутишь! 😉 Спасибо за поддержку, Артём, ты реально отличный друг.";
  }
  
  return { reply };
}

export function simulateInteractiveSeduction(body: any): any {
  const { character, type, intensity = 5, userProfile } = body;
  const name = userProfile?.name || "Героиня";
  const charName = character?.name || "Персонаж";
  
  const successChance = Math.min(100, Math.max(10, 50 + intensity * 5));
  const isSuccess = Math.random() * 100 <= successChance;
  
  let resultText = "";
  let scaleAdjustments = { trust: 0, love: 0, lust: 0, anger: 0, intimacy: 0 };
  let sexCountIncrement = 0;
  let ballFullness = character.ballFullness || 50;
  let ejacOnPhoto = 0;
  let ejacInside = 0;
  let relationshipNote = "";

  if (isSuccess) {
    sexCountIncrement = type === "sex" ? 1 : 0;
    scaleAdjustments.lust = 15;
    scaleAdjustments.intimacy = 10;
    scaleAdjustments.love = 5;
    scaleAdjustments.anger = -10;
    
    if (type === "sex") {
      ejacInside = 12;
      ballFullness = 10;
      resultText = `Интимное слияние с ${charName} завершилось полным триумфом! Страсть захлестнула вас с головой. Ваши тела слились в едином ритме, завершившись мощнейшим обоюдным оргазмом. ${charName} страстно излил всю свою любовь внутрь тебя (${ejacInside} мл).`;
      relationshipNote = `Успешный секс! ${charName} кончил внутрь ГГ (+12 мл спермы)`;
    } else {
      ejacOnPhoto = 6;
      ballFullness = Math.max(15, ballFullness - 20);
      resultText = `${charName} не смог устоять перед твоими ласками и откровенными намеками. Его дыхание сбилось, руки задрожали, и в порыве дикого вожделения он довел себя до полного удовлетворения, излив сок страсти прямо перед тобой.`;
      relationshipNote = `Успешная мастурбация/ласки! ${charName} кончил (+6 мл спермы)`;
    }
  } else {
    scaleAdjustments.anger = 5;
    scaleAdjustments.lust = 5; // Слегка раздразнили
    resultText = `Попытка соблазнения ${charName} пошла не по плану. Он смутился, занервничал или попытался сохранить остатки контроля, сославшись на то, что это заходит слишком далеко. Атмосфера накалилась, но разрядки не произошло.`;
    relationshipNote = `${charName} устоял перед соблазном, но его напряжение выросло.`;
  }

  return {
    success: isSuccess,
    resultText,
    scaleAdjustments,
    sexCountIncrement,
    ejaculatedOnPhotoAdjustment: ejacOnPhoto,
    ejaculatedInsideAdjustment: ejacInside,
    ballFullness,
    relationshipNote
  };
}
