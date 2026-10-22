import type { TorrentListDefaults } from "@/types";
import type { LanguagePreference } from "@/i18n";

/**
 * Types for localStorage management through context
 */

export interface StorageValue {
	qbitUser: string;
	qbitPass: string;
	qbitwebberSizeUnit: string;
	qbitwebberInteractiveTabTitle: boolean;
	qbitwebberTableViewSettings: Record<string, unknown>;
	qbitinyTorrentListDefaults: TorrentListDefaults;
	qbitinyLanguage: LanguagePreference;
}

export type StorageKey = keyof StorageValue;
