export const GOSSIP_CONNECTIONS: Record<string, { targetId: string; baseChance: number }[]> = {
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

export const getPenisSizeGradation = (size: number): string => {
  if (size <= 11) return "стыдно показать";
  if (size <= 14) return "не впечатляющий";
  if (size <= 17) return "средний / стандарт";
  if (size <= 21) return "впечатляющий";
  return "член мечты!";
};

export const getBallFullnessText = (fullness: number): string => {
  if (fullness <= 10) return "Опустошены (Полная разрядка)";
  if (fullness <= 25) return "Легкая тяжесть (Начало накопления)";
  if (fullness <= 40) return "Слегка наполнены (Легкий зуд)";
  if (fullness <= 55) return "Умеренно наполнены (Соблазн)";
  if (fullness <= 70) return "Наполнены (Сильное вожделение)";
  if (fullness <= 85) return "Набухли (Готовы взорваться)";
  if (fullness <= 95) return "Разрываются! (Дикое желание)";
  return "Спермотоксикоз! (Срочный выпуск пара)";
};

export const getPartRatingText = (score: number): string => {
  if (score <= 15) return "Уродливо 🤢";
  if (score <= 35) return "Ниже среднего 😕";
  if (score <= 55) return "Обычное / Нормальное 🙂";
  if (score <= 75) return "Очень привлекательное 😊";
  if (score <= 85) return "Сексуально и сочно 🍓";
  if (score <= 95) return "Невероятно горячо 🔥";
  return "Божественно / Идеал мечты 👑";
};

// Helper to compress base64 images (scales down to max 800px width/height and quality 0.7) to prevent exceeding localStorage quota
export const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
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

export const safeSetLocalStorage = (key: string, value: string) => {
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
