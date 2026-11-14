import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Preferences } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/i18n";

interface AuthenticationSettingsCardProps {
	preferences: Preferences;
	saving: boolean;
	onUpdatePreference: <K extends keyof Preferences>(
		key: K,
		value: Preferences[K],
	) => void;
	/** `extra` carries the write-only fields (the new password). */
	onSave: (extra?: Record<string, unknown>) => Promise<boolean>;
}

// Same minimum lengths as qBittorrent's own Web UI.
const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 6;

/** Web UI credentials and authentication bypass (localhost / subnets). */
export function AuthenticationSettingsCard({
	preferences,
	saving,
	onUpdatePreference,
	onSave,
}: AuthenticationSettingsCardProps) {
	const { t } = useTranslation();
	const { authBypassed, refreshAuthBypass, updateCredentials } = useAuth();
	// qBittorrent never returns the password: this field only sets a new one.
	const [newPassword, setNewPassword] = useState("");
	const [error, setError] = useState("");
	const [confirmOpen, setConfirmOpen] = useState(false);
	// Bypass options as saved on the server, to detect when one is turned off.
	const [savedBypass, setSavedBypass] = useState(() => ({
		local: preferences.bypass_local_auth,
		subnets: preferences.bypass_auth_subnet_whitelist_enabled,
	}));

	const username = preferences.web_ui_username.trim();

	const save = async () => {
		setConfirmOpen(false);
		const success = await onSave({
			web_ui_username: username,
			...(newPassword ? { web_ui_password: newPassword } : {}),
		});
		if (!success) return;
		updateCredentials(username, newPassword || undefined);
		setNewPassword("");
		setSavedBypass({
			local: preferences.bypass_local_auth,
			subnets: preferences.bypass_auth_subnet_whitelist_enabled,
		});
		await refreshAuthBypass();
	};

	const handleSave = () => {
		if (username.length < MIN_USERNAME_LENGTH) {
			setError(t("settings.auth.usernameTooShort"));
			return;
		}
		if (newPassword && newPassword.length < MIN_PASSWORD_LENGTH) {
			setError(t("settings.auth.passwordTooShort"));
			return;
		}
		setError("");

		// Turning a bypass off while relying on it, without setting a new
		// password: make sure the user knows the current one, or they will be
		// locked out on the next reload.
		const disablesBypass =
			(savedBypass.local && !preferences.bypass_local_auth) ||
			(savedBypass.subnets && !preferences.bypass_auth_subnet_whitelist_enabled);
		if (authBypassed && disablesBypass && !newPassword) {
			setConfirmOpen(true);
			return;
		}
		save();
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("settings.auth.title")}</CardTitle>
				<CardDescription>{t("settings.auth.description")}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{authBypassed && (
					<p className="text-sm text-muted-foreground">
						{t("settings.auth.bypassWarning")}
					</p>
				)}
				<div className="space-y-2">
					<Label htmlFor="web_ui_username">{t("settings.auth.username")}</Label>
					<Input
						id="web_ui_username"
						autoComplete="username"
						value={preferences.web_ui_username}
						onChange={(e) =>
							onUpdatePreference("web_ui_username", e.target.value)
						}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="web_ui_password">
						{t("settings.auth.newPassword")}
					</Label>
					<Input
						id="web_ui_password"
						type="password"
						autoComplete="new-password"
						placeholder={t("settings.auth.newPasswordPlaceholder")}
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
					/>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="bypass_local_auth"
						checked={preferences.bypass_local_auth}
						onCheckedChange={(checked) =>
							onUpdatePreference("bypass_local_auth", !!checked)
						}
					/>
					<Label htmlFor="bypass_local_auth">
						{t("settings.auth.bypassLocal")}
					</Label>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="bypass_auth_subnet_whitelist_enabled"
						checked={preferences.bypass_auth_subnet_whitelist_enabled}
						onCheckedChange={(checked) =>
							onUpdatePreference(
								"bypass_auth_subnet_whitelist_enabled",
								!!checked,
							)
						}
					/>
					<Label htmlFor="bypass_auth_subnet_whitelist_enabled">
						{t("settings.auth.bypassSubnets")}
					</Label>
				</div>
				{preferences.bypass_auth_subnet_whitelist_enabled && (
					<div className="space-y-2">
						<Label htmlFor="bypass_auth_subnet_whitelist">
							{t("settings.auth.subnets")}
						</Label>
						<textarea
							id="bypass_auth_subnet_whitelist"
							rows={3}
							className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
							value={preferences.bypass_auth_subnet_whitelist}
							onChange={(e) =>
								onUpdatePreference(
									"bypass_auth_subnet_whitelist",
									e.target.value,
								)
							}
						/>
					</div>
				)}
				{error && <p className="text-sm text-destructive">{error}</p>}
				<Button onClick={handleSave} disabled={saving}>
					{t("settings.auth.save")}
				</Button>
			</CardContent>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("settings.auth.confirmTitle")}</DialogTitle>
						<DialogDescription>
							{t("settings.auth.confirmDescription", { username })}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex-row justify-end">
						<Button variant="outline" onClick={() => setConfirmOpen(false)}>
							{t("common.cancel")}
						</Button>
						<Button variant="destructive" onClick={save} disabled={saving}>
							{t("settings.auth.confirmSave")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
