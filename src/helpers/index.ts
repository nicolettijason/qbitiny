import { defaultPreferences } from "@/constants";
import type { TFunction, TranslationKey } from "@/i18n";

/**
 * Get stored table view settings (columns configuration)
 * Now accepts settings as a parameter to work with context
 */
export const getStoredTableSettings = (
	storedSettings: typeof defaultPreferences.columns,
) => {
	return { ...defaultPreferences.columns, ...storedSettings };
};

/**
 * Format bytes to human-readable size
 * @param bytes - Number of bytes
 * @param sizeUnit - Size unit (defaults to 'B')
 */
export function formatSize(bytes: number, sizeUnit?: string): string {
	sizeUnit = sizeUnit || "B";
	if (!bytes) return `0 ${sizeUnit}`;
	const k = 1024;
	const sizes = [
		sizeUnit,
		`K${sizeUnit}`,
		`M${sizeUnit}`,
		`G${sizeUnit}`,
		`T${sizeUnit}`,
		`P${sizeUnit}`,
	];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatTime(seconds: number): string {
	if (seconds < 0 || seconds >= 8640000) return "--";
	if (seconds < 60) return `${seconds}s`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
	return `${Math.floor(seconds / 86400)}d`;
}

export function formatNextAnnounce(
	timestampSeconds: number,
	t: TFunction,
): string {
	if (!timestampSeconds) return "—";
	const diff = timestampSeconds - Math.floor(Date.now() / 1000);
	if (diff <= 0) return t("detail.now");
	return formatTime(diff);
}

export function formatDate(timestampSeconds: number): string {
	const date = new Date(timestampSeconds * 1000);
	const pad = (n: number) => String(n).padStart(2, "0");

	const jour = pad(date.getDate());
	const mois = pad(date.getMonth() + 1);
	const annee = date.getFullYear();
	const heures = pad(date.getHours());
	const minutes = pad(date.getMinutes());
	const secondes = pad(date.getSeconds());

	return `${jour}/${mois}/${annee} ${heures}:${minutes}:${secondes}`;
}

export function isForcedState(state: string): boolean {
	return state.startsWith("forced");
}

export function isStoppedState(state: string): boolean {
	return state.startsWith("paused") || state.startsWith("stopped");
}

export function getStateColor(state: string, completedOn: number): string {
	if (isStoppedState(state) && completedOn > 0) return "text-green-500";
	if (state === "downloading" || state === "forcedDL" || state === "metaDL")
		return "text-blue-500";
	if (
		state === "uploading" ||
		state === "forcedUP" ||
		state === "checkingUP" ||
		state === "completed" ||
		state === "seeding"
	)
		return "text-green-500";
	if (isStoppedState(state)) return "text-yellow-500";
	if (state === "error") return "text-red-500";
	return "text-muted-foreground";
}

const STATE_LABEL_KEYS: Record<string, TranslationKey> = {
	downloading: "state.downloading",
	pausedDL: "state.paused",
	pausedUP: "state.paused",
	stoppedDL: "state.stopped",
	stoppedUP: "state.stopped",
	uploading: "state.seeding",
	completed: "state.completed",
	seeding: "state.seeding",
	stalledDL: "state.stalled",
	stalledUP: "state.stalled",
	checkingUP: "state.checking",
	checkingDL: "state.checking",
	error: "state.error",
	forcedDL: "state.forcedDownloading",
	forcedUP: "state.forcedSeeding",
	forcedMetaDL: "state.metaDL",
	metaDL: "state.metaDL",
	allocating: "state.allocating",
	checkingResumeData: "state.checking",
	moving: "state.moving",
	missingFiles: "state.missingFiles",
	queuedDL: "state.queued",
	queuedUP: "state.queued",
};

export function getStateLabel(state: string, completedOn: number, t: TFunction) {
	if (isStoppedState(state) && completedOn > 0) return t("state.completed");
	const key = STATE_LABEL_KEYS[state];
	return key ? t(key) : state;
}

const TRACKER_STATUS_KEYS: Record<number, TranslationKey> = {
	0: "trackerStatus.disabled",
	1: "trackerStatus.notContacted",
	2: "trackerStatus.working",
	3: "trackerStatus.updating",
	4: "trackerStatus.notWorking",
	5: "trackerStatus.error",
};

export function getTrackerStatusLabel(status: number, t: TFunction): string {
	return t(TRACKER_STATUS_KEYS[status] ?? "trackerStatus.unknown");
}

export function getTrackerStatusColor(status: number): string {
	switch (status) {
		case 2:
			return "text-green-500";
		case 3:
			return "text-blue-500";
		case 1:
			return "text-yellow-500";
		case 4:
		case 5:
			return "text-red-500";
		default:
			return "text-muted-foreground";
	}
}

/**
 * Copies text to the clipboard. `navigator.clipboard` only exists on secure
 * origins (HTTPS / localhost), which a qBittorrent server reached over plain
 * HTTP on the LAN is not: fall back to a hidden textarea + execCommand.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	if (navigator.clipboard && window.isSecureContext) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			/* fall back below */
		}
	}

	// Insert it inside the open dialog/menu (if any), whose focus trap would
	// otherwise steal the focus back from a textarea placed in <body>.
	const container =
		document.activeElement?.closest('[role="dialog"], [role="menu"]') ??
		document.body;
	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.setAttribute("readonly", "");
	textarea.style.position = "fixed";
	textarea.style.opacity = "0";
	container.appendChild(textarea);
	textarea.select();
	try {
		return document.execCommand("copy");
	} catch {
		return false;
	} finally {
		textarea.remove();
	}
}

export const generateTagColor =(tag?: string) => {
	if (!tag) {
		return undefined;
	}
	switch (tag.toLowerCase()) {
		case "radarr":
			return "#b6891c";
		case "sonarr":
			return "#00CCFF";
		case "lidarr":
			return "#009252";
		default: {
			const hash = Array.from(tag).reduce(
				(acc, char) => acc + char.charCodeAt(0),
				0,
			);
			return `hsl(${hash % 360}, 70%, 50%)`;
		}
	}
};
