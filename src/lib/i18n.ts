"use client"

import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import en from "@/locales/en/common.json"
import id from "@/locales/id/common.json"
import es from "@/locales/es/common.json"
import fr from "@/locales/fr/common.json"
import de from "@/locales/de/common.json"
import ar from "@/locales/ar/common.json"
import ja from "@/locales/ja/common.json"
import su from "@/locales/su/common.json"
import jv from "@/locales/jv/common.json"


i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    id: { translation: id },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    ar: { translation: ar },
    ja: { translation: ja },
    su: { translation: su },
    jv: { translation: jv },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
