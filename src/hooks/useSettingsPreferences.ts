import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Preferences } from "@/types";
import { defaultPreferences } from "@/constants";
import { getStoredTableSettings } from "@/helpers";
import { qbitClient } from "@/lib/api";
import { useStoragePreferences } from "./useStoragePreferences";

export function useSettingsPreferences() {
	const { sizeUnit, setSizeUnit, tableViewSettings } = useStoragePreferences();
	const [preferences, setPreferences] = useState<Preferences>(
		defaultPreferences as Preferences,
	);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadPreferences();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const loadPreferences = async () => {
		try {
			const prefs = await qbitClient.getPreferences() as Preferences;
			setPreferences({
				...defaultPreferences,
				...prefs,
				columns: getStoredTableSettings(tableViewSettings),
				sizeUnit: (sizeUnit as Preferences["sizeUnit"]) || "B",
				dl_limit:
					prefs.dl_limit > 0
						? Math.round(prefs.dl_limit / 1024)
						: prefs.dl_limit,
				up_limit:
					prefs.up_limit > 0
						? Math.round(prefs.up_limit / 1024)
						: prefs.up_limit,
				alt_dl_limit:
					prefs.alt_dl_limit > 0
						? Math.round(prefs.alt_dl_limit / 1024)
						: prefs.alt_dl_limit,
				alt_up_limit:
					prefs.alt_up_limit > 0
						? Math.round(prefs.alt_up_limit / 1024)
						: prefs.alt_up_limit,
			} as Preferences);
		} catch (error) {
			console.error("Failed to load preferences:", error);
			toast.error("Failed to load preferences");
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async (section: string) => {
		setSaving(true);
		try {
			const prefsToSave: Record<string, unknown> = {};

			setSizeUnit(preferences.sizeUnit);

			switch (section) {
				case "table_view":
					prefsToSave.columns = preferences.columns;
					break;
				case "general":
					prefsToSave.locale = preferences.locale;
					prefsToSave.save_path = preferences.save_path;
					prefsToSave.temp_path = preferences.temp_path;
					prefsToSave.temp_path_enabled = preferences.temp_path_enabled;
					prefsToSave.create_subfolder_enabled =
						preferences.create_subfolder_enabled;
					prefsToSave.start_paused_enabled = preferences.start_paused_enabled;
					prefsToSave.auto_tmm_enabled = preferences.auto_tmm_enabled;
					break;
				case "queueing":
					prefsToSave.queueing_enabled = preferences.queueing_enabled;
					prefsToSave.max_active_downloads =
						preferences.max_active_downloads;
					prefsToSave.max_active_torrents = preferences.max_active_torrents;
					prefsToSave.max_active_uploads = preferences.max_active_uploads;
					break;
				case "speed":
					prefsToSave.dl_limit =
						preferences.dl_limit > 0
							? preferences.dl_limit * 1024
							: preferences.dl_limit;
					prefsToSave.up_limit =
						preferences.up_limit > 0
							? preferences.up_limit * 1024
							: preferences.up_limit;
					prefsToSave.alt_dl_limit =
						preferences.alt_dl_limit > 0
							? preferences.alt_dl_limit * 1024
							: preferences.alt_dl_limit;
					prefsToSave.alt_up_limit =
						preferences.alt_up_limit > 0
							? preferences.alt_up_limit * 1024
							: preferences.alt_up_limit;
					break;
				case "connection":
					prefsToSave.listen_port = preferences.listen_port;
					prefsToSave.upnp = preferences.upnp;
					prefsToSave.random_port = preferences.random_port;
					prefsToSave.dht = preferences.dht;
					prefsToSave.pex = preferences.pex;
					prefsToSave.lsd = preferences.lsd;
					prefsToSave.encryption = preferences.encryption;
					break;
			}

			await qbitClient.setPreferences(prefsToSave);
			toast.success(
				`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved`,
			);
		} catch (error) {
			console.error("Failed to save preferences:", error);
			toast.error("Failed to save settings");
		} finally {
			setSaving(false);
		}
	};

	const updatePreference = <K extends keyof Preferences>(
		key: K,
		value: Preferences[K],
	) => {
		setPreferences((prev) => ({ ...prev, [key]: value }));
	};

	return {
		preferences,
		setPreferences,
		loading,
		saving,
		handleSave,
		updatePreference,
	};
}
