import { ReactNode, useEffect, useMemo } from "react";
import { useStorage } from "@/contexts/StorageContext";
import { I18nContext, createTranslator, resolveLanguage } from "./index";

export function I18nProvider({ children }: { children: ReactNode }) {
	const { qbitinyLanguage, setQbitinyLanguage } = useStorage();
	const language = resolveLanguage(qbitinyLanguage);

	useEffect(() => {
		document.documentElement.lang = language;
	}, [language]);

	const value = useMemo(
		() => ({
			language,
			preference: qbitinyLanguage,
			setPreference: setQbitinyLanguage,
			...createTranslator(language),
		}),
		[language, qbitinyLanguage, setQbitinyLanguage],
	);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
