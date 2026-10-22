import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tooltip } from "radix-ui";
import { Preferences } from "@/types";
import { qbittorrentLocales } from "@/constants";
import { useTranslation } from "@/i18n";

interface GeneralSettingsTabProps {
	preferences: Preferences;
	saving: boolean;
	onUpdatePreference: <K extends keyof Preferences>(
		key: K,
		value: Preferences[K],
	) => void;
	onSave: () => void;
}

export function GeneralSettingsTab({
	preferences,
	saving,
	onUpdatePreference,
	onSave,
}: GeneralSettingsTabProps) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("settings.general.title")}</CardTitle>
				<CardDescription>
					{t("settings.general.description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-end flex-wrap min-w-48 gap-4">
					<div className="space-y-2 flex-1">
						<Label htmlFor="locale">
							{t("settings.general.qbtLanguage")}{" "}
							<Tooltip.Provider>
								<Tooltip.Root>
									<Tooltip.Trigger asChild>
										<button className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
											<Info className="h-4 w-4" />
										</button>
									</Tooltip.Trigger>
									<Tooltip.Portal>
										<Tooltip.Content
											className="flex max-w-xs rounded-md bg-background/95 p-2 text-sm text-white shadow-lg"
											sideOffset={5}
										>
											{t("settings.general.qbtLanguageHint")}
											<Tooltip.Arrow className="fill-background/95" />
										</Tooltip.Content>
									</Tooltip.Portal>
								</Tooltip.Root>
							</Tooltip.Provider>
						</Label>
						<Input
							id="locale"
							disabled
							value={
								qbittorrentLocales[preferences.locale] ||
								preferences.locale
							}
							onChange={(e) => onUpdatePreference("locale", e.target.value)}
							placeholder="en"
						/>
					</div>
					<div className="space-y-2 w-36">
						<Label htmlFor="sizeUnit">{t("settings.general.sizeUnit")}</Label>
						<Select
							value={preferences.sizeUnit}
							onValueChange={(value) =>
								onUpdatePreference(
									"sizeUnit",
									value as Preferences["sizeUnit"],
								)
							}
						>
							<SelectTrigger className="w-full max-w-48">
								<SelectValue placeholder={t("settings.general.selectSizeUnit")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="B">Bytes (B)</SelectItem>
								<SelectItem value="o">Octets (o)</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="space-y-2">
					<Label htmlFor="save_path">{t("settings.general.savePath")}</Label>
					<Input
						id="save_path"
						value={preferences.save_path}
						onChange={(e) =>
							onUpdatePreference("save_path", e.target.value)
						}
						placeholder="/downloads"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="temp_path">{t("settings.general.tempFolder")}</Label>
					<Input
						id="temp_path"
						value={preferences.temp_path}
						onChange={(e) =>
							onUpdatePreference("temp_path", e.target.value)
						}
						placeholder="/downloads/temp"
					/>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="temp_path_enabled"
						checked={preferences.temp_path_enabled}
						onCheckedChange={(checked) =>
							onUpdatePreference("temp_path_enabled", !!checked)
						}
					/>
					<Label htmlFor="temp_path_enabled">{t("settings.general.enableTemp")}</Label>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="create_subfolder_enabled"
						checked={preferences.create_subfolder_enabled}
						onCheckedChange={(checked) =>
							onUpdatePreference("create_subfolder_enabled", !!checked)
						}
					/>
					<Label htmlFor="create_subfolder_enabled">
						{t("settings.general.createSubfolder")}
					</Label>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="start_paused_enabled"
						checked={preferences.start_paused_enabled}
						onCheckedChange={(checked) =>
							onUpdatePreference("start_paused_enabled", !!checked)
						}
					/>
					<Label htmlFor="start_paused_enabled">{t("settings.general.startPaused")}</Label>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="auto_tmm_enabled"
						checked={preferences.auto_tmm_enabled}
						onCheckedChange={(checked) =>
							onUpdatePreference("auto_tmm_enabled", !!checked)
						}
					/>
					<Label htmlFor="auto_tmm_enabled">
						{t("settings.general.autoTmm")}
					</Label>
				</div>
				<Button onClick={onSave} disabled={saving}>
					{t("settings.general.save")}
				</Button>
			</CardContent>
		</Card>
	);
}
