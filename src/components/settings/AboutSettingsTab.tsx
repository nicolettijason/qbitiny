import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle, Download } from "lucide-react";
import { getLatestRelease, compareVersions } from "@/lib/github";

const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

export function AboutSettingsTab() {
	const [latestRelease, setLatestRelease] = useState<{
		tag: string;
		name: string;
		url: string;
	} | null>(null);
	const [checking, setChecking] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCheckUpdates = async () => {
		setChecking(true);
		setError(null);

		const release = await getLatestRelease();

		if (!release) {
			setError("Failed to check for updates. Please try again later.");
			setChecking(false);
			return;
		}

		const versionTag = release.tag_name.replace(/^v/, "");
		setLatestRelease({
			tag: versionTag,
			name: release.name,
			url: release.html_url,
		});

		setChecking(false);
	};

	const handleDownloadBuild = () => {
		if (latestRelease) {
			window.open(latestRelease.url, "_blank");
		}
	};

	const currentVersion = CURRENT_VERSION.replace(/^v/, "");
	const isOutdated =
		latestRelease &&
		compareVersions(currentVersion, latestRelease.tag) === "outdated";

	return (
		<div className="space-y-6">
			<Card className="p-6">
				<h2 className="text-lg font-semibold mb-4">About qBitiny</h2>

				<div className="space-y-4">
					<div>
						<p className="text-sm text-muted-foreground mb-1">
							Current Version
						</p>
						<p className="text-2xl font-mono font-bold">{currentVersion}</p>
					</div>

					<div className="pt-4 flex gap-2">
						<Button
							onClick={handleCheckUpdates}
							disabled={checking}
							variant="default"
						>
							{checking ? (
								<>
									<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
									Checking...
								</>
							) : (
								<>
									<RefreshCw className="h-4 w-4 mr-2" />
									Check for Updates
								</>
							)}
						</Button>
						{isOutdated && (
							<Button
								onClick={handleDownloadBuild}
								variant="outline"
								title="Download the latest build from GitHub releases"
							>
								<Download className="h-4 w-4 mr-2" />
								Download Build
							</Button>
						)}
					</div>

					{error && (
						<div className="p-3 bg-destructive/10 rounded-md flex gap-2">
							<AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
							<p className="text-sm text-destructive">{error}</p>
						</div>
					)}

					{latestRelease && (
						<div
							className={`p-4 rounded-md ${
								isOutdated
									? "bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800"
									: "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
							}`}
						>
							<div className="flex gap-3">
								{isOutdated ? (
									<AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
								) : (
									<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
								)}
								<div className="flex-1">
									<p className="font-semibold mb-1">
										{isOutdated
											? "Update Available"
											: "You're Up to Date"}
									</p>
									<p className="text-sm mb-3">
										{isOutdated
											? `New version ${latestRelease.tag} is available`
											: `You have the latest version (${latestRelease.tag})`}
									</p>
									{isOutdated && (
										<a
											href={latestRelease.url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
										>
											View on GitHub
											<ExternalLink className="h-3 w-3" />
										</a>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</Card>

			<Card className="p-6">
				<h3 className="text-sm font-semibold mb-2">Project Information</h3>
				<p className="text-sm text-muted-foreground mb-4">
					qBitiny is a modern web interface for qBittorrent built with
					React and TypeScript.
				</p>
				<a
					href="https://github.com/nicolettijason/qbitiny"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
				>
					View on GitHub
					<ExternalLink className="h-4 w-4" />
				</a>
			</Card>
		</div>
	);
}
