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
	return (
		<Card>
			<CardHeader>
				<CardTitle>Speed Settings</CardTitle>
				<CardDescription>
					Configure speed limits (KiB/s, 0 = unlimited)
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="dl_limit">Download Limit</Label>
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
					<Label htmlFor="up_limit">Upload Limit</Label>
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
					<Label htmlFor="alt_dl_limit">Alternative Download Limit</Label>
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
					<Label htmlFor="alt_up_limit">Alternative Upload Limit</Label>
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
					Save Speed Settings
				</Button>
			</CardContent>
		</Card>
	);
}
