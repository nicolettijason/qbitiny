import { createContext, useContext } from "react";
import { en, type TranslationKey } from "./en";
import { fr } from "./fr";

export type { TranslationKey } from "./en";

export type Language = "en" | "fr";
export type LanguagePreference = Language | "auto";

/** Language names, written in their own language. */
export const LANGUAGES: Record<Language, string> = {
	en: "English",
	fr: "Français",
};

export const dictionaries: Record<Language, Record<TranslationKey, string>> = {
	en,
	fr,
};

export type TranslationParams = Record<string, string | number>;

/** Keys that have `.one` / `.other` plural forms, without the suffix. */
export type PluralKey = {
	[K in TranslationKey]: K extends `${infer Base}.one` ? Base : never;
}[TranslationKey];

export type TFunction = (key: TranslationKey, params?: TranslationParams) => string;
export type TPluralFunction = (
	key: PluralKey,
	count: number,
	params?: TranslationParams,
) => string;

export function resolveLanguage(preference: LanguagePreference): Language {
	if (preference !== "auto") return preference;
	const browser =
		typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
	return browser.startsWith("fr") ? "fr" : "en";
}

function interpolate(text: string, params?: TranslationParams): string {
	if (!params) return text;
	return text.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in params ? String(params[name]) : match,
	);
}

/** French uses the singular for 0 and 1, English only for 1. */
function pluralForm(language: Language, count: number): "one" | "other" {
	if (language === "fr") return Math.abs(count) < 2 ? "one" : "other";
	return count === 1 ? "one" : "other";
}

export function createTranslator(language: Language) {
	const dictionary = dictionaries[language];
	const t: TFunction = (key, params) =>
		interpolate(dictionary[key] ?? en[key] ?? key, params);
	const tp: TPluralFunction = (key, count, params) =>
		t(`${key}.${pluralForm(language, count)}` as TranslationKey, {
			count,
			...params,
		});
	return { t, tp };
}

export interface I18nContextValue {
	language: Language;
	preference: LanguagePreference;
	setPreference: (preference: LanguagePreference) => void;
	t: TFunction;
	tp: TPluralFunction;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useTranslation(): I18nContextValue {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error("useTranslation must be used within an I18nProvider");
	}
	return context;
}
