import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useStoragePreferences } from "@/hooks/useStoragePreferences";
import { useTranslation } from "@/i18n";
import { LANGUAGES, type Language, type LanguagePreference } from "@/i18n";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function AppearanceSettingsCard() {
	const { t, preference, setPreference } = useTranslation();
	const { theme, setTheme } = useTheme();
	const { interactiveTabTitle, setInteractiveTabTitle } =
		useStoragePreferences();

	return (
		<Card className="mt-3">
			<CardHeader>
				<CardTitle>{t("appearance.title")}</CardTitle>
				<CardDescription>
					{t("appearance.description")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<Label>{t("appearance.theme")}</Label>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						className="gap-2"
					>
						{theme === "dark" ? (
							<>
								<Moon className="h-4 w-4" />
								<span>{t("appearance.dark")}</span>
							</>
						) : (
							<>
								<Sun className="h-4 w-4" />
								<span>{t("appearance.light")}</span>
							</>
						)}
					</Button>
				</div>
				<div className="flex items-center justify-between gap-4 mt-4">
					<Label htmlFor="language">{t("appearance.language")}</Label>
					<Select
						value={preference}
						onValueChange={(value) => setPreference(value as LanguagePreference)}
					>
						<SelectTrigger id="language" className="w-48">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="auto">{t("appearance.languageAuto")}</SelectItem>
							{(Object.keys(LANGUAGES) as Language[]).map((code) => (
								<SelectItem key={code} value={code}>
									{LANGUAGES[code]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center space-x-2 mt-4">
					<Checkbox
						id="interactive_tab_title"
						checked={interactiveTabTitle}
						onCheckedChange={(checked) =>
							setInteractiveTabTitle(!!checked)
						}
					/>
					<Label htmlFor="interactive_tab_title">
						{t("appearance.interactiveTitle")}
					</Label>
				</div>
			</CardContent>
		</Card>
	);
}
