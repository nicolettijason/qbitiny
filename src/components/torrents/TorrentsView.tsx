import { useMemo, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ArrowUpDownIcon,
	ChevronLeft,
	ChevronRight,
	Download,
	Eye,
	FastForward,
	Files,
	Filter,
	Pause,
	Play,
	Rewind,
	Search,
	Trash2,
	Upload,
	Users,
	X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { TorrentDetailDialog } from "./TorrentDetailDialog";
import { TorrentFilesDialog } from "./TorrentFilesDialog";
import {
	useTorrents,
	usePauseTorrents,
	useResumeTorrents,
	useDeleteTorrents,
	useSetForceStart,
} from "@/hooks/useApi";
import type { Columns, ColumnsConfig, Torrent } from "@/types";
import {
	formatDate,
	formatSize,
	formatTime,
	generateTagColor,
	getStateColor,
	getStateLabel,
	getStoredTableSettings,
	isForcedState,
	isStoppedState,
} from "@/helpers";
import { columnsDictionary } from "@/constants";
import { Skeleton } from "@/components/ui/skeleton";

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
	// Si aucun filtre n'est sélectionné, tout affiche
	const hasStateFilter = selectedStates.size > 0;
	const hasCategoryFilter = selectedCategories.size > 0;
	const hasTrackerFilter = selectedTrackers.size > 0;

	if (!hasStateFilter && !hasCategoryFilter && !hasTrackerFilter) {
		return true;
	}

	// Vérifier chaque filtre actif
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

function SortButton({
	field,
	currentField,
	direction,
	onClick,
	children,
}: {
	field: Columns;
	currentField: Columns;
	direction: SortDirection;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			onClick={onClick}
			className="flex items-center hover:text-foreground"
		>
			{children}
			{currentField !== field && (
				<ArrowUpDown className="h-4 w-4 ml-1 inline opacity-50" />
			)}
			{currentField === field &&
				(direction === "asc" ? (
					<ArrowUp className="h-4 w-4 ml-1 inline" />
				) : (
					<ArrowDown className="h-4 w-4 ml-1 inline" />
				))}
		</button>
	);
}

// Checkbox is pointer-events-none: the row's onClick handles the toggle, avoiding a double-toggle bug
function FilterCheckboxRow({
	label,
	checked,
	onToggle,
	badgeColor,
}: {
	label: string;
	checked: boolean;
	onToggle: () => void;
	badgeColor?: string;
}) {
	return (
		<div
			className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer"
			onClick={onToggle}
		>
			<Checkbox
				checked={checked}
				className="flex-shrink-0 pointer-events-none"
			/>
			{badgeColor ? (
				<span
					className="text-sm flex-1 rounded px-2 py-0.5"
					style={{
						backgroundColor: badgeColor,
						color: "white",
						fontSize: "0.75rem",
					}}
				>
					{label}
				</span>
			) : (
				<span className="text-sm flex-1 truncate">
					{label || "no category"}
				</span>
			)}
		</div>
	);
}

export function TorrentsView() {
	const { data: torrents, isLoading } = useTorrents();
	const pauseMutation = usePauseTorrents();
	const resumeMutation = useResumeTorrents();
	const forceStartMutation = useSetForceStart();
	const deleteMutation = useDeleteTorrents();

	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [sortField, setSortField] = useState<Columns>("added_on");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [currentPage, setCurrentPage] = useState(1);
	const [filesDialogTorrent, setFilesDialogTorrent] = useState<Torrent | null>(
		null,
	);
	const [detailTorrent, setDetailTorrent] = useState<Torrent | null>(null);
	const [tableSettings] = useState<ColumnsConfig>(() =>
		getStoredTableSettings(),
	);
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

	function toggleFilter<T>(
		setter: React.Dispatch<React.SetStateAction<Set<T>>>,
		value: T,
	) {
		setter((prev) => toggleSetItem(prev, value));
		setCurrentPage(1);
	}

	const totalActiveFilters =
		selectedStates.size + selectedCategories.size + selectedTrackers.size;

	const sizeUnit = useMemo(() => {
		return localStorage.getItem("qbitwebber_sizeUnit") || "B";
	}, []);

	// Extraire les catégories et trackers uniques
	const uniqueCategories = useMemo(() => {
		const cats = new Set<string>(torrents?.map((t) => t.category) || []);
		return Array.from(cats).sort();
	}, [torrents]);

	const uniqueTrackers = useMemo(() => {
		const trackers = new Set<string>();
		torrents?.forEach((t) => {
			let host = t.tracker;
			try {
				host = new URL(t.tracker).hostname || t.tracker;
			} catch {
				/* keep raw */
			}
			if (host) trackers.add(host);
		});
		return Array.from(trackers).sort();
	}, [torrents]);

	function computeSortedTorrents() {
		if (!torrents) return [];
		const filtered = torrents
			.filter((t) =>
				matchesFilter(t, selectedStates, selectedCategories, selectedTrackers),
			)
			.filter((t) =>
				searchQuery.trim()
					? t.name.toLowerCase().includes(searchQuery.toLowerCase())
					: true,
			);
		return [...filtered].sort((a, b) => {
			let cmp: number;

			switch (sortField) {
				case "name":
					cmp = a.name.localeCompare(b.name);
					break;
				case "size":
					cmp = a.size - b.size;
					break;
				case "progress":
					cmp = a.progress - b.progress;
					break;
				case "dlspeed":
					cmp = a.dlspeed - b.dlspeed;
					break;
				case "upspeed":
					cmp = a.upspeed - b.upspeed;
					break;
				case "eta":
					cmp = a.eta - b.eta;
					break;
				case "state":
					cmp = a.state.localeCompare(b.state);
					break;
				case "ratio":
					cmp = a.ratio - b.ratio;
					break;
				case "num_seeds":
					cmp = a.num_seeds - b.num_seeds + (a.num_complete - b.num_complete);
					break;
				case "num_leechs":
					cmp =
						a.num_leechs - b.num_leechs + (a.num_incomplete - b.num_incomplete);
					break;
				case "added_on":
					cmp = a.added_on - b.added_on;
					break;
				case "uploaded":
					cmp = a.uploaded - b.uploaded;
					break;
				case "uploaded_session":
					cmp = a.uploaded_session - b.uploaded_session;
					break;
				case "category":
					cmp = a.category.localeCompare(b.category);
					break;
				case "tracker":
					cmp = a.tracker.localeCompare(b.tracker);
					break;
				default:
					cmp = 0;
			}

			return sortDirection === "asc" ? cmp : -cmp;
		});
	}
	const sortedTorrents = computeSortedTorrents();

	const totalPages = Math.max(1, Math.ceil(sortedTorrents.length / PAGE_SIZE));
	const paginatedTorrents = sortedTorrents.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE,
	);

	const handleSelect = (hash: string, checked: boolean) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (checked) next.add(hash);
			else next.delete(hash);
			return next;
		});
	};

	const handleSelectAll = (checked: boolean) => {
		if (!sortedTorrents) return;
		if (checked) setSelected(new Set(sortedTorrents.map((t) => t.hash)));
		else setSelected(new Set());
	};

	const handleSort = (field: Columns) => {
		if (sortField === field)
			setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
		else {
			setSortField(field);
			setSortDirection("asc");
		}
		setCurrentPage(1);
	};

	const handlePause = () => {
		pauseMutation.mutate(Array.from(selected));
		setSelected(new Set());
	};

	const handleResume = () => {
		resumeMutation.mutate(Array.from(selected));
		setSelected(new Set());
	};

	const handleForceStart = (forceStart: boolean) => {
		forceStartMutation.mutate({ hashes: Array.from(selected), forceStart });
		setSelected(new Set());
	};

	const handleDelete = (deleteFiles: boolean) => {
		deleteMutation.mutate({ hashes: Array.from(selected), deleteFiles });
		setSelected(new Set());
	};

	const orderedFields = Object.keys(tableSettings).sort((a, b) => {
		const orderA = tableSettings[a as keyof ColumnsConfig]?.order ?? 0;
		const orderB = tableSettings[b as keyof ColumnsConfig]?.order ?? 0;
		return orderA - orderB;
	}) as Columns[];

	const cellRenderers: Record<Columns, (torrent: Torrent) => React.ReactNode> =
		{
			name: (torrent) => (
				<div className="text-xs truncate max-w-[300px] lg:max-w-[500px]">
					{torrent.name}
				</div>
			),
			state: (torrent) => (
				<span
					className={`text-xs ${getStateColor(torrent.state, torrent.completion_on)}`}
				>
					{getStateLabel(torrent.state, torrent.completion_on)}
				</span>
			),
			progress: (torrent) => {
				const pct = Math.round(torrent.progress * 100);
				const barColor =
					torrent.state.includes("error") || torrent.state === "missingFiles"
						? "bg-destructive"
						: torrent.state === "pausedDL" || torrent.state === "stoppedDL"
							? "bg-yellow-400"
							: pct === 100
								? "bg-green-500"
								: "bg-primary";
				return (
					<div className="flex items-center gap-2">
						<div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
							<div
								className={`h-full ${barColor} transition-all`}
								style={{ width: `${pct}%` }}
							/>
						</div>
						<span className="text-xs">{pct}%</span>
					</div>
				);
			},
			size: (torrent) => (
				<span className="text-sm">{formatSize(torrent.size, sizeUnit)}</span>
			),
			dlspeed: (torrent) => (
				<div className="flex items-center gap-1">
					<Download className="h-3 w-3 text-blue-500" />
					{formatSize(torrent.dlspeed, sizeUnit)}/s
				</div>
			),
			upspeed: (torrent) => (
				<div className="flex items-center gap-1">
					<Upload className="h-3 w-3 text-green-500" />
					{formatSize(torrent.upspeed, sizeUnit)}/s
				</div>
			),
			eta: (torrent) => (
				<span className="text-sm">{formatTime(torrent.eta)}</span>
			),
			ratio: (torrent) => (
				<span className="text-sm">{torrent.ratio.toFixed(2)}</span>
			),
			num_seeds: (torrent) => (
				<span className="text-sm">
					{torrent.num_seeds + "(" + torrent.num_complete + ")"}
				</span>
			),
			num_leechs: (torrent) => (
				<span className="text-sm">
					{torrent.num_leechs + "(" + torrent.num_incomplete + ")"}
				</span>
			),
			added_on: (torrent) => (
				<span className="text-sm">{formatDate(torrent.added_on)}</span>
			),
			uploaded: (torrent) => (
				<span className="text-sm">
					{formatSize(torrent.uploaded, sizeUnit)}
				</span>
			),
			uploaded_session: (torrent) => (
				<span className="text-sm">
					{formatSize(torrent.uploaded_session, sizeUnit)}
				</span>
			),
			tracker: (torrent) => {
				let host = torrent.tracker;
				try {
					host = new URL(torrent.tracker).hostname;
				} catch {
					/* keep raw */
				}
				return <span className="text-sm">{host}</span>;
			},
			category: (torrent) => (
				<span
					className="text-sm rounded-lg px-2 py-1"
					style={{
						backgroundColor: generateTagColor(torrent.category),
						color: torrent.category ? "white" : "inherit",
					}}
				>
					{torrent.category || "--"}
				</span>
			),
		};

	if (isLoading)
		return (
			<div className="space-y-3">
				{/* Search bar with filter — disabled while loading */}
				<div className="flex gap-2 items-center">
					<div className="relative flex-1">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<input
							disabled
							className="w-full h-10 pl-9 pr-8 py-2 text-sm rounded-md border border-input bg-muted text-muted-foreground cursor-not-allowed opacity-60"
							placeholder="Filter torrents..."
							value=""
							onChange={() => {}}
						/>
					</div>
					<Button variant="outline" disabled className="gap-2 h-10 px-3">
						<Filter className="h-4 w-4" />
						<span className="hidden sm:inline">Filtres</span>
					</Button>
				</div>
				{/* Desktop skeleton table */}
				<div className="hidden md:block">
					<Card>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[40px]">
												<Skeleton className="h-4 w-4" />
											</TableHead>
											{Array.from({ length: 6 }).map((_, i) => (
												<TableHead key={i}>
													<Skeleton className="h-4 w-20" />
												</TableHead>
											))}
											<TableHead />
										</TableRow>
									</TableHeader>
									<TableBody>
										{Array.from({ length: 8 }).map((_, i) => (
											<TableRow key={i}>
												<TableCell>
													<Skeleton className="h-4 w-4" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-4 w-56" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-4 w-16" />
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Skeleton className="h-1.5 w-16 rounded-full" />
														<Skeleton className="h-4 w-8" />
													</div>
												</TableCell>
												<TableCell>
													<Skeleton className="h-4 w-16" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-4 w-16" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-4 w-10" />
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1">
														<Skeleton className="h-8 w-8 rounded-md" />
														<Skeleton className="h-8 w-8 rounded-md" />
														<Skeleton className="h-8 w-8 rounded-md" />
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Mobile skeleton cards */}
				<div className="md:hidden space-y-1.5">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="rounded-xl border bg-card">
							{/* Top bar */}
							<div className="flex items-center gap-2 px-3 pt-3 pb-1">
								<Skeleton className="h-4 w-4 rounded flex-shrink-0" />
								<Skeleton className="h-4 flex-1 max-w-[200px]" />
								<Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
							</div>
							{/* Progress bar */}
							<div className="mx-3 mt-1">
								<Skeleton className="h-1 w-full rounded-full" />
							</div>
							{/* Stats row */}
							<div className="flex items-center gap-3 px-3 py-2">
								<Skeleton className="h-3 w-16" />
								<Skeleton className="h-3 w-8" />
								<Skeleton className="h-3 w-12" />
							</div>
							{/* Bottom row */}
							<div className="flex items-center justify-between border-t border-border/50 px-3 py-1.5">
								<div className="flex items-center gap-3">
									<Skeleton className="h-3 w-16" />
									<Skeleton className="h-3 w-16" />
									<Skeleton className="h-3 w-10" />
								</div>
								<div className="flex items-center gap-1">
									<Skeleton className="h-7 w-7 rounded-md" />
									<Skeleton className="h-7 w-7 rounded-md" />
									<Skeleton className="h-7 w-7 rounded-md" />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	if (!torrents || torrents.length === 0)
		return (
			<div className="text-center py-8 text-muted-foreground">No torrents</div>
		);

	return (
		<div className="space-y-3">
			{/* Search bar with filter */}
			<div className="flex gap-2 items-center">
				<div className="relative flex-1">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<input
						className="w-full h-10 pl-9 pr-8 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
						placeholder="Filter torrents..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
					/>
					{searchQuery && (
						<button
							className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							onClick={() => setSearchQuery("")}
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild className="h-full">
						<Button
							variant="outline"
							className="gap-2 h-10 px-3 focus-visible:outline-none focus-visible:ring-0"
						>
							<Filter className="h-4 w-4" />
							<span className="hidden sm:inline">
								{totalActiveFilters === 0
									? "Filters"
									: `${totalActiveFilters} filters`}
							</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-64">
						{/* State section */}
						<div className="px-2 py-2">
							<div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
								State
							</div>
							{STATE_FILTERS.map((state) => (
								<FilterCheckboxRow
									key={state}
									label={getStateFilterLabel(state)}
									checked={selectedStates.has(state)}
									onToggle={() => toggleFilter(setSelectedStates, state)}
								/>
							))}
						</div>

						{uniqueCategories.length > 0 && (
							<>
								<div className="h-px bg-border my-2" />
								<div className="px-2 py-2">
									<div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
										Categories
									</div>
									{uniqueCategories.map((category) => (
										<FilterCheckboxRow
											key={category}
											label={category}
											checked={selectedCategories.has(category)}
											onToggle={() =>
												toggleFilter(setSelectedCategories, category)
											}
											badgeColor={generateTagColor(category)}
										/>
									))}
								</div>
							</>
						)}

						{uniqueTrackers.length > 0 && (
							<>
								<div className="h-px bg-border my-2" />
								<div className="px-2 py-2">
									<div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
										Trackers
									</div>
									<div className="max-h-40 overflow-y-auto">
										{uniqueTrackers.map((tracker) => (
											<FilterCheckboxRow
												key={tracker}
												label={tracker}
												checked={selectedTrackers.has(tracker)}
												onToggle={() =>
													toggleFilter(setSelectedTrackers, tracker)
												}
											/>
										))}
									</div>
								</div>
							</>
						)}

						{totalActiveFilters > 0 && (
							<>
								<div className="h-px bg-border my-2" />
								<div className="px-2 py-2">
									<Button
										variant="ghost"
										size="sm"
										className="w-full text-xs"
										onClick={() => {
											setSelectedStates(new Set());
											setSelectedCategories(new Set());
											setSelectedTrackers(new Set());
											setCurrentPage(1);
										}}
									>
										Reset filters
									</Button>
								</div>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{selected.size > 0 && (
				<div className="flex items-center gap-2 p-2 bg-muted rounded-lg overflow-x-auto">
					<span className="text-sm whitespace-nowrap">
						{selected.size} selected
					</span>
					<Button variant="ghost" size="sm" onClick={handleResume}>
						<Play className="h-4 w-4 mr-1" /> Resume
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleForceStart(true)}
					>
						<Play className="h-4 w-4 mr-1" /> Force Start
					</Button>
					<Button variant="ghost" size="sm" onClick={handlePause}>
						<Pause className="h-4 w-4 mr-1" /> Pause
					</Button>
					<Button variant="ghost" size="sm" onClick={() => handleDelete(false)}>
						<Trash2 className="h-4 w-4 mr-1" /> Delete
					</Button>
					<Button variant="ghost" size="sm" onClick={() => handleDelete(true)}>
						<Trash2 className="h-4 w-4 mr-1" /> Delete + Files
					</Button>
				</div>
			)}

			{/* Mobile Sort Dropdown */}
			<div className="md:hidden flex items-center justify-between">
				<span className="text-sm text-muted-foreground">
					{sortedTorrents.length} torrents
				</span>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm">
							<ArrowUpDownIcon className="h-4 w-4 mr-2" />
							Sort:{" "}
							{columnsDictionary[sortField as keyof typeof columnsDictionary]}
							{sortDirection === "asc" ? " ↑" : " ↓"}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{orderedFields.map((field) => {
							if (!tableSettings[field as keyof ColumnsConfig]?.active)
								return null;
							return (
								<DropdownMenuItem key={field} onClick={() => handleSort(field)}>
									{columnsDictionary[field as keyof typeof columnsDictionary]}{" "}
									{sortField === field && (sortDirection === "asc" ? "↑" : "↓")}
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Desktop Table */}
			<div className="hidden md:block">
				<Card>
					<CardContent className="p-0">
						<div className="overflow-x-auto max-w-[calc(100vw-241px)]">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[40px]">
											<Checkbox
												checked={
													selected.size === sortedTorrents.length &&
													sortedTorrents.length > 0
												}
												onCheckedChange={handleSelectAll}
											/>
										</TableHead>
										{orderedFields.map((field) => {
											if (!tableSettings[field as keyof ColumnsConfig]?.active)
												return null;
											return (
												<TableHead
													key={field}
													className={`w-[${field === "name" ? "300px" : "80px"}]`}
												>
													<SortButton
														field={field}
														currentField={sortField}
														direction={sortDirection}
														onClick={() => handleSort(field)}
													>
														{
															columnsDictionary[
																field as keyof typeof columnsDictionary
															]
														}
													</SortButton>
												</TableHead>
											);
										})}
										<TableHead className="w-[80px]" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedTorrents.map((torrent) => {
										const isActive = !isStoppedState(torrent.state);
										const isForced = isForcedState(torrent.state);
										return (
											<TableRow
												key={torrent.hash}
												className={selected.has(torrent.hash) ? "bg-muted" : ""}
											>
												<TableCell>
													<Checkbox
														checked={selected.has(torrent.hash)}
														onCheckedChange={(checked) =>
															handleSelect(torrent.hash, !!checked)
														}
													/>
												</TableCell>
												{orderedFields.map((field) => {
													if (!tableSettings[field].active) return null;
													return (
														<TableCell
															key={field}
															title={
																field === "name" ? torrent.name : undefined
															}
														>
															{cellRenderers[field](torrent)}
														</TableCell>
													);
												})}
												<TableCell>
													<div className="flex items-center gap-1">
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
															onClick={() => setDetailTorrent(torrent)}
															title="Details"
														>
															<Eye className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 mr-2"
															onClick={() =>
																isActive
																	? pauseMutation.mutate([torrent.hash])
																	: resumeMutation.mutate([torrent.hash])
															}
														>
															{isActive ? (
																<Pause className="h-4 w-4" />
															) : (
																<Play className="h-4 w-4" />
															)}
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 mr-2"
															disabled={isForced !== torrent.force_start}
															onClick={() =>
																forceStartMutation.mutate({
																	hashes: [torrent.hash],
																	forceStart: !isForced,
																})
															}
															title={
																isForced
																	? "Disable Force Start"
																	: "Enable Force Start"
															}
														>
															{isForced ? (
																<Rewind className="h-4 w-4" />
															) : (
																<FastForward className="h-4 w-4" />
															)}
														</Button>

														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
															onClick={() => setFilesDialogTorrent(torrent)}
														>
															<Files className="h-4 w-4 mr-2" />
														</Button>
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8"
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuItem
																	onClick={() =>
																		deleteMutation.mutate({
																			hashes: [torrent.hash],
																			deleteFiles: false,
																		})
																	}
																>
																	Delete
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		deleteMutation.mutate({
																			hashes: [torrent.hash],
																			deleteFiles: true,
																		})
																	}
																	className="text-destructive"
																>
																	Delete + Files
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Mobile Cards */}
			<div className="md:hidden space-y-1.5">
				{paginatedTorrents.map((torrent) => {
					const isActive = !isStoppedState(torrent.state);
					const isForced = isForcedState(torrent.state);
					const progressPct = Math.round(torrent.progress * 100);
					const barColor =
						torrent.state.includes("error") || torrent.state === "missingFiles"
							? "bg-destructive"
							: torrent.state === "pausedDL" || torrent.state === "stoppedDL"
								? "bg-yellow-400"
								: torrent.progress === 1
									? "bg-green-500"
									: "bg-primary";
					const stateColor = getStateColor(
						torrent.state,
						torrent.completion_on,
					);

					return (
						<div
							key={torrent.hash}
							className={`rounded-xl border bg-card transition-colors ${selected.has(torrent.hash) ? "border-primary/60 bg-primary/5" : "border-border"}`}
						>
							{/* Top: checkbox + name + play/pause */}
							<div className="flex items-center gap-2 px-3 pt-3 pb-1">
								<Checkbox
									checked={selected.has(torrent.hash)}
									onCheckedChange={(checked) =>
										handleSelect(torrent.hash, !!checked)
									}
									className="flex-shrink-0"
								/>
								<p
									className="font-medium text-sm truncate max-w-[180px] flex-1 cursor-pointer leading-tight"
									onClick={() => setDetailTorrent(torrent)}
								>
									{torrent.name}
								</p>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 flex-shrink-0 rounded-full"
									onClick={() =>
										isActive
											? pauseMutation.mutate([torrent.hash])
											: resumeMutation.mutate([torrent.hash])
									}
								>
									{isActive ? (
										<Pause className="h-4 w-4" />
									) : (
										<Play className="h-4 w-4" />
									)}
								</Button>
							</div>

							{/* Progress bar */}
							<div className="mx-3 mt-1 h-1 rounded-full bg-secondary overflow-hidden">
								<div
									className={`h-full rounded-full transition-all ${barColor}`}
									style={{ width: `${progressPct}%` }}
								/>
							</div>

							{/* Stats row */}
							<div className="flex items-center gap-3 px-3 py-2 text-[11px] text-muted-foreground">
								<span className={`font-medium ${stateColor}`}>
									{getStateLabel(torrent.state, torrent.completion_on)}
								</span>
								<span className="tabular-nums">{progressPct}%</span>
								<span>{formatSize(torrent.size, sizeUnit)}</span>
								{torrent.category ? (
									<span
										className="rounded px-1.5 py-0.5 font-medium text-[10px]"
										style={{
											backgroundColor: generateTagColor(torrent.category),
											color: "white",
										}}
									>
										{torrent.category}
									</span>
								) : null}
							</div>

							{/* Bottom: speeds + actions */}
							<div className="flex items-center justify-between border-t border-border/50 px-3 py-1.5">
								<div className="flex items-center gap-3 text-[11px] text-muted-foreground">
									<span className="flex items-center gap-1">
										<Download className="h-3 w-3 text-blue-500" />
										<span className="tabular-nums">
											{formatSize(torrent.dlspeed, sizeUnit)}/s
										</span>
									</span>
									<span className="flex items-center gap-1">
										<Upload className="h-3 w-3 text-green-500" />
										<span className="tabular-nums">
											{formatSize(torrent.upspeed, sizeUnit)}/s
										</span>
									</span>
									<span className="flex items-center gap-1">
										<Users className="h-3 w-3" />
										<span>
											{torrent.num_seeds}/{torrent.num_leechs}
										</span>
									</span>
								</div>
								<div className="flex items-center">
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={() => setDetailTorrent(torrent)}
									>
										<Eye className="h-3.5 w-3.5" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 flex-shrink-0 rounded-full"
										onClick={() =>
											forceStartMutation.mutate({
												hashes: [torrent.hash],
												forceStart: !isForced,
											})
										}
										title={
											isForced ? "Disable Force Start" : "Enable Force Start"
										}
									>
										{isForced ? (
											<Rewind className="h-4 w-4" />
										) : (
											<FastForward className="h-4 w-4" />
										)}
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={() => setFilesDialogTorrent(torrent)}
									>
										<Files className="h-3.5 w-3.5" />
									</Button>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 hover:text-destructive"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() =>
													deleteMutation.mutate({
														hashes: [torrent.hash],
														deleteFiles: false,
													})
												}
											>
												Delete torrent
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() =>
													deleteMutation.mutate({
														hashes: [torrent.hash],
														deleteFiles: true,
													})
												}
												className="text-destructive"
											>
												Delete + Files
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between px-2">
					<div className="text-sm text-muted-foreground">
						{sortedTorrents.length} torrents
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage((p) => p - 1)}
							disabled={currentPage === 1}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<span className="text-sm">
							{currentPage} / {totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage((p) => p + 1)}
							disabled={currentPage === totalPages}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}

			<TorrentDetailDialog
				torrent={detailTorrent}
				open={!!detailTorrent}
				onOpenChange={(open) => !open && setDetailTorrent(null)}
				onPause={(hash) => pauseMutation.mutate([hash])}
				onResume={(hash) => resumeMutation.mutate([hash])}
				onForceStartChange={(hash, forceStart) =>
					forceStartMutation.mutate({ hashes: [hash], forceStart })
				}
				onDelete={(hash, deleteFiles) =>
					deleteMutation.mutate({ hashes: [hash], deleteFiles })
				}
				onOpenFiles={(torrent) => {
					setDetailTorrent(null);
					setFilesDialogTorrent(torrent);
				}}
			/>

			<TorrentFilesDialog
				torrent={filesDialogTorrent}
				open={!!filesDialogTorrent}
				onOpenChange={(open) => !open && setFilesDialogTorrent(null)}
			/>
		</div>
	);
}
