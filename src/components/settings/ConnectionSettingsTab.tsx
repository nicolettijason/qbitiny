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

interface ConnectionSettingsTabProps {
	preferences: Preferences;
	saving: boolean;
	onUpdatePreference: <K extends keyof Preferences>(
		key: K,
		value: Preferences[K],
	) => void;
	onSave: () => void;
}

export function ConnectionSettingsTab({
	preferences,
	saving,
	onUpdatePreference,
	onSave,
}: ConnectionSettingsTabProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Connection Settings</CardTitle>
				<CardDescription>
					Configure ports and network options
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="listen_port">Listen Port</Label>
					<Input
						id="listen_port"
						type="number"
						value={preferences.listen_port}
						onChange={(e) =>
							onUpdatePreference(
								"listen_port",
								parseInt(e.target.value) || 6881,
							)
						}
					/>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="upnp"
						checked={preferences.upnp}
						onCheckedChange={(checked) =>
							onUpdatePreference("upnp", !!checked)
						}
					/>
					<Label htmlFor="upnp">UPnP / NAT-PMP</Label>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="random_port"
						checked={preferences.random_port}
						onCheckedChange={(checked) =>
							onUpdatePreference("random_port", !!checked)
						}
					/>
					<Label htmlFor="random_port">Random Port</Label>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="dht"
						checked={preferences.dht}
						onCheckedChange={(checked) =>
							onUpdatePreference("dht", !!checked)
						}
					/>
					<Label htmlFor="dht">DHT</Label>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="pex"
						checked={preferences.pex}
						onCheckedChange={(checked) =>
							onUpdatePreference("pex", !!checked)
						}
					/>
					<Label htmlFor="pex">PeX</Label>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="lsd"
						checked={preferences.lsd}
						onCheckedChange={(checked) =>
							onUpdatePreference("lsd", !!checked)
						}
					/>
					<Label htmlFor="lsd">LSD</Label>
				</div>
				<div className="space-y-2">
					<Label htmlFor="encryption">Encryption</Label>
					<select
						id="encryption"
						className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						value={preferences.encryption}
						onChange={(e) =>
							onUpdatePreference("encryption", parseInt(e.target.value))
						}
					>
						<option value={0}>Prefer encryption</option>
						<option value={1}>Force encryption on</option>
						<option value={2}>Force encryption off</option>
					</select>
				</div>
				<Button
					onClick={onSave}
					disabled={saving}
				>
					Save Connection Settings
				</Button>
			</CardContent>
		</Card>
	);
}
