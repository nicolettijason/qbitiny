import React, {
	createContext,
	useContext,
	ReactNode,
	useState,
	useCallback,
	useMemo,
} from "react";
import { StorageValue, StorageKey } from "@/types/storage";
import type { TorrentListDefaults } from "@/types";
import { defaultPreferences, defaultTorrentListDefaults } from "@/constants";

/**
 * Storage key mappings for localStorage
 */
const STORAGE_KEYS: Record<StorageKey, string> = {
	qbitUser: "qbit_user",
	qbitwebberSizeUnit: "qbitwebber_sizeUnit",
	qbitwebberInteractiveTabTitle: "qbitwebber_interactiveTabTitle",
	qbitwebberTableViewSettings: "qbitwebber_tableViewSettings",
	qbitinyTorrentListDefaults: "qbitiny_torrentListDefaults",
};

// Password saved by versions <= 1.3.1, only read once to migrate the session.
const LEGACY_PASS_KEY = "qbit_pass";

interface StorageContextType {
	// Auth
	qbitUser: string;
	setQbitUser: (value: string) => void;

	/** Returns the legacy stored password (if any) and deletes it. */
	consumeLegacyQbitPass: () => string;

	// Preferences
	qbitwebberSizeUnit: string;
	setQbitwebberSizeUnit: (value: string) => void;

	qbitwebberInteractiveTabTitle: boolean;
	setQbitwebberInteractiveTabTitle: (value: boolean) => void;

	qbitwebberTableViewSettings: typeof defaultPreferences.columns;
	setQbitwebberTableViewSettings: (
		value: typeof defaultPreferences.columns,
	) => void;

	qbitinyTorrentListDefaults: TorrentListDefaults;
	setQbitinyTorrentListDefaults: (value: TorrentListDefaults) => void;
}

const StorageContext = createContext<StorageContextType | null>(null);

function readLocalStorage(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch (error) {
		console.error(`Error reading ${key} from storage:`, error);
		return null;
	}
}

export function StorageProvider({ children }: { children: ReactNode }) {
	// Auth states — read synchronously so the very first render already
	// reflects a saved session (avoids a login-page flash on reload).
	const [qbitUser, setQbitUserState] = useState<string>(
		() => readLocalStorage(STORAGE_KEYS.qbitUser) || "",
	);

	// Preferences states
	const [qbitwebberSizeUnit, setQbitwebberSizeUnitState] = useState<string>(
		() => readLocalStorage(STORAGE_KEYS.qbitwebberSizeUnit) || "B",
	);
	const [qbitwebberInteractiveTabTitle, setQbitwebberInteractiveTabTitleState] =
		useState<boolean>(
			() =>
				readLocalStorage(STORAGE_KEYS.qbitwebberInteractiveTabTitle) ===
				"true",
		);
	const [qbitwebberTableViewSettings, setQbitwebberTableViewSettingsState] =
		useState(() => {
			const stored = readLocalStorage(STORAGE_KEYS.qbitwebberTableViewSettings);
			if (!stored) return defaultPreferences.columns;
			try {
				return JSON.parse(stored);
			} catch (e) {
				console.error("Failed to parse table view settings:", e);
				return defaultPreferences.columns;
			}
		});
	const [qbitinyTorrentListDefaults, setQbitinyTorrentListDefaultsState] =
		useState<TorrentListDefaults>(() => {
			const stored = readLocalStorage(STORAGE_KEYS.qbitinyTorrentListDefaults);
			if (!stored) return defaultTorrentListDefaults;
			try {
				return { ...defaultTorrentListDefaults, ...JSON.parse(stored) };
			} catch (e) {
				console.error("Failed to parse torrent list defaults:", e);
				return defaultTorrentListDefaults;
			}
		});

	// Setters that update both state and localStorage
	const setQbitUser = useCallback((value: string) => {
		setQbitUserState(value);
		try {
			localStorage.setItem(STORAGE_KEYS.qbitUser, value);
		} catch (error) {
			console.error("Error saving qbitUser to storage:", error);
		}
	}, []);

	const consumeLegacyQbitPass = useCallback(() => {
		const value = readLocalStorage(LEGACY_PASS_KEY) || "";
		try {
			localStorage.removeItem(LEGACY_PASS_KEY);
		} catch (error) {
			console.error("Error removing legacy password from storage:", error);
		}
		return value;
	}, []);

	const setQbitwebberSizeUnit = useCallback((value: string) => {
		setQbitwebberSizeUnitState(value);
		try {
			localStorage.setItem(STORAGE_KEYS.qbitwebberSizeUnit, value);
		} catch (error) {
			console.error("Error saving qbitwebberSizeUnit to storage:", error);
		}
	}, []);

	const setQbitwebberTableViewSettings = useCallback(
		(value: typeof defaultPreferences.columns) => {
			setQbitwebberTableViewSettingsState(value);
			try {
				localStorage.setItem(
					STORAGE_KEYS.qbitwebberTableViewSettings,
					JSON.stringify(value),
				);
			} catch (error) {
				console.error(
					"Error saving qbitwebberTableViewSettings to storage:",
					error,
				);
			}
		},
		[],
	);

	const setQbitwebberInteractiveTabTitle = useCallback((value: boolean) => {
		setQbitwebberInteractiveTabTitleState(value);
		try {
			localStorage.setItem(
				STORAGE_KEYS.qbitwebberInteractiveTabTitle,
				value.toString(),
			);
		} catch (error) {
			console.error(
				"Error saving qbitwebberInteractiveTabTitle to storage:",
				error,
			);
		}
	}, []);

	const setQbitinyTorrentListDefaults = useCallback(
		(value: TorrentListDefaults) => {
			setQbitinyTorrentListDefaultsState(value);
			try {
				localStorage.setItem(
					STORAGE_KEYS.qbitinyTorrentListDefaults,
					JSON.stringify(value),
				);
			} catch (error) {
				console.error(
					"Error saving qbitinyTorrentListDefaults to storage:",
					error,
				);
			}
		},
		[],
	);

	const value: StorageContextType = useMemo(
		() => ({
			qbitUser,
			setQbitUser,
			consumeLegacyQbitPass,
			qbitwebberSizeUnit,
			setQbitwebberSizeUnit,
			qbitwebberInteractiveTabTitle,
			setQbitwebberInteractiveTabTitle,
			qbitwebberTableViewSettings,
			setQbitwebberTableViewSettings,
			qbitinyTorrentListDefaults,
			setQbitinyTorrentListDefaults,
		}),
		[
			qbitUser,
			setQbitUser,
			consumeLegacyQbitPass,
			qbitwebberSizeUnit,
			setQbitwebberSizeUnit,
			qbitwebberInteractiveTabTitle,
			setQbitwebberInteractiveTabTitle,
			qbitwebberTableViewSettings,
			setQbitwebberTableViewSettings,
			qbitinyTorrentListDefaults,
			setQbitinyTorrentListDefaults,
		],
	);

	return (
		<StorageContext.Provider value={value}>{children}</StorageContext.Provider>
	);
}

/**
 * Hook to use the storage context
 */
export function useStorage(): StorageContextType {
	const context = useContext(StorageContext);
	if (!context) {
		throw new Error("useStorage must be used within a StorageProvider");
	}
	return context;
}
