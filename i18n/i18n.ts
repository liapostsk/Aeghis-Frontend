import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import es from "./locales/es.json";
import ca from "./locales/ca.json";

const STORAGE_KEY = "app_language";

// Normaliza locales tipo "es-ES" -> "es"
const normalize = (tag: string) => tag.split("-")[0];

export async function initI18n() {
  // 1) idioma guardado por el usuario
  const saved = await AsyncStorage.getItem(STORAGE_KEY);

  // 2) si no hay, idioma del dispositivo
  const device = normalize(Localization.getLocales()?.[0]?.languageTag ?? "es");

  const lng = (saved ?? device);
  const supported = ["en", "es", "ca"];
  const finalLng = supported.includes(lng) ? lng : "es";

  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        es: { translation: es },
        ca: { translation: ca },
      },
      lng: finalLng,
      fallbackLng: "es",
      interpolation: { escapeValue: false }
    });
}

export async function setAppLanguage(lang: "en" | "es" | "ca") {
  await AsyncStorage.setItem(STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export default i18n;
