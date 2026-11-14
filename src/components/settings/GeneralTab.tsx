import { Preferences } from "@/types";
import { GeneralSettingsTab } from "./GeneralSettingsTab";
import { TableViewSettingsCard } from "./TableViewSettingsCard";
import { TorrentListDefaultsCard } from "./TorrentListDefaultsCard";
import { AppearanceSettingsCard } from "./AppearanceSettingsCard";
import { AuthenticationSettingsCard } from "./AuthenticationSettingsCard";
import { DefaultWebUICard } from "./DefaultWebUICard";

interface GeneralTabProps {
	preferences: Preferences;
	saving: boolean;
	onUpdatePreference: <K extends keyof Preferences>(
		key: K,
		value: Preferences[K],
	) => void;
	onSave: (
		section: string,
		extra?: Record<string, unknown>,
	) => Promise<boolean>;
}

export function GeneralTab({
	preferences,
	saving,
	onUpdatePreference,
	onSave,
}: GeneralTabProps) {
	return (
		<div className="space-y-4">
			<GeneralSettingsTab
				preferences={preferences}
				saving={saving}
				onUpdatePreference={onUpdatePreference}
				onSave={() => onSave("general")}
			/>
			<TableViewSettingsCard
				preferences={preferences}
				onUpdatePreference={onUpdatePreference}
			/>
			<TorrentListDefaultsCard />
			<AppearanceSettingsCard />
			<AuthenticationSettingsCard
				preferences={preferences}
				saving={saving}
				onUpdatePreference={onUpdatePreference}
				onSave={(extra) => onSave("authentication", extra)}
			/>
			<DefaultWebUICard />
		</div>
	);
}
