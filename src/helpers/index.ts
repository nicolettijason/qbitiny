import { defaultPreferences } from "@/constants";

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

export function formatNextAnnounce(timestampSeconds: number): string {
	if (!timestampSeconds) return "—";
	const diff = timestampSeconds - Math.floor(Date.now() / 1000);
	if (diff <= 0) return "Now";
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

export function getStateLabel(state: string, completedOn: number) {
	if (isStoppedState(state) && completedOn > 0) return "Completed";

	const labels: Record<string, string> = {
		downloading: "Downloading",
		pausedDL: "Paused",
		pausedUP: "Paused",
		stoppedDL: "Stopped",
		stoppedUP: "Stopped",
		uploading: "Seeding",
		completed: "Completed",
		seeding: "Seeding",
		stalledDL: "Stalled",
		stalledUP: "Stalled",
		checkingUP: "Checking",
		checkingDL: "Checking",
		error: "Error",
		forcedDL: "[F] Downloading",
		forcedUP: "[F] Seeding",
		forcedMetaDL: "Meta DL",
		metaDL: "Meta DL",
		allocating: "Allocating",
		checkingResumeData: "Checking",
		moving: "Moving",
		missingFiles: "Missing Files",
		queuedDL: "Queued",
		queuedUP: "Queued",
	};

	return labels[state] || state;
}

export function getTrackerStatusLabel(status: number): string {
	const labels: Record<number, string> = {
		0: "Disabled",
		1: "Not contacted",
		2: "Working",
		3: "Updating",
		4: "Not working",
	};
	return labels[status] ?? "Unknown";
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
			return "text-red-500";
		default:
			return "text-muted-foreground";
	}
}

export const generateTagColor = (tag?: string) => {
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
