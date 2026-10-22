import type { TorrentListDefaults } from "@/types";

/**
 * Types for localStorage management through context
 */

export interface StorageValue {
	qbitUser: string;
	qbitwebberSizeUnit: string;
	qbitwebberInteractiveTabTitle: boolean;
	qbitwebberTableViewSettings: Record<string, unknown>;
	qbitinyTorrentListDefaults: TorrentListDefaults;
}

export type StorageKey = keyof StorageValue;
