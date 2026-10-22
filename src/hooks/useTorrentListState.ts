import { useMemo, useState } from "react";
import type { Columns, Torrent } from "@/types";

export type SortDirection = "asc" | "desc";
export type TorrentStateFilter =
	| "downloading"
	| "seeding"
	| "completed"
	| "paused"
	| "stopped"
	| "error";

export const PAGE_SIZE = 20;

export const STATE_FILTERS: TorrentStateFilter[] = [
	"downloading",
	"seeding",
	"completed",
	"paused",
	"stopped",
	"error",
];

function toggleSetItem<T>(set: Set<T>, value: T): Set<T> {
	const next = new Set(set);
	if (next.has(value)) next.delete(value);
	else next.add(value);
	return next;
}

export function getStateFilterLabel(state: TorrentStateFilter): string {
	const labels: Record<TorrentStateFilter, string> = {
		downloading: "Downloading",
		seeding: "Seeding",
		completed: "Completed",
		paused: "Paused",
		stopped: "Stopped",
		error: "Error",
	};
	return labels[state];
}

function getTrackerHost(tracker: string): string {
	try {
		return new URL(tracker).hostname || tracker;
	} catch {
		return tracker;
	}
}

function matchesTorrentState(
	torrent: Torrent,
	state: TorrentStateFilter,
): boolean {
	const torrentState = torrent.state;
	const isCompleted = torrent.progress === 1;

	switch (state) {
		case "downloading":
			return (
				torrentState.includes("DL") ||
				torrentState === "metaDL" ||
				torrentState === "forcedMetaDL" ||
				torrentState === "allocating"
			);
		case "seeding":
			return torrentState.includes("UP") && !torrentState.includes("stopped");
		case "completed":
			return isCompleted;
		case "paused":
			return torrentState.startsWith("paused");
		case "stopped":
			return torrentState.startsWith("stopped");
		case "error":
			return torrentState === "error" || torrentState === "missingFiles";
		default:
			return false;
	}
}

function matchesFilter(
	torrent: Torrent,
	selectedStates: Set<TorrentStateFilter>,
	selectedCategories: Set<string>,
	selectedTrackers: Set<string>,
): boolean {
	if (
		selectedStates.size > 0 &&
		!Array.from(selectedStates).some((state) =>
			matchesTorrentState(torrent, state),
		)
	) {
		return false;
	}

	if (
		selectedCategories.size > 0 &&
		!selectedCategories.has(torrent.category || "")
	) {
		return false;
	}

	if (
		selectedTrackers.size > 0 &&
		!selectedTrackers.has(getTrackerHost(torrent.tracker))
	) {
		return false;
	}

	return true;
}

function compareTorrents(a: Torrent, b: Torrent, field: Columns): number {
	switch (field) {
		case "name":
			return a.name.localeCompare(b.name);
		case "size":
			return a.size - b.size;
		case "progress":
			return a.progress - b.progress;
		case "dlspeed":
			return a.dlspeed - b.dlspeed;
		case "upspeed":
			return a.upspeed - b.upspeed;
		case "eta":
			return a.eta - b.eta;
		case "state":
			return a.state.localeCompare(b.state);
		case "ratio":
			return a.ratio - b.ratio;
		case "num_seeds":
			return a.num_seeds - b.num_seeds + (a.num_complete - b.num_complete);
		case "num_leechs":
			return (
				a.num_leechs - b.num_leechs + (a.num_incomplete - b.num_incomplete)
			);
		case "added_on":
			return a.added_on - b.added_on;
		case "uploaded":
			return a.uploaded - b.uploaded;
		case "uploaded_session":
			return a.uploaded_session - b.uploaded_session;
		case "category":
			return a.category.localeCompare(b.category);
		case "tracker":
			return a.tracker.localeCompare(b.tracker);
		default:
			return 0;
	}
}

/**
 * Selection, search, filters, sorting and pagination state for the torrent list.
 */
export function useTorrentListState(torrents: Torrent[] | undefined) {
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [sortField, setSortField] = useState<Columns>("added_on");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedStates, setSelectedStates] = useState<Set<TorrentStateFilter>>(
		new Set(),
	);
	const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
		new Set(),
	);
	const [selectedTrackers, setSelectedTrackers] = useState<Set<string>>(
		new Set(),
	);

	const toggleStateFilter = (state: TorrentStateFilter) => {
		setSelectedStates((prev) => toggleSetItem(prev, state));
		setCurrentPage(1);
	};

	const toggleCategoryFilter = (category: string) => {
		setSelectedCategories((prev) => toggleSetItem(prev, category));
		setCurrentPage(1);
	};

	const toggleTrackerFilter = (tracker: string) => {
		setSelectedTrackers((prev) => toggleSetItem(prev, tracker));
		setCurrentPage(1);
	};

	const resetFilters = () => {
		setSelectedStates(new Set());
		setSelectedCategories(new Set());
		setSelectedTrackers(new Set());
		setCurrentPage(1);
	};

	const totalActiveFilters =
		selectedStates.size + selectedCategories.size + selectedTrackers.size;

	const uniqueCategories = useMemo(() => {
		const cats = new Set<string>(torrents?.map((t) => t.category) || []);
		return Array.from(cats).sort();
	}, [torrents]);

	const uniqueTrackers = useMemo(() => {
		const trackers = new Set<string>();
		torrents?.forEach((t) => {
			const host = getTrackerHost(t.tracker);
			if (host) trackers.add(host);
		});
		return Array.from(trackers).sort();
	}, [torrents]);

	const sortedTorrents = useMemo(() => {
		if (!torrents) return [];
		const query = searchQuery.trim().toLowerCase();
		const filtered = torrents.filter(
			(t) =>
				matchesFilter(t, selectedStates, selectedCategories, selectedTrackers) &&
				(!query || t.name.toLowerCase().includes(query)),
		);
		return filtered.sort((a, b) => {
			const cmp = compareTorrents(a, b, sortField);
			return sortDirection === "asc" ? cmp : -cmp;
		});
	}, [
		torrents,
		searchQuery,
		sortField,
		sortDirection,
		selectedStates,
		selectedCategories,
		selectedTrackers,
	]);

	const totalPages = Math.max(1, Math.ceil(sortedTorrents.length / PAGE_SIZE));
	const paginatedTorrents = sortedTorrents.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE,
	);

	const handleSort = (field: Columns) => {
		if (sortField === field)
			setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
		else {
			setSortField(field);
			setSortDirection("asc");
		}
		setCurrentPage(1);
	};

	const handleSelect = (hash: string, checked: boolean) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (checked) next.add(hash);
			else next.delete(hash);
			return next;
		});
	};

	const handleSelectAll = (checked: boolean) => {
		if (checked) setSelected(new Set(sortedTorrents.map((t) => t.hash)));
		else setSelected(new Set());
	};

	const clearSelection = () => setSelected(new Set());

	return {
		selected,
		clearSelection,
		handleSelect,
		handleSelectAll,
		sortField,
		sortDirection,
		handleSort,
		currentPage,
		setCurrentPage,
		searchQuery,
		setSearchQuery,
		selectedStates,
		selectedCategories,
		selectedTrackers,
		toggleStateFilter,
		toggleCategoryFilter,
		toggleTrackerFilter,
		resetFilters,
		totalActiveFilters,
		uniqueCategories,
		uniqueTrackers,
		sortedTorrents,
		paginatedTorrents,
		totalPages,
	};
}
