import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { getLatestRelease, compareVersions } from "@/lib/github";

interface VersionCheckDialogProps {
	currentVersion: string;
}

const DISMISSED_VERSION_KEY = "qbitiny_dismissed_version";

export function VersionCheckDialog({ currentVersion }: VersionCheckDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [latestVersion, setLatestVersion] = useState<string | null>(null);
	const [releaseUrl, setReleaseUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [dontShowAgain, setDontShowAgain] = useState(false);

	useEffect(() => {
		const checkVersion = async () => {
			const latestRelease = await getLatestRelease();

			if (latestRelease) {
				const versionTag = latestRelease.tag_name.replace(/^v/, "");
				setLatestVersion(versionTag);
				setReleaseUrl(latestRelease.html_url);

				const dismissedVersion = localStorage.getItem(DISMISSED_VERSION_KEY);
				const status = compareVersions(currentVersion, versionTag);

				if (status === "outdated" && dismissedVersion !== versionTag) {
					setIsOpen(true);
				}
			}

			setIsLoading(false);
		};

		checkVersion();
	}, [currentVersion]);

	const handleDownload = () => {
		if (releaseUrl) {
			window.open(releaseUrl, "_blank");
		}
	};

	const handleDismiss = () => {
		if (dontShowAgain && latestVersion) {
			localStorage.setItem(DISMISSED_VERSION_KEY, latestVersion);
		}
		setIsOpen(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Download className="h-5 w-5" />
						Nouvelle version disponible
					</DialogTitle>
					<DialogDescription>
						Une nouvelle version de qBitiny est disponible. Veuillez mettre à jour
						pour bénéficier des dernières fonctionnalités et corrections de bugs.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-2 rounded-lg bg-muted p-3">
					<div className="text-sm">
						<span className="font-medium">Version actuelle:</span>{" "}
						<span className="text-muted-foreground">{currentVersion}</span>
					</div>
					<div className="text-sm">
						<span className="font-medium">Dernière version:</span>{" "}
						<span className="text-primary font-semibold">{latestVersion}</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Checkbox
						id="dont-show-again"
						checked={dontShowAgain}
						onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
					/>
					<Label
						htmlFor="dont-show-again"
						className="text-sm font-normal cursor-pointer"
					>
						Ne plus afficher pour cette version
					</Label>
				</div>

				<DialogFooter className="gap-2">
					<Button
						variant="outline"
						onClick={handleDismiss}
						className="gap-2"
					>
						<X className="h-4 w-4" />
						Plus tard
					</Button>
					<Button onClick={handleDownload} className="gap-2">
						<Download className="h-4 w-4" />
						Télécharger
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
