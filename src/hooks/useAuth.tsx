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
	/** qBittorrent does not require authentication for this client. */
	authBypassed: boolean;
	username: string;
	login: (
		username: string,
		password: string,
		rememberMe: boolean,
	) => Promise<void>;
	logout: () => Promise<void>;
	/** Re-checks the bypass after the authentication settings changed. */
	refreshAuthBypass: () => Promise<void>;
	/**
	 * Keeps the client (and the remembered password, if any) in sync after the
	 * Web UI credentials were changed in the settings.
	 */
	updateCredentials: (username: string, password?: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [authBypassed, setAuthBypassed] = useState(false);
	const storage = useStorage();
	const initialized = useRef(false);

	// On startup: if qBittorrent bypasses authentication for this client,
	// there is nothing to log into (nor out of). Otherwise reuse qBittorrent's
	// session cookie if it is still valid, else log in with the remembered
	// credentials (if "Remember me" was ticked). Either way, the client can then
	// log in again by itself when the session expires.
	useEffect(() => {
		if (initialized.current) return;
		initialized.current = true;

		const restoreSession = async () => {
			const { qbitUser, qbitPass } = storage;
			if (qbitUser) qbitClient.setCredentials(qbitUser, qbitPass);
			if (await qbitClient.checkAuthBypass()) {
				setAuthBypassed(true);
				return true;
			}
			if (await qbitClient.checkSession()) return true;
			if (qbitUser && qbitPass) {
				const success = await qbitClient.login().catch(() => false);
				if (!success) storage.setQbitPass("");
				return success;
			}
			return false;
		};

		restoreSession()
			.then(setIsAuthenticated)
			.finally(() => setIsLoading(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const login = async (
		newUsername: string,
		password: string,
		rememberMe: boolean,
	) => {
		// No global isLoading here: it would swap the LoginForm for the startup
		// spinner and remount it, losing its error message. The form shows its
		// own pending state.
		storage.setQbitUser(newUsername);
		qbitClient.setCredentials(newUsername, password);
		const success = await qbitClient.login();
		if (!success) throw new Error("invalid_credentials");
		storage.setQbitPass(rememberMe ? password : "");
		setIsAuthenticated(true);
	};

	const logout = async () => {
		storage.setQbitPass("");
		try {
			await qbitClient.logout();
		} finally {
			setIsAuthenticated(false);
		}
	};

	const refreshAuthBypass = async () => {
		setAuthBypassed(await qbitClient.checkAuthBypass());
	};

	const updateCredentials = (newUsername: string, password?: string) => {
		qbitClient.setCredentials(newUsername, password);
		storage.setQbitUser(newUsername);
		if (password && storage.qbitPass) storage.setQbitPass(password);
	};

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				isLoading,
				authBypassed,
				username: qbitClient.getUsername(),
				login,
				logout,
				refreshAuthBypass,
				updateCredentials,
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
