import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { GeneralTab } from "./GeneralTab";
import { QueueingSettingsTab } from "./QueueingSettingsTab";
import { SpeedSettingsTab } from "./SpeedSettingsTab";
import { ConnectionSettingsTab } from "./ConnectionSettingsTab";
import { AboutSettingsTab } from "./AboutSettingsTab";
import { useTranslation } from "@/i18n";

export function SettingsView() {
	const { t } = useTranslation();
	const {
		preferences,
		loading,
		saving,
		handleSave,
		updatePreference,
	} = useSettingsPreferences();

	if (loading) {
		return <div className="p-4">{t("settings.loading")}</div>;
	}

	return (
		<div className="max-w-4xl mx-auto space-y-4">
			<Tabs defaultValue="general" className="w-full">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="general">{t("settings.tabs.general")}</TabsTrigger>
					<TabsTrigger value="queueing">{t("settings.tabs.queueing")}</TabsTrigger>
					<TabsTrigger value="speed">{t("settings.tabs.speed")}</TabsTrigger>
					<TabsTrigger value="connection">{t("settings.tabs.connection")}</TabsTrigger>
					<TabsTrigger value="about">{t("settings.tabs.about")}</TabsTrigger>
				</TabsList>

				<TabsContent value="general">
					<GeneralTab
						preferences={preferences}
						saving={saving}
						onUpdatePreference={updatePreference}
						onSave={handleSave}
					/>
				</TabsContent>

				<TabsContent value="queueing">
					<QueueingSettingsTab
						preferences={preferences}
						saving={saving}
						onUpdatePreference={updatePreference}
						onSave={() => handleSave("queueing")}
					/>
				</TabsContent>

				<TabsContent value="speed">
					<SpeedSettingsTab
						preferences={preferences}
						saving={saving}
						onUpdatePreference={updatePreference}
						onSave={() => handleSave("speed")}
					/>
				</TabsContent>

				<TabsContent value="connection">
					<ConnectionSettingsTab
						preferences={preferences}
						saving={saving}
						onUpdatePreference={updatePreference}
						onSave={() => handleSave("connection")}
					/>
				</TabsContent>

				<TabsContent value="about">
					<AboutSettingsTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
