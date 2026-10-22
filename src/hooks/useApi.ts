import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qbitClient } from "@/lib/api";
import type { Torrent } from "@/types";

export function useAppVersion() {
	return useQuery({
		queryKey: ["app", "version"],
		queryFn: () => qbitClient.getAppVersion(),
		enabled: !!qbitClient.isConfigured(),
	});
}

export function useAltSpeedLimits() {
	return useQuery({
		queryKey: ["transfer", "altSpeedLimits"],
		queryFn: () => qbitClient.getAltSpeedLimitsEnabled(),
		enabled: !!qbitClient.isConfigured(),
		// Can also be toggled from qBittorrent itself or its scheduler.
		refetchInterval: 10000,
	});
}

export function useToggleAltSpeedLimits() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => qbitClient.toggleAltSpeedLimits(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transfer"] });
		},
	});
}

export function useTransferInfo(enableBackgroundRefetch = false) {
	return useQuery({
		queryKey: ["transfer", "info"],
		queryFn: () => qbitClient.getTransferInfo(),
		enabled: !!qbitClient.isConfigured(),
		refetchInterval: 3000,
		refetchIntervalInBackground: enableBackgroundRefetch,
	});
}

// Torrent list kept in sync through /sync/maindata: each poll only transfers
// what changed since the previous response id (rid). Shared by every
// useTorrents() consumer; the server sends a full update whenever the rid
// is 0 or unknown (e.g. new session), so a stale rid is harmless.
const torrentSync = { rid: 0, torrents: new Map<string, Torrent>() };
let pendingSync: Promise<unknown> = Promise.resolve();

// Syncs run one after another so that each one starts from the latest rid.
function syncTorrents(): Promise<Torrent[]> {
	const next = pendingSync.catch(() => {}).then(applyNextSync);
	pendingSync = next;
	return next;
}

async function applyNextSync(): Promise<Torrent[]> {
	try {
		const data = await qbitClient.getMainData(torrentSync.rid);
		if (data.full_update) torrentSync.torrents = new Map();
		for (const [hash, changes] of Object.entries(data.torrents ?? {})) {
			const previous = torrentSync.torrents.get(hash);
			torrentSync.torrents.set(hash, { ...previous, ...changes, hash } as Torrent);
		}
		data.torrents_removed?.forEach((hash) => torrentSync.torrents.delete(hash));
		torrentSync.rid = data.rid;
	} catch (error) {
		torrentSync.rid = 0;
		throw error;
	}
	return Array.from(torrentSync.torrents.values());
}

export function useTorrents() {
	return useQuery({
		queryKey: ["torrents"],
		queryFn: syncTorrents,
		enabled: !!qbitClient.isConfigured(),
		refetchInterval: 5000,
	});
}

export function useTorrentFiles(hash: string | null, isEnabled = true) {
	return useQuery({
		queryKey: ["torrent", hash, "files"],
		queryFn: () =>
			hash ? qbitClient.getTorrentFiles(hash) : Promise.resolve([]),
		enabled: isEnabled && !!hash,
	});
}

export function useTorrentTrackers(hash: string, isEnabled = true) {
	return useQuery({
		queryKey: ["torrent", hash, "trackers"],
		queryFn: () => qbitClient.getTorrentTrackers(hash),
		enabled: isEnabled && !!hash && !!qbitClient.isConfigured(),
		refetchInterval: 5000,
	});
}

export function useTorrentPeers(hash: string, isEnabled = true) {
	return useQuery({
		queryKey: ["torrent", hash, "peers"],
		queryFn: () => qbitClient.getTorrentPeers(hash),
		enabled: isEnabled && !!hash && !!qbitClient.isConfigured(),
		refetchInterval: 5000,
	});
}

export function useAddTorrent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			url,
			file,
			savePath,
			category,
		}: {
			url?: string;
			file?: File;
			savePath?: string;
			category?: string;
		}) => {
			if (url) {
				return qbitClient.addTorrentUrl(url, { savePath, category });
			} else if (file) {
				return qbitClient.addTorrentFile(file, { savePath, category });
			}
			throw new Error("Either url or file must be provided");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["torrents"] });
		},
	});
}

export function useDeleteTorrents() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			hashes,
			deleteFiles,
		}: {
			hashes: string[];
			deleteFiles?: boolean;
		}) => qbitClient.deleteTorrents(hashes, deleteFiles),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["torrents"] });
		},
	});
}

export function useSetFilePriority() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			hash,
			id,
			priority,
		}: {
			hash: string;
			id: string;
			priority: number;
		}) => qbitClient.setFilePriority(hash, id, priority),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["torrent", variables.hash, "files"],
			});
		},
	});
}

export function usePauseTorrents() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (hashes: string[]) => qbitClient.pauseTorrents(hashes),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["torrents"] });
		},
	});
}

export function useResumeTorrents() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (hashes: string[]) => qbitClient.resumeTorrents(hashes),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["torrents"] });
		},
	});
}

export function useSetForceStart() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			hashes,
			forceStart,
		}: {
			hashes: string[];
			forceStart: boolean;
		}) => qbitClient.setForceStart(hashes, forceStart),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["torrents"] });
		},
	});
}

export function useRSSFeeds() {
	return useQuery({
		queryKey: ["rss", "feeds"],
		queryFn: () => qbitClient.getRSSFeeds(),
		enabled: !!qbitClient.isConfigured(),
	});
}

export function useRSSItems(feedUid: string) {
	return useQuery({
		queryKey: ["rss", "items", feedUid],
		queryFn: () => qbitClient.getRSSItems(feedUid),
		enabled: !!feedUid && !!qbitClient.isConfigured(),
	});
}

export function useAddRSSFeed() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (url: string) => qbitClient.addRSSFeed(url),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rss"] });
		},
	});
}

export function useRemoveRSSFeed() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (uid: string) => qbitClient.removeRSSFeed(uid),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rss"] });
		},
	});
}

export function useLogs() {
	return useQuery({
		queryKey: ["logs"],
		queryFn: () => qbitClient.getLogs(true, -1),
		enabled: !!qbitClient.isConfigured(),
		refetchInterval: 5000,
	});
}
