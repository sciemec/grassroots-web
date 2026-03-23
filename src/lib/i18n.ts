/**
 * i18n configuration — English, Shona (sn), Ndebele (nd)
 *
 * Usage:
 *   import { useTranslation } from "react-i18next";
 *   const { t } = useTranslation();
 *   t("nav.dashboard")  // → "Dashboard" | "Deshboard" | "Ideshibhodi"
 *
 * Language persisted to localStorage under key "grassroots_lang".
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../../public/locales/en.json";
import sn from "../../public/locales/sn.json";
import nd from "../../public/locales/nd.json";

const savedLang =
  typeof window !== "undefined"
    ? (localStorage.getItem("grassroots_lang") ?? "en")
    : "en";

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        sn: { translation: sn },
        nd: { translation: nd },
      },
      lng: savedLang,
      fallbackLng: "en",
      interpolation: { escapeValue: false },
    });
}

export default i18n;
