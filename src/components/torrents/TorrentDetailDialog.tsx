import {
	ChevronDown,
	ChevronUp,
	Clock,
	Download,
	FastForward,
	Files,
	HardDrive,
	Magnet,
	Pause,
	Play,
	Rewind,
	Server,
	Trash2,
	TrendingUp,
	Upload,
	UserRound,
	Users,
	X,
	Zap,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useStoragePreferences } from "@/hooks/useStoragePreferences";
import {
	formatDate,
	formatNextAnnounce,
	formatSize,
	formatTime,
	generateTagColor,
	getStateColor,
	getStateLabel,
	getTrackerStatusColor,
	getTrackerStatusLabel,
	isStoppedState,
} from "@/helpers";
import type { Torrent, TorrentTracker, TrackerEndpoint } from "@/types";
import { useTorrentPeers, useTorrentTrackers } from "@/hooks/useApi";

interface TorrentDetailDialogProps {
	torrent: Torrent | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onPause: (hash: string) => void;
	onResume: (hash: string) => void;
	onForceStartChange: (hash: string, forceStart: boolean) => void;
	onDelete: (hash: string, deleteFiles: boolean) => void;
	onOpenFiles: (torrent: Torrent) => void;
}

function StatCard({
	icon,
	label,
	value,
	className,
}: {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`bg-muted/50 rounded-lg p-3 flex flex-col gap-1 ${className ?? ""}`}
		>
			<div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider">
				{icon}
				{label}
			</div>
			<div className="text-sm font-medium truncate">{value}</div>
		</div>
	);
}

function InfoRow({
	label,
	value,
	mono,
}: {
	label: string;
	value: React.ReactNode;
	mono?: boolean;
}) {
	const [copied, setCopied] = useState(false);
	const isString = typeof value === "string";

	const handleCopy = () => {
		if (isString) {
			navigator.clipboard.writeText(value as string);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	};

	return (
		<div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 py-2 border-b border-border/40 last:border-0">
			<span className="text-[10px] uppercase tracking-wider text-muted-foreground sm:w-36 flex-shrink-0 leading-5">
				{label}
			</span>
			<span
				className={`text-xs break-all flex-1 ${mono ? "font-mono text-[10px]" : ""} ${isString ? "cursor-pointer hover:text-primary transition-colors" : ""}`}
				onClick={isString ? handleCopy : undefined}
				title={isString ? (copied ? "Copied!" : "Click to copy") : undefined}
			>
				{copied ? <span className="text-green-500">Copied!</span> : value}
			</span>
		</div>
	);
}

function TrackerStatBadges({
	tier,
	status,
	seeds,
	peers,
	leech,
	down,
	next,
}: {
	tier?: number;
	status: number;
	seeds: number;
	peers: number;
	leech: number;
	down: number;
	next: string;
}) {
	return (
		<div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[9px] text-muted-foreground/80">
			{tier !== undefined && (
				<span>
					Tier <span className="text-muted-foreground">{tier}</span>
				</span>
			)}
			<span className={getTrackerStatusColor(status)}>
				{getTrackerStatusLabel(status)}
			</span>
			<span>
				S <span className="text-muted-foreground">{seeds >= 0 ? seeds : "—"}</span>
			</span>
			<span>
				P <span className="text-muted-foreground">{peers >= 0 ? peers : "—"}</span>
			</span>
			<span>
				L <span className="text-muted-foreground">{leech >= 0 ? leech : "—"}</span>
			</span>
			<span>
				D <span className="text-muted-foreground">{down >= 0 ? down : "—"}</span>
			</span>
			<span>
				Next <span className="text-muted-foreground">{next}</span>
			</span>
		</div>
	);
}

function EndpointRow({ endpoint }: { endpoint: TrackerEndpoint }) {
	const nextLabel = formatNextAnnounce(endpoint.next_announce);

	return (
		<div
			className="text-[10px] text-muted-foreground/80"
			title={endpoint.msg || endpoint.name}
		>
			{/* Desktop row */}
			<div className="hidden sm:flex items-center gap-2">
				<span className="flex-1 truncate">
					{endpoint.name}
					<span className="text-muted-foreground/50"> · v{endpoint.bt_version}</span>
				</span>
				<span className="w-9 text-center">—</span>
				<span
					className={`w-24 text-center truncate ${getTrackerStatusColor(endpoint.status)}`}
				>
					{getTrackerStatusLabel(endpoint.status)}
				</span>
				<span className="w-10 text-center">
					{endpoint.num_seeds >= 0 ? endpoint.num_seeds : "—"}
				</span>
				<span className="w-10 text-center">
					{endpoint.num_peers >= 0 ? endpoint.num_peers : "—"}
				</span>
				<span className="w-10 text-center">
					{endpoint.num_leeches >= 0 ? endpoint.num_leeches : "—"}
				</span>
				<span className="w-14 text-right">
					{endpoint.num_downloaded >= 0 ? endpoint.num_downloaded : "—"}
				</span>
				<span className="w-16 text-right">{nextLabel}</span>
			</div>
			{/* Mobile card */}
			<div className="flex sm:hidden flex-col gap-0.5 py-1">
				<span className="truncate">
					{endpoint.name}
					<span className="text-muted-foreground/50"> · v{endpoint.bt_version}</span>
				</span>
				<TrackerStatBadges
					status={endpoint.status}
					seeds={endpoint.num_seeds}
					peers={endpoint.num_peers}
					leech={endpoint.num_leeches}
					down={endpoint.num_downloaded}
					next={nextLabel}
				/>
			</div>
		</div>
	);
}

function TrackerRow({ tracker }: { tracker: TorrentTracker }) {
	const [expanded, setExpanded] = useState(false);
	const hasEndpoints = tracker.endpoints && tracker.endpoints.length > 0;
	const nextLabel = formatNextAnnounce(tracker.next_announce);

	return (
		<div>
			<div
				className={hasEndpoints ? "cursor-pointer" : ""}
				title={tracker.msg || tracker.url}
				onClick={hasEndpoints ? () => setExpanded((v) => !v) : undefined}
			>
				{/* Desktop row */}
				<div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
					<span className="w-3 flex-shrink-0 flex items-center justify-center">
						{hasEndpoints ? (
							expanded ? (
								<ChevronUp className="h-2.5 w-2.5" />
							) : (
								<ChevronDown className="h-2.5 w-2.5" />
							)
						) : null}
					</span>
					<span className="flex-1 truncate">{tracker.url}</span>
					<span className="w-9 text-center">
						{tracker.tier >= 0 ? tracker.tier : "—"}
					</span>
					<span
						className={`w-24 text-center truncate ${getTrackerStatusColor(tracker.status)}`}
					>
						{getTrackerStatusLabel(tracker.status)}
					</span>
					<span className="w-10 text-center">
						{tracker.num_seeds >= 0 ? tracker.num_seeds : "—"}
					</span>
					<span className="w-10 text-center">
						{tracker.num_peers >= 0 ? tracker.num_peers : "—"}
					</span>
					<span className="w-10 text-center">
						{tracker.num_leeches >= 0 ? tracker.num_leeches : "—"}
					</span>
					<span className="w-14 text-right">
						{tracker.num_downloaded >= 0 ? tracker.num_downloaded : "—"}
					</span>
					<span className="w-16 text-right">{nextLabel}</span>
				</div>
				{/* Mobile card */}
				<div className="flex sm:hidden flex-col gap-0.5 py-1.5 border-b border-border/30 last:border-0 text-muted-foreground hover:text-foreground transition-colors">
					<div className="flex items-center gap-1.5">
						<span className="w-3 flex-shrink-0 flex items-center justify-center">
							{hasEndpoints ? (
								expanded ? (
									<ChevronUp className="h-2.5 w-2.5" />
								) : (
									<ChevronDown className="h-2.5 w-2.5" />
								)
							) : null}
						</span>
						<span className="flex-1 truncate text-[10px]">{tracker.url}</span>
					</div>
					<TrackerStatBadges
						tier={tracker.tier >= 0 ? tracker.tier : undefined}
						status={tracker.status}
						seeds={tracker.num_seeds}
						peers={tracker.num_peers}
						leech={tracker.num_leeches}
						down={tracker.num_downloaded}
						next={nextLabel}
					/>
				</div>
			</div>
			{expanded && hasEndpoints && (
				<div className="ml-5 mt-1 mb-1.5 space-y-1.5 sm:space-y-1 border-l border-border/40 pl-2">
					{tracker.endpoints.map((endpoint, idx) => (
						<EndpointRow key={`${endpoint.name}-${idx}`} endpoint={endpoint} />
					))}
				</div>
			)}
		</div>
	);
}

export function TorrentDetailDialog({
	torrent,
	open,
	onOpenChange,
	onPause,
	onResume,
	onForceStartChange,
	onDelete,
	onOpenFiles,
}: TorrentDetailDialogProps) {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<null | boolean>(
		null,
	);
	const [showMagnet, setShowMagnet] = useState(false);
	const [showPeers, setShowPeers] = useState(false);
	const [showTrackers, setShowTrackers] = useState(false);
	const { sizeUnit } = useStoragePreferences();

	const { data: peersInfo, isLoading: peersLoading } = useTorrentPeers(
		torrent?.hash || "",
		showPeers,
	);
	const { data: trackersInfo, isLoading: trackersLoading } =
		useTorrentTrackers(torrent?.hash || "", showTrackers);

	if (!open || !torrent) return null;

	const isActive = !isStoppedState(torrent.state);
	const progressPct = Math.round(torrent.progress * 100);
	const stateColor = getStateColor(torrent.state, torrent.completion_on);
	const stateLabel = getStateLabel(torrent.state, torrent.completion_on);

	let trackerHost = "";
	try {
		trackerHost = new URL(torrent.tracker).hostname;
	} catch (_) {
		/* ignore */
	}

	const tags = torrent.tags
		? torrent.tags
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean)
		: [];

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-background/80 backdrop-blur-sm"
				onClick={() => onOpenChange(false)}
			/>

			{/* Panel */}
			<div className="relative w-full sm:max-w-2xl lg:max-w-3xl max-h-[92dvh] sm:max-h-[85dvh] flex flex-col bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
				{/* Header */}
				<div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-border/60">
					<div className="flex items-start gap-3">
						{/* Progress ring / icon */}
						<div className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14">
							<svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
								<circle
									cx="24"
									cy="24"
									r="20"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
									className="text-muted/30"
								/>
								<circle
									cx="24"
									cy="24"
									r="20"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
									strokeDasharray={`${2 * Math.PI * 20}`}
									strokeDashoffset={`${2 * Math.PI * 20 * (1 - torrent.progress)}`}
									strokeLinecap="round"
									className={
										progressPct === 100 ? "text-green-500" : "text-primary"
									}
								/>
							</svg>
							<span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
								{progressPct}%
							</span>
						</div>

						<div className="flex-1 min-w-0">
							<h2
								className="text-sm font-semibold leading-tight line-clamp-2 sm:line-clamp-1"
								title={torrent.name}
							>
								{torrent.name}
							</h2>
							<div className="flex flex-wrap items-center gap-2 mt-1">
								<span className={`text-xs font-medium ${stateColor}`}>
									{stateLabel}
								</span>
								{torrent.category && (
									<span
										className="text-[10px] rounded-full px-2 py-0.5 font-medium"
										style={{
											backgroundColor: generateTagColor(torrent.category),
											color: "white",
										}}
									>
										{torrent.category}
									</span>
								)}
								{tags.map((tag) => (
									<span
										key={tag}
										className="text-[10px] rounded-full px-2 py-0.5 bg-muted text-muted-foreground"
									>
										{tag}
									</span>
								))}
							</div>
						</div>

						<Button
							variant="ghost"
							size="icon"
							className="flex-shrink-0 h-8 w-8"
							onClick={() => onOpenChange(false)}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					{/* Progress bar */}
					<div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
						<div
							className={`h-full rounded-full transition-all ${progressPct === 100 ? "bg-green-500" : "bg-primary"}`}
							style={{ width: `${progressPct}%` }}
						/>
					</div>
				</div>

				{/* Scrollable content */}
				<div className="flex-1 overflow-y-auto overscroll-contain">
					<div className="p-4 space-y-4">
						{/* Speed / Live stats grid */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
							<StatCard
								icon={<Download className="h-3 w-3" />}
								label="Download"
								value={
									<span className="text-blue-500">
										{formatSize(torrent.dlspeed, sizeUnit)}/s
									</span>
								}
							/>
							<StatCard
								icon={<Upload className="h-3 w-3" />}
								label="Upload"
								value={
									<span className="text-green-500">
										{formatSize(torrent.upspeed, sizeUnit)}/s
									</span>
								}
							/>
							<StatCard
								icon={<Users className="h-3 w-3" />}
								label="Seeds"
								value={`${torrent.num_seeds} (${torrent.num_complete})`}
							/>
							<StatCard
								icon={<Users className="h-3 w-3" />}
								label="Peers"
								value={`${torrent.num_leechs} (${torrent.num_incomplete})`}
							/>
						</div>

						{/* Transfer stats */}
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
							<StatCard
								icon={<HardDrive className="h-3 w-3" />}
								label="Size"
								value={formatSize(torrent.size, sizeUnit)}
							/>
							<StatCard
								icon={<Download className="h-3 w-3" />}
								label="Downloaded"
								value={formatSize(torrent.downloaded, sizeUnit)}
							/>
							<StatCard
								icon={<Upload className="h-3 w-3" />}
								label="Uploaded"
								value={formatSize(torrent.uploaded, sizeUnit)}
							/>
							<StatCard
								icon={<TrendingUp className="h-3 w-3" />}
								label="Ratio"
								value={torrent.ratio.toFixed(3)}
							/>
							<StatCard
								icon={<Clock className="h-3 w-3" />}
								label="ETA"
								value={formatTime(torrent.eta)}
							/>
							<StatCard
								icon={<Zap className="h-3 w-3" />}
								label="Active time"
								value={formatTime(torrent.time_active)}
							/>
						</div>

						{/* Details */}
						<div className="rounded-lg border border-border/60 overflow-hidden">
							<div className="px-3 py-2 bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
								Details
							</div>
							<div className="px-3">
								<InfoRow label="Hash" value={torrent.hash} mono />
								<InfoRow label="Category" value={torrent.category || "—"} />
								{tags.length > 0 && (
									<InfoRow label="Tags" value={tags.join(", ")} />
								)}
								<InfoRow label="Save path" value={torrent.save_path} />
								<InfoRow
									label="Tracker"
									value={trackerHost || torrent.tracker}
								/>
								<InfoRow
									label="Added on"
									value={formatDate(torrent.added_on)}
								/>
								{torrent.completion_on > 0 && (
									<InfoRow
										label="Completed on"
										value={formatDate(torrent.completion_on)}
									/>
								)}
								<InfoRow
									label="Priority"
									value={
										torrent.priority > 0 ? String(torrent.priority) : "N/A"
									}
								/>
								<InfoRow
									label="Seeds (total)"
									value={`${torrent.num_seeds} connected / ${torrent.num_complete} in swarm`}
								/>
								<InfoRow
									label="Peers (total)"
									value={`${torrent.num_leechs} connected / ${torrent.num_incomplete} in swarm`}
								/>
								<InfoRow
									label="Avg DL speed"
									value={`${formatSize(torrent.dl_speed_avg, sizeUnit)}/s`}
								/>
								<InfoRow
									label="Avg UP speed"
									value={`${formatSize(torrent.up_speed_avg, sizeUnit)}/s`}
								/>
								<InfoRow
									label="Downloaded"
									value={formatSize(torrent.downloaded, sizeUnit)}
								/>
								<InfoRow
									label="Uploaded"
									value={`${formatSize(torrent.uploaded, sizeUnit)} / session ${formatSize(torrent.uploaded_session, sizeUnit)}`}
								/>
							</div>
						</div>

						<div className="rounded-lg border border-border/60 overflow-hidden">
							<button
								className="w-full px-3 py-2 bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between hover:bg-muted/60 transition-colors"
								onClick={() => setShowTrackers((v) => !v)}
							>
								<span className="flex items-center gap-1.5">
									<Server className="h-3 w-3" />
									Trackers
								</span>
								{showTrackers ? (
									<ChevronUp className="h-3 w-3" />
								) : (
									<ChevronDown className="h-3 w-3" />
								)}
							</button>
							{showTrackers && (
								<div className="overflow-x-auto">
									<div className="px-3 py-2 border-b border-b-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
										<span className="sm:hidden">
											Trackers
											{trackersInfo && trackersInfo.length > 0
												? ` (${trackersInfo.length})`
												: ""}
										</span>
										{trackersInfo && trackersInfo.length > 0 && (
											<div className="hidden sm:flex items-center gap-2 min-w-[500px]">
												<span className="w-3 flex-shrink-0" />
												<span className="flex-1">URL</span>
												<span className="w-9 text-center">Tier</span>
												<span className="w-24 text-center">Status</span>
												<span className="w-10 text-center">Seeds</span>
												<span className="w-10 text-center">Peers</span>
												<span className="w-10 text-center">Leech</span>
												<span className="w-14 text-right">Down</span>
												<span className="w-16 text-right">Next</span>
											</div>
										)}
									</div>
									<div className="px-3 py-2">
										{trackersLoading ? (
											<p className="text-[10px] text-muted-foreground">
												Loading trackers...
											</p>
										) : trackersInfo && trackersInfo.length > 0 ? (
											<div className="space-y-1 sm:min-w-[500px]">
												{trackersInfo.map((tracker, idx) => (
													<TrackerRow
														key={`${tracker.url}-${idx}`}
														tracker={tracker}
													/>
												))}
											</div>
										) : (
											<p className="text-[10px] text-muted-foreground">
												No trackers found.
											</p>
										)}
									</div>
								</div>
							)}
						</div>

						<div className="rounded-lg border border-border/60 overflow-hidden">
							<button
								className="w-full px-3 py-2 bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between hover:bg-muted/60 transition-colors"
								onClick={() => setShowPeers((v) => !v)}
							>
								<span className="flex items-center gap-1.5">
									<UserRound className="h-3 w-3" />
									Peers
								</span>
								{showPeers ? (
									<ChevronUp className="h-3 w-3" />
								) : (
									<ChevronDown className="h-3 w-3" />
								)}
							</button>
							{showPeers && (
								<>
									<div className="px-3 py-2 border-b border-b-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
										{peersInfo?.peers ? (
											<div className="flex items-center justify-between">
												<span className="w-1/3">IP</span>
												<span className="w-1/3">Port</span>
												<span className="w-1/3">DL Speed</span>
											</div>
										) : (
											<span>Peers</span>
										)}
									</div>
									<div className="px-3 py-2">
										{peersLoading ? (
											<p className="text-[10px] text-muted-foreground">
												Loading peers...
											</p>
										) : peersInfo?.peers ? (
											<div className="space-y-1">
												{Object.entries(peersInfo.peers).map(
													([index, peer]) => (
														<div
															key={index}
															className="flex items-center justify-between text-[10px] text-muted-foreground"
														>
															<span className="truncate w-1/3">
																<span
																	className={`fi fi-${peer.country_code?.toLowerCase()} mr-1`}
																></span>
																{peer.ip}
															</span>
															<span className="w-1/3">{peer.port}</span>
															<span className="w-1/3">
																{formatSize(peer.dl_speed, sizeUnit)}/s
															</span>
														</div>
													),
												)}
											</div>
										) : (
											<p className="text-[10px] text-muted-foreground">
												No peers found.
											</p>
										)}
									</div>
								</>
							)}
						</div>

						{/* Magnet link (collapsible) */}
						{torrent.magnet_uri && (
							<div className="rounded-lg border border-border/60 overflow-hidden">
								<button
									className="w-full px-3 py-2 bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between hover:bg-muted/60 transition-colors"
									onClick={() => setShowMagnet((v) => !v)}
								>
									<span className="flex items-center gap-1.5">
										<Magnet className="h-3 w-3" />
										Magnet link
									</span>
									{showMagnet ? (
										<ChevronUp className="h-3 w-3" />
									) : (
										<ChevronDown className="h-3 w-3" />
									)}
								</button>
								{showMagnet && (
									<div className="px-3 py-2">
										<p className="text-[10px] font-mono break-all text-muted-foreground select-all">
											{torrent.magnet_uri}
										</p>
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Footer actions */}
				<div className="flex-shrink-0 px-4 py-3 border-t border-border/60 bg-muted/20">
					{showDeleteConfirm !== null ? (
						<div className="flex items-center gap-2 flex-wrap">
							<span className="text-sm text-muted-foreground flex-1">
								{showDeleteConfirm
									? "Delete torrent and files?"
									: "Delete torrent?"}
							</span>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => {
									onDelete(torrent.hash, showDeleteConfirm);
									setShowDeleteConfirm(null);
									onOpenChange(false);
								}}
							>
								Confirm
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowDeleteConfirm(null)}
							>
								Cancel
							</Button>
						</div>
					) : (
						<div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-4">
							<div className="flex items-center gap-2 flex-1">
								<Button
									size="sm"
									variant={isActive ? "outline" : "default"}
									onClick={() => {
										if (isActive) {
											onPause(torrent.hash);
										} else {
											onResume(torrent.hash);
										}
									}}
									className="gap-1.5"
								>
									{isActive ? (
										<>
											<Pause className="h-3.5 w-3.5" />
											Pause
										</>
									) : (
										<>
											<Play className="h-3.5 w-3.5" />
											Resume
										</>
									)}
								</Button>
								<Button
									size="sm"
									variant={torrent.force_start ? "default" : "outline"}
									onClick={() => {
										onForceStartChange(torrent.hash, !torrent.force_start);
									}}
									className="gap-1.5"
								>
									{!torrent.force_start ? (
										<>
											<FastForward className="h-3.5 w-3.5" />
											Force Start
										</>
									) : (
										<>
											<Rewind className="h-3.5 w-3.5" />
											Disable Force Start
										</>
									)}
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => onOpenFiles(torrent)}
									className="gap-1.5"
								>
									<Files className="h-3.5 w-3.5" />
									Files
								</Button>
							</div>
							<div className="flex items-center gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => setShowDeleteConfirm(false)}
									className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
								>
									<Trash2 className="h-3.5 w-3.5" />
									Delete
								</Button>
								<Button
									size="sm"
									variant="destructive"
									onClick={() => setShowDeleteConfirm(true)}
									className="gap-1.5"
								>
									<Trash2 className="h-3.5 w-3.5" />+ Files
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
