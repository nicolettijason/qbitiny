import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useStorage } from "@/contexts/StorageContext";
import { useTranslation } from "@/i18n";

export function LoginForm() {
	const { t } = useTranslation();
	const storage = useStorage();
	const [username, setUsername] = useState(storage.qbitUser);
	const [password, setPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(true);
	const [error, setError] = useState("");
	const { login, isLoading } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		try {
			await login(username, password, rememberMe);
		} catch (err) {
			setError(
				err instanceof Error && err.message === "invalid_credentials"
					? t("login.invalidCredentials")
					: t("login.failed"),
			);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="space-y-1">
					<CardTitle
						className="text-2xl text-center"
						style={{ fontFamily: "Silkscreen" }}
					>
						qBittorrent
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="username">{t("login.username")}</Label>
							<Input
								id="username"
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">{t("login.password")}</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						<div className="flex items-center space-x-2">
							<Checkbox
								id="remember_me"
								checked={rememberMe}
								onCheckedChange={(checked) => setRememberMe(!!checked)}
							/>
							<Label htmlFor="remember_me" className="font-normal">
								{t("login.rememberMe")}
							</Label>
						</div>
						{error && <p className="text-sm text-destructive">{error}</p>}
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? t("login.connecting") : t("login.connect")}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
