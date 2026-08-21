const GITHUB_REPO = "nicolettijason/qbitiny";
const GITHUB_API = "https://api.github.com";

export interface GitHubRelease {
	tag_name: string;
	name: string;
	published_at: string;
	html_url: string;
	body: string;
	zipUrl?: string;
}

export async function getLatestRelease(): Promise<GitHubRelease | null> {
	try {
		const response = await fetch(
			`${GITHUB_API}/repos/${GITHUB_REPO}/releases/latest`,
			{
				headers: {
					Accept: "application/vnd.github.v3+json",
				},
			}
		);

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		return {
			tag_name: data.tag_name,
			name: data.name,
			published_at: data.published_at,
			html_url: data.html_url,
			body: data.body,
			zipUrl: data.assets.find((asset: { name: string; browser_download_url: string }) => asset.name.endsWith(".zip"))?.browser_download_url,
		};
	} catch (error) {
		console.error("Failed to fetch latest release from GitHub:", error);
		return null;
	}
}

export function compareVersions(
	current: string,
	latest: string
): "up-to-date" | "outdated" {
	const currentParts = current.split(".").map(Number);
	const latestParts = latest.split(".").map(Number);

	const maxLength = Math.max(currentParts.length, latestParts.length);

	for (let i = 0; i < maxLength; i++) {
		const currentPart = currentParts[i] || 0;
		const latestPart = latestParts[i] || 0;

		if (latestPart > currentPart) {
			return "outdated";
		}
		if (currentPart > latestPart) {
			return "up-to-date";
		}
	}

	return "up-to-date";
}
