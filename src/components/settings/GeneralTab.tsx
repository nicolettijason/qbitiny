import { Preferences } from "@/types";
import { GeneralSettingsTab } from "./GeneralSettingsTab";
import { TableViewSettingsCard } from "./TableViewSettingsCard";
import { AppearanceSettingsCard } from "./AppearanceSettingsCard";
import { DefaultWebUICard } from "./DefaultWebUICard";

interface GeneralTabProps {
	preferences: Preferences;
	saving: boolean;
	onUpdatePreference: <K extends keyof Preferences>(
		key: K,
		value: Preferences[K],
	) => void;
	onSave: (section: string) => void;
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
			<AppearanceSettingsCard />
			<DefaultWebUICard />
		</div>
	);
}
