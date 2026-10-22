import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTorrents } from "@/hooks/useApi";
import { useStoragePreferences } from "@/hooks/useStoragePreferences";
import {
	STATE_FILTERS,
	getStateFilterLabel,
	getTrackerHost,
} from "@/hooks/useTorrentListState";
import { columnsDictionary, defaultTorrentListDefaults } from "@/constants";
import type {
	Columns,
	SortDirection,
	TorrentListDefaults,
} from "@/types";

function toggleItem<T>(list: T[], value: T): T[] {
	return list.includes(value)
		? list.filter((v) => v !== value)
		: [...list, value];
}

function CheckboxList<T extends string>({
	idPrefix,
	items,
	checked,
	getLabel,
	onToggle,
}: {
	idPrefix: string;
	items: T[];
	checked: T[];
	getLabel: (item: T) => string;
	onToggle: (item: T) => void;
}) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-lg p-3 bg-muted/30 max-h-48 overflow-y-auto">
			{items.map((item) => (
				<div key={item} className="flex items-center space-x-2">
					<Checkbox
						id={`${idPrefix}-${item}`}
						checked={checked.includes(item)}
						onCheckedChange={() => onToggle(item)}
					/>
					<Label
						htmlFor={`${idPrefix}-${item}`}
						className="truncate cursor-pointer font-normal"
					>
						{getLabel(item)}
					</Label>
				</div>
			))}
		</div>
	);
}

export function TorrentListDefaultsCard() {
	const { torrentListDefaults, setTorrentListDefaults } =
		useStoragePreferences();
	const { data: torrents } = useTorrents();
	const [draft, setDraft] = useState<TorrentListDefaults>(torrentListDefaults);

	const update = <K extends keyof TorrentListDefaults>(
		key: K,
		value: TorrentListDefaults[K],
	) => setDraft((prev) => ({ ...prev, [key]: value }));

	// Saved values stay listed even if no current torrent uses them.
	const categories = useMemo(() => {
		const cats = new Set<string>(draft.categories);
		torrents?.forEach((t) => cats.add(t.category));
		return Array.from(cats).sort();
	}, [torrents, draft.categories]);

	const trackers = useMemo(() => {
		const hosts = new Set<string>(draft.trackers);
		torrents?.forEach((t) => {
			const host = getTrackerHost(t.tracker);
			if (host) hosts.add(host);
		});
		return Array.from(hosts).sort();
	}, [torrents, draft.trackers]);

	const handleSave = () => {
		setTorrentListDefaults(draft);
		toast.success("Default sort & filters saved");
	};

	const handleReset = () => {
		setDraft(defaultTorrentListDefaults);
		setTorrentListDefaults(defaultTorrentListDefaults);
		toast.success("Default sort & filters reset");
	};

	return (
		<Card className="mt-3">
			<CardHeader>
				<CardTitle>Default Sort & Filters</CardTitle>
				<CardDescription>
					Sort and filters applied to the torrent list when it opens. You can
					also save the current ones from the Filters menu of the torrent
					list.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap gap-4">
					<div className="space-y-2 flex-1 min-w-48">
						<Label>Sort by</Label>
						<Select
							value={draft.sortField}
							onValueChange={(value) => update("sortField", value as Columns)}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{(Object.keys(columnsDictionary) as Columns[]).map((field) => (
									<SelectItem key={field} value={field}>
										{columnsDictionary[field]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2 w-40">
						<Label>Direction</Label>
						<Select
							value={draft.sortDirection}
							onValueChange={(value) =>
								update("sortDirection", value as SortDirection)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="asc">Ascending ↑</SelectItem>
								<SelectItem value="desc">Descending ↓</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="space-y-2">
					<Label>State</Label>
					<CheckboxList
						idPrefix="default-state"
						items={STATE_FILTERS}
						checked={draft.states}
						getLabel={getStateFilterLabel}
						onToggle={(state) =>
							update("states", toggleItem(draft.states, state))
						}
					/>
				</div>

				{categories.length > 0 && (
					<div className="space-y-2">
						<Label>Categories</Label>
						<CheckboxList
							idPrefix="default-category"
							items={categories}
							checked={draft.categories}
							getLabel={(category) => category || "No category"}
							onToggle={(category) =>
								update("categories", toggleItem(draft.categories, category))
							}
						/>
					</div>
				)}

				{trackers.length > 0 && (
					<div className="space-y-2">
						<Label>Trackers</Label>
						<CheckboxList
							idPrefix="default-tracker"
							items={trackers}
							checked={draft.trackers}
							getLabel={(tracker) => tracker}
							onToggle={(tracker) =>
								update("trackers", toggleItem(draft.trackers, tracker))
							}
						/>
					</div>
				)}

				<p className="text-xs text-muted-foreground">
					Filters of different kinds are combined (state AND category AND
					tracker); within a kind, any checked value matches.
				</p>

				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={handleReset}>
						Reset to default
					</Button>
					<Button onClick={handleSave}>Save</Button>
				</div>
			</CardContent>
		</Card>
	);
}
