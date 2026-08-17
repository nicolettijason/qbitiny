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

export function AppearanceSettingsCard() {
	const { theme, setTheme } = useTheme();
	const { interactiveTabTitle, setInteractiveTabTitle } =
		useStoragePreferences();

	return (
		<Card className="mt-3">
			<CardHeader>
				<CardTitle>Appearance</CardTitle>
				<CardDescription>
					Configure appearance settings for qbitiny
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<Label>Theme</Label>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						className="gap-2"
					>
						{theme === "dark" ? (
							<>
								<Moon className="h-4 w-4" />
								<span>Dark</span>
							</>
						) : (
							<>
								<Sun className="h-4 w-4" />
								<span>Light</span>
							</>
						)}
					</Button>
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
						Interactive tab title (shows download/upload speeds in the
						browser tab)
					</Label>
				</div>
			</CardContent>
		</Card>
	);
}
