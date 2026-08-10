/**
 * Types for localStorage management through context
 */

export interface StorageValue {
	qbitUser: string;
	qbitPass: string;
	qbitwebberSizeUnit: string;
	qbitwebberTableViewSettings: Record<string, unknown>;
}

export type StorageKey = keyof StorageValue;
