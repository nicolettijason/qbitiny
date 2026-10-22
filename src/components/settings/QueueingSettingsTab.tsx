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
import { Preferences } from "@/types";
import { useTranslation } from "@/i18n";

interface QueueingSettingsTabProps {
	preferences: Preferences;
	saving: boolean;
	onUpdatePreference: <K extends keyof Preferences>(
		key: K,
		value: Preferences[K],
	) => void;
	onSave: () => void;
}

export function QueueingSettingsTab({
	preferences,
	saving,
	onUpdatePreference,
	onSave,
}: QueueingSettingsTabProps) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("settings.queueing.title")}</CardTitle>
				<CardDescription>{t("settings.queueing.description")}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center space-x-2">
					<Checkbox
						id="queueing_enabled"
						checked={preferences.queueing_enabled}
						onCheckedChange={(checked) =>
							onUpdatePreference("queueing_enabled", !!checked)
						}
					/>
					<Label htmlFor="queueing_enabled">{t("settings.queueing.enable")}</Label>
				</div>
				<div className="space-y-2">
					<Label htmlFor="max_active_downloads">
						{t("settings.queueing.maxDownloads")}
					</Label>
					<Input
						id="max_active_downloads"
						type="number"
						value={preferences.max_active_downloads}
						onChange={(e) =>
							onUpdatePreference(
								"max_active_downloads",
								parseInt(e.target.value) || 0,
							)
						}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="max_active_torrents">{t("settings.queueing.maxTorrents")}</Label>
					<Input
						id="max_active_torrents"
						type="number"
						value={preferences.max_active_torrents}
						onChange={(e) =>
							onUpdatePreference(
								"max_active_torrents",
								parseInt(e.target.value) || 0,
							)
						}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="max_active_uploads">{t("settings.queueing.maxUploads")}</Label>
					<Input
						id="max_active_uploads"
						type="number"
						value={preferences.max_active_uploads}
						onChange={(e) =>
							onUpdatePreference(
								"max_active_uploads",
								parseInt(e.target.value) || 0,
							)
						}
					/>
				</div>
				<Button onClick={onSave} disabled={saving}>
					{t("settings.queueing.save")}
				</Button>
			</CardContent>
		</Card>
	);
}
