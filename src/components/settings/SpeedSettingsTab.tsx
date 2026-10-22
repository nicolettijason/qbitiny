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
import { Preferences } from "@/types";
import { useTranslation } from "@/i18n";

interface SpeedSettingsTabProps {
	preferences: Preferences;
	saving: boolean;
	onUpdatePreference: <K extends keyof Preferences>(
		key: K,
		value: Preferences[K],
	) => void;
	onSave: () => void;
}

export function SpeedSettingsTab({
	preferences,
	saving,
	onUpdatePreference,
	onSave,
}: SpeedSettingsTabProps) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("settings.speed.title")}</CardTitle>
				<CardDescription>
					{t("settings.speed.description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="dl_limit">{t("settings.speed.dlLimit")}</Label>
					<Input
						id="dl_limit"
						type="number"
						value={preferences.dl_limit}
						onChange={(e) =>
							onUpdatePreference("dl_limit", parseInt(e.target.value) || 0)
						}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="up_limit">{t("settings.speed.upLimit")}</Label>
					<Input
						id="up_limit"
						type="number"
						value={preferences.up_limit}
						onChange={(e) =>
							onUpdatePreference("up_limit", parseInt(e.target.value) || 0)
						}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="alt_dl_limit">{t("settings.speed.altDlLimit")}</Label>
					<Input
						id="alt_dl_limit"
						type="number"
						value={preferences.alt_dl_limit}
						onChange={(e) =>
							onUpdatePreference(
								"alt_dl_limit",
								parseInt(e.target.value) || 0,
							)
						}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="alt_up_limit">{t("settings.speed.altUpLimit")}</Label>
					<Input
						id="alt_up_limit"
						type="number"
						value={preferences.alt_up_limit}
						onChange={(e) =>
							onUpdatePreference(
								"alt_up_limit",
								parseInt(e.target.value) || 0,
							)
						}
					/>
				</div>
				<Button onClick={onSave} disabled={saving}>
					{t("settings.speed.save")}
				</Button>
			</CardContent>
		</Card>
	);
}
