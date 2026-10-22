import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useRef,
	ReactNode,
} from "react";
import { qbitClient } from "@/lib/api";
import { useStorage } from "@/contexts/StorageContext";

interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	username: string;
	login: (username: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const storage = useStorage();
	const initialized = useRef(false);

	// On startup, reuse qBittorrent's session cookie if it is still valid.
	// Only the username is persisted; the password is never stored.
	useEffect(() => {
		if (initialized.current) return;
		initialized.current = true;

		const restoreSession = async () => {
			if (storage.qbitUser) {
				qbitClient.setCredentials(storage.qbitUser, "");
			}
			if (await qbitClient.checkSession()) return true;

			// Migration: older versions stored the password in localStorage.
			// Use it one last time to open a session, then it is deleted.
			const legacyPass = storage.consumeLegacyQbitPass();
			if (storage.qbitUser && legacyPass) {
				qbitClient.setCredentials(storage.qbitUser, legacyPass);
				return qbitClient.login().catch(() => false);
			}
			return false;
		};

		restoreSession()
			.then(setIsAuthenticated)
			.finally(() => setIsLoading(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const login = async (newUsername: string, password: string) => {
		setIsLoading(true);
		storage.setQbitUser(newUsername);
		try {
			qbitClient.setCredentials(newUsername, password);
			const success = await qbitClient.login();
			if (success) {
				setIsAuthenticated(true);
			} else {
				throw new Error("Invalid username or password");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const logout = async () => {
		try {
			await qbitClient.logout();
		} finally {
			setIsAuthenticated(false);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				isLoading,
				username: qbitClient.getUsername(),
				login,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
