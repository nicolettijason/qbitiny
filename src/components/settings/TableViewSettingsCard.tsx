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
import { defaultPreferences } from "@/constants";
import { toast } from "sonner";
import { useStoragePreferences } from "@/hooks/useStoragePreferences";
import { useTranslation } from "@/i18n";

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
	const { t } = useTranslation();
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
			toast.success(t("tableView.saved"));
		} catch (error) {
			console.error("Failed to save table view settings:", error);
			toast.error(t("tableView.saveFailed"));
		}
	};

	const resetTableSettings = () => {
		const defaultColumns = defaultPreferences.columns;
		onUpdatePreference("columns", defaultColumns);
		setTableViewSettings(defaultColumns);
		toast.success(t("tableView.resetDone"));
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
				<CardTitle>{t("tableView.title")}</CardTitle>
				<CardDescription>
					{t("tableView.description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label>{t("tableView.columns")}</Label>
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
									{t(`columns.${column as Columns}`)}
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
							<Button variant="destructive">{t("common.resetToDefault")}</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{t("tableView.resetTitle")}</DialogTitle>
								<DialogDescription>
									{t("tableView.resetDescription")}
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setResetColumnsDialogOpen(false)}
								>
									{t("common.cancel")}
								</Button>
								<Button
									variant="destructive"
									onClick={() => {
										resetTableSettings();
										setResetColumnsDialogOpen(false);
									}}
								>
									{t("common.reset")}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
					<Button onClick={() => handleSaveTableSettings()}>{t("common.save")}</Button>
				</div>
			</CardContent>
		</Card>
	);
}
