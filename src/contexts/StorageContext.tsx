import React, {
	createContext,
	useContext,
	ReactNode,
	useState,
	useCallback,
	useEffect,
} from "react";
import { StorageValue, StorageKey } from "@/types/storage";
import { defaultPreferences } from "@/constants";

/**
 * Storage key mappings for localStorage
 */
const STORAGE_KEYS: Record<StorageKey, string> = {
	qbitUser: "qbit_user",
	qbitPass: "qbit_pass",
	qbitwebberSizeUnit: "qbitwebber_sizeUnit",
	qbitwebberInteractiveTabTitle: "qbitwebber_interactiveTabTitle",
	qbitwebberTableViewSettings: "qbitwebber_tableViewSettings",
};

interface StorageContextType {
	// Auth
	qbitUser: string;
	setQbitUser: (value: string) => void;

	qbitPass: string;
	setQbitPass: (value: string) => void;

	// Preferences
	qbitwebberSizeUnit: string;
	setQbitwebberSizeUnit: (value: string) => void;

	qbitwebberInteractiveTabTitle: boolean;
	setQbitwebberInteractiveTabTitle: (value: boolean) => void;

	qbitwebberTableViewSettings: typeof defaultPreferences.columns;
	setQbitwebberTableViewSettings: (
		value: typeof defaultPreferences.columns,
	) => void;
}

const StorageContext = createContext<StorageContextType | null>(null);

export function StorageProvider({ children }: { children: ReactNode }) {
	// Auth states
	const [qbitUser, setQbitUserState] = useState<string>("");
	const [qbitPass, setQbitPassState] = useState<string>("");

	// Preferences states
	const [qbitwebberSizeUnit, setQbitwebberSizeUnitState] =
		useState<string>("B");
	const [qbitwebberInteractiveTabTitle, setQbitwebberInteractiveTabTitleState] =
		useState<boolean>(false);
	const [qbitwebberTableViewSettings, setQbitwebberTableViewSettingsState] =
		useState(defaultPreferences.columns);

	// Initialize from localStorage on mount
	useEffect(() => {
		try {
			const user = localStorage.getItem(STORAGE_KEYS.qbitUser);
			if (user) setQbitUserState(user);

			const pass = localStorage.getItem(STORAGE_KEYS.qbitPass);
			if (pass) setQbitPassState(pass);

			const sizeUnit = localStorage.getItem(STORAGE_KEYS.qbitwebberSizeUnit);
			if (sizeUnit) setQbitwebberSizeUnitState(sizeUnit);

			const tableSettings = localStorage.getItem(
				STORAGE_KEYS.qbitwebberTableViewSettings,
			);
			if (tableSettings) {
				try {
					setQbitwebberTableViewSettingsState(JSON.parse(tableSettings));
				} catch (e) {
					console.error("Failed to parse table view settings:", e);
				}
			}

			const interactiveTabTitle = localStorage.getItem(
				STORAGE_KEYS.qbitwebberInteractiveTabTitle,
			);
			if (interactiveTabTitle) {
				setQbitwebberInteractiveTabTitleState(interactiveTabTitle === "true");
			}
		} catch (error) {
			console.error("Error initializing storage:", error);
		}
	}, []);

	// Setters that update both state and localStorage
	const setQbitUser = useCallback((value: string) => {
		setQbitUserState(value);
		try {
			localStorage.setItem(STORAGE_KEYS.qbitUser, value);
		} catch (error) {
			console.error("Error saving qbitUser to storage:", error);
		}
	}, []);

	const setQbitPass = useCallback((value: string) => {
		setQbitPassState(value);
		try {
			localStorage.setItem(STORAGE_KEYS.qbitPass, value);
		} catch (error) {
			console.error("Error saving qbitPass to storage:", error);
		}
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

	const value: StorageContextType = {
		qbitUser,
		setQbitUser,
		qbitPass,
		setQbitPass,
		qbitwebberSizeUnit,
		setQbitwebberSizeUnit,
		qbitwebberInteractiveTabTitle,
		setQbitwebberInteractiveTabTitle,
		qbitwebberTableViewSettings,
		setQbitwebberTableViewSettings,
	};

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
