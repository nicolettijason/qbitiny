import type {
	AppConfig,
	MainData,
	TorrentFile,
	TorrentTracker,
	RSSFeed,
	RSSItem,
	RSSRule,
	SearchResult,
	LogEntry,
	TransferInfo,
	TorrentPeersResponse,
	Preferences,
} from "@/types";

import { demoClient } from "./demoClient";

const DEFAULT_USER = "admin";

// Authentication relies on qBittorrent's SID session cookie, which the browser
// stores and sends itself (same origin). The password is only kept in memory,
// to log in again transparently when the session expires.
class QBittorrentClient {
	private username: string;
	private password: string;
	private authenticated = false;
	private pendingLogin: Promise<boolean> | null = null;

	constructor(username?: string, password?: string) {
		this.username = username || DEFAULT_USER;
		this.password = password || "";
	}

	setCredentials(username: string, password: string) {
		this.username = username;
		this.password = password;
	}

	getUsername() {
		return this.username;
	}

	isConfigured(): boolean {
		return this.authenticated;
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<T> {
		let response = await fetch(endpoint, options);

		// Session expired: log in again once with the in-memory credentials,
		// then retry the request.
		if (
			(response.status === 403 || response.status === 401) &&
			this.authenticated &&
			this.password
		) {
			if (await this.relogin()) {
				response = await fetch(endpoint, options);
			}
		}

		const responseText = await response.text();

		if (!response.ok) {
			if (response.status === 403 || response.status === 401) {
				throw new Error("Authentication required");
			}
			throw new Error(`Request failed: ${response.status} - ${responseText}`);
		}

		try {
			return JSON.parse(responseText);
		} catch {
			return responseText as T;
		}
	}

	async login(): Promise<boolean> {
		const formData = new URLSearchParams();
		formData.append("username", this.username);
		formData.append("password", this.password);

		const response = await fetch(`/api/v2/auth/login`, {
			method: "POST",
			body: formData,
		});
		// qBittorrent answers 200 with "Fails." on wrong credentials.
		const body = await response.text();
		this.authenticated = response.ok && body.trim() === "Ok.";
		return this.authenticated;
	}

	// Concurrent requests hitting an expired session share a single login.
	private relogin(): Promise<boolean> {
		if (!this.pendingLogin) {
			this.pendingLogin = this.login()
				.catch(() => false)
				.finally(() => {
					this.pendingLogin = null;
				});
		}
		return this.pendingLogin;
	}

	/** Checks whether the browser already holds a valid session cookie. */
	async checkSession(): Promise<boolean> {
		try {
			await this.request<string>("/api/v2/app/version");
			this.authenticated = true;
		} catch {
			this.authenticated = false;
		}
		return this.authenticated;
	}

	async logout(): Promise<void> {
		this.authenticated = false;
		this.password = "";
		await this.request("/api/v2/auth/logout", { method: "POST" });
	}

	async getAppVersion(): Promise<string> {
		return this.request<string>("/api/v2/app/version");
	}

	async getAppConfig(): Promise<AppConfig> {
		return this.request<AppConfig>("/api/v2/app/config");
	}

	async getPreferences(): Promise<Omit<Preferences, "columns" | "sizeUnit">> {
		return this.request<Omit<Preferences, "columns" | "sizeUnit">>("/api/v2/app/preferences");
	}

	async setPreferences(prefs: Record<string, unknown>): Promise<void> {
		const body = new URLSearchParams();
		body.append("json", JSON.stringify(prefs));
		await this.request("/api/v2/app/setPreferences", {
			method: "POST",
			body,
		});
	}

	async revertToDefaultWebUI(): Promise<void> {
		await this.setPreferences({ alternative_webui_enabled: false });
	}

	async getTransferInfo(): Promise<TransferInfo> {
		return this.request<TransferInfo>("/api/v2/transfer/info");
	}

	/**
	 * Incremental sync: only returns what changed since response `rid`
	 * (a full update when `rid` is 0 or unknown to the server).
	 */
	async getMainData(rid: number): Promise<MainData> {
		return this.request<MainData>(`/api/v2/sync/maindata?rid=${rid}`);
	}

	async getTorrentFiles(hash: string): Promise<TorrentFile[]> {
		return this.request<TorrentFile[]>(`/api/v2/torrents/files?hash=${hash}`);
	}

	async getTorrentPeers(hash: string): Promise<TorrentPeersResponse> {
		return this.request<TorrentPeersResponse>(
			`/api/v2/sync/torrentPeers?hash=${hash}`,
		);
	}

	async setFilePriority(
		hash: string,
		id: string,
		priority: number,
	): Promise<void> {
		const formData = new URLSearchParams();
		formData.append("hash", hash);
		formData.append("id", id);
		formData.append("priority", priority.toString());

		await this.request("/api/v2/torrents/filePrio", {
			method: "POST",
			body: formData,
		});
	}

	async getTorrentTrackers(hash: string): Promise<TorrentTracker[]> {
		return this.request<TorrentTracker[]>(
			`/api/v2/torrents/trackers?hash=${hash}`,
		);
	}

	async addTorrentUrl(
		url: string,
		options?: { savePath?: string; category?: string },
	): Promise<void> {
		const formData = new URLSearchParams();
		formData.append("urls", url);
		if (options?.savePath) formData.append("savepath", options.savePath);
		if (options?.category) formData.append("category", options.category);

		await this.request("/api/v2/torrents/add", {
			method: "POST",
			body: formData,
		});
	}

	async addTorrentFile(
		file: File,
		options?: { savePath?: string; category?: string },
	): Promise<void> {
		const formData = new FormData();
		formData.append("torrents", file);
		if (options?.savePath) formData.append("savepath", options.savePath);
		if (options?.category) formData.append("category", options.category);

		await this.request("/api/v2/torrents/add", {
			method: "POST",
			body: formData,
		});
	}

	async deleteTorrents(
		hashes: string[],
		deleteFiles: boolean = false,
	): Promise<void> {
		const formData = new URLSearchParams();
		formData.append("hashes", hashes.join("|"));
		formData.append("deleteFiles", deleteFiles.toString());

		await this.request("/api/v2/torrents/delete", {
			method: "POST",
			body: formData,
		});
	}

	async pauseTorrents(hashes: string[]): Promise<void> {
		const formData = new URLSearchParams();
		formData.append("hashes", hashes.join("|"));

		await this.request("/api/v2/torrents/stop", {
			method: "POST",
			body: formData,
		});
	}

	async resumeTorrents(hashes: string[]): Promise<void> {
		const formData = new URLSearchParams();
		formData.append("hashes", hashes.join("|"));

		await this.request("/api/v2/torrents/start", {
			method: "POST",
			body: formData,
		});
	}

	async setForceStart(hashes: string[], forceStart: boolean): Promise<void> {
		const formData = new URLSearchParams();
		formData.append("hashes", hashes.join("|"));
		formData.append("value", forceStart ? "true" : "false");
		await this.request("/api/v2/torrents/setForceStart", {
			method: "POST",
			body: formData,
		});
	}

	async getRSSFeeds(): Promise<{ feeds: RSSFeed[] }> {
		return this.request("/api/v2/rss/feeds");
	}

	async getRSSItems(feedUid: string): Promise<{ articles: RSSItem[] }> {
		return this.request(`/api/v2/rss/items?uid=${feedUid}`);
	}

	async addRSSFeed(url: string): Promise<void> {
		const formData = new URLSearchParams();
		formData.append("url", url);

		await this.request("/api/v2/rss/addFeed", {
			method: "POST",
			body: formData,
		});
	}

	async removeRSSFeed(uid: string): Promise<void> {
		const formData = new URLSearchParams();
		formData.append("uid", uid);

		await this.request("/api/v2/rss/removeFeed", {
			method: "POST",
			body: formData,
		});
	}

	async markAsRead(uid: string, articleId?: string): Promise<void> {
		const formData = new URLSearchParams();
		formData.append("uid", uid);
		if (articleId) formData.append("articleId", articleId);

		await this.request("/api/v2/rss/markAsRead", {
			method: "POST",
			body: formData,
		});
	}

	async getRSSRules(): Promise<{ rules: RSSRule[] }> {
		return this.request("/api/v2/rss/rules");
	}

	async searchPlugins(): Promise<{
		plugins: { name: string; version: string; enabled: boolean }[];
	}> {
		return this.request("/api/v2/search/plugins");
	}

	async startSearch(pattern: string): Promise<{ id: number }> {
		const body = `pattern=${encodeURIComponent(pattern).replace(/%20/g, "+")}&plugins=all&category=all`;

		return this.request("/api/v2/search/start", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		});
	}

	async stopSearch(id: number): Promise<void> {
		const body = `id=${id}`;
		await this.request("/api/v2/search/stop", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		});
	}

	async getSearchResults(
		id: number,
	): Promise<{ results: SearchResult[]; status: string }> {
		return this.request(`/api/v2/search/results?id=${id}`);
	}

	async getLogs(
		normal: boolean = true,
		lastId: number = -1,
	): Promise<LogEntry[]> {
		return this.request(`/api/v2/log/main?normal=${normal}&lastId=${lastId}`);
	}
}

export const qbitClient =
	import.meta.env.VITE_DEMO_MODE === "true"
		? demoClient
		: new QBittorrentClient();
