import { useMemo, useState } from "react";
import type { Torrent } from "@/types";

type SortDirection = "asc" | "desc";
type TorrentStateFilter =
	| "downloading"
	| "seeding"
	| "completed"
	| "paused"
	| "stopped"
	| "error";

const PAGE_SIZE = 20;

const STATE_FILTERS: TorrentStateFilter[] = [
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

function getStateFilterLabel(state: TorrentStateFilter): string {
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
	const hasStateFilter = selectedStates.size > 0;
	const hasCategoryFilter = selectedCategories.size > 0;
	const hasTrackerFilter = selectedTrackers.size > 0;

	if (!hasStateFilter && !hasCategoryFilter && !hasTrackerFilter) {
		return true;
	}

	if (hasStateFilter) {
		const stateMatches = Array.from(selectedStates).some((state) =>
			matchesTorrentState(torrent, state),
		);
		if (!stateMatches) return false;
	}

	if (hasCategoryFilter) {
		if (!selectedCategories.has(torrent.category || "")) return false;
	}

	if (hasTrackerFilter) {
		let trackerHost = torrent.tracker;
		try {
			trackerHost = new URL(torrent.tracker).hostname || torrent.tracker;
		} catch {
			/* keep raw */
		}
		if (!selectedTrackers.has(trackerHost)) return false;
	}

	return true;
}

type Columns = keyof Torrent | "category" | "tracker";

export function useTorrentListState(torrents: Torrent[]) {
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
		setSelectedStates(toggleSetItem(selectedStates, state));
		setCurrentPage(1);
	};

	const toggleCategoryFilter = (category: string) => {
		setSelectedCategories(toggleSetItem(selectedCategories, category));
		setCurrentPage(1);
	};

	const toggleTrackerFilter = (tracker: string) => {
		setSelectedTrackers(toggleSetItem(selectedTrackers, tracker));
		setCurrentPage(1);
	};

	const resetFilters = () => {
		setSearchQuery("");
		setSelectedStates(new Set());
		setSelectedCategories(new Set());
		setSelectedTrackers(new Set());
		setCurrentPage(1);
	};

	const totalActiveFilters =
		selectedStates.size + selectedCategories.size + selectedTrackers.size;

	const uniqueCategories = useMemo(() => {
		const cats = new Set<string>();
		torrents.forEach((t) => {
			if (t.category) cats.add(t.category);
		});
		return Array.from(cats).sort();
	}, [torrents]);

	const uniqueTrackers = useMemo(() => {
		const trackers = new Set<string>();
		torrents.forEach((t) => {
			if (t.tracker) {
				try {
					const host = new URL(t.tracker).hostname || t.tracker;
					trackers.add(host);
				} catch {
					trackers.add(t.tracker);
				}
			}
		});
		return Array.from(trackers).sort();
	}, [torrents]);

	const sortedTorrents = useMemo(() => {
		let filtered = torrents.filter((t) =>
			t.name.toLowerCase().includes(searchQuery.toLowerCase()),
		);

		filtered = filtered.filter((t) =>
			matchesFilter(
				t,
				selectedStates,
				selectedCategories,
				selectedTrackers,
			),
		);

		const sorted = [...filtered].sort((a, b) => {
			let aVal: unknown = a[sortField as keyof Torrent];
			let bVal: unknown = b[sortField as keyof Torrent];

			if (sortField === "category") {
				aVal = a.category;
				bVal = b.category;
			} else if (sortField === "tracker") {
				aVal = a.tracker;
				bVal = b.tracker;
			}

			if (aVal === bVal) return 0;
			if (aVal === null || aVal === undefined) return 1;
			if (bVal === null || bVal === undefined) return -1;

			const comparison =
				typeof aVal === "string" && typeof bVal === "string"
					? aVal.localeCompare(bVal)
					: (aVal as number) - (bVal as number);

			return sortDirection === "asc" ? comparison : -comparison;
		});

		return sorted;
	}, [torrents, searchQuery, sortField, sortDirection, selectedStates, selectedCategories, selectedTrackers]);

	const totalPages = Math.ceil(sortedTorrents.length / PAGE_SIZE);
	const paginatedTorrents = sortedTorrents.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE,
	);

	const handleSort = (field: Columns) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("desc");
		}
	};

	const handleSelect = (hash: string) => {
		setSelected(toggleSetItem(selected, hash));
	};

	const handleSelectAll = () => {
		if (selected.size === paginatedTorrents.length) {
			setSelected(new Set());
		} else {
			setSelected(new Set(paginatedTorrents.map((t) => t.hash)));
		}
	};

	return {
		selected,
		setSelected,
		sortField,
		sortDirection,
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
		handleSort,
		handleSelect,
		handleSelectAll,
		// Exported for use in filter dropdown
		STATE_FILTERS,
		getStateFilterLabel,
		matchesTorrentState,
		PAGE_SIZE,
	};
}
