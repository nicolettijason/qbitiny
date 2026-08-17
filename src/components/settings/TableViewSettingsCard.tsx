import { useState, useMemo, useRef } from "react";
import { GripVertical } from "lucide-react";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Columns, Preferences } from "@/types";
import { columnsDictionary, defaultPreferences } from "@/constants";
import { toast } from "sonner";
import { useStoragePreferences } from "@/hooks/useStoragePreferences";

interface TableViewSettingsCardProps {
	preferences: Preferences;
	onUpdatePreference: <K extends keyof Preferences>(
		key: K,
		value: Preferences[K],
	) => void;
}

export function TableViewSettingsCard({
	preferences,
	onUpdatePreference,
}: TableViewSettingsCardProps) {
	const { setTableViewSettings } = useStoragePreferences();
	const [draggedColumn, setDraggedColumn] = useState<
		keyof typeof defaultPreferences.columns | null
	>(null);
	const dragOverRef = useRef<string | number | null>(null);
	const [resetColumnsDialogOpen, setResetColumnsDialogOpen] = useState(false);

	const handleDragStart = (
		columnId: keyof typeof defaultPreferences.columns,
	) => {
		setDraggedColumn(columnId);
	};

	const handleDragOver = (
		e: React.DragEvent<HTMLDivElement>,
		targetColumn: keyof typeof defaultPreferences.columns,
	) => {
		e.preventDefault();
		if (!draggedColumn || draggedColumn === targetColumn) {
			dragOverRef.current = null;
			return;
		}

		dragOverRef.current = targetColumn as string | number;

		// Swap dynamically during drag
		const draggedOrder =
			preferences.columns[
				draggedColumn as keyof typeof defaultPreferences.columns
			]!.order;
		const targetOrder = preferences.columns[targetColumn]!.order;

		const newColumns = { ...preferences.columns };
		newColumns[draggedColumn] = {
			...newColumns[draggedColumn]!,
			order: targetOrder,
		};
		newColumns[targetColumn] = {
			...newColumns[targetColumn!],
			order: draggedOrder,
		};

		onUpdatePreference("columns", newColumns);
	};

	const handleDragLeave = () => {
		dragOverRef.current = null;
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		dragOverRef.current = null;
		setDraggedColumn(null);
	};

	const handleDragEnd = () => {
		setDraggedColumn(null);
		dragOverRef.current = null;
	};

	const handleSaveTableSettings = () => {
		try {
			setTableViewSettings(preferences.columns);
			toast.success("Table view settings saved");
		} catch (error) {
			console.error("Failed to save table view settings:", error);
			toast.error("Failed to save table view settings");
		}
	};

	const resetTableSettings = () => {
		const defaultColumns = defaultPreferences.columns;
		onUpdatePreference("columns", defaultColumns);
		setTableViewSettings(defaultColumns);
		toast.success("Table view settings reset to default");
	};

	const orderedColumns: typeof preferences.columns = useMemo(
		() =>
			Object.entries(preferences.columns)
				.sort(([, a], [, b]) => a.order - b.order)
				.reduce(
					(acc, [key, value]) => {
						acc[key as keyof typeof preferences.columns] = value;
						return acc;
					},
					{} as typeof preferences.columns,
				),
		[preferences],
	);

	return (
		<Card className="mt-3">
			<CardHeader>
				<CardTitle>Table View Settings</CardTitle>
				<CardDescription>
					Configure which columns are displayed in the torrent list. Drag
					to reorder columns.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label>Columns</Label>
					<div className="flex flex-col space-y-2 border rounded-lg p-4 bg-muted/30">
						{Object.entries(orderedColumns).map(([column, config]) => (
							<div
								key={column}
								draggable
								onDragStart={() =>
									handleDragStart(
										column as keyof typeof defaultPreferences.columns,
									)
								}
								onDragOver={(e) =>
									handleDragOver(
										e,
										column as keyof typeof defaultPreferences.columns,
									)
								}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								onDragEnd={handleDragEnd}
								className={`flex items-center space-x-3 p-3 pl-0 rounded-md transition-all ${
									draggedColumn === column
										? "border border-primary bg-primary/10 opacity-70"
										: "border border-transparent hover:bg-muted/20"
								} cursor-move`}
							>
								<GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
								<Checkbox
									id={column}
									checked={config.active}
									onCheckedChange={(checked) =>
										onUpdatePreference("columns", {
											...preferences.columns,
											[column]: { ...config, active: !!checked },
										})
									}
								/>
								<Label htmlFor={column} className="flex-1 cursor-pointer">
									{columnsDictionary[column as Columns] || column}
								</Label>
							</div>
						))}
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Dialog
						open={resetColumnsDialogOpen}
						onOpenChange={setResetColumnsDialogOpen}
					>
						<DialogTrigger asChild>
							<Button variant="destructive">Reset to default</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Reset column settings?</DialogTitle>
								<DialogDescription>
									This will restore the default columns order and
									visibility. Your current configuration will be lost.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setResetColumnsDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									onClick={() => {
										resetTableSettings();
										setResetColumnsDialogOpen(false);
									}}
								>
									Reset
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
					<Button onClick={() => handleSaveTableSettings()}>Save</Button>
				</div>
			</CardContent>
		</Card>
	);
}
