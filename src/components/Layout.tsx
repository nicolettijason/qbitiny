import { useEffect, useMemo, useState } from "react";
import {
	Download,
	Server,
	Search,
	FileText,
	Settings,
	Menu,
	X,
	Radio,
	LogOut,
	Sun,
	Moon,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTransferInfo } from "@/hooks/useApi";
import { useStoragePreferences } from "@/hooks/useStoragePreferences";
import { formatSize } from "@/helpers";
import { useTheme } from "next-themes";

type Tab = "torrents" | "add" | "rss" | "search" | "logs" | "settings";

interface LayoutProps {
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
	children: React.ReactNode;
}

export function Layout({ activeTab, onTabChange, children }: LayoutProps) {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const { logout } = useAuth();
	const { theme, setTheme } = useTheme();
	const { sizeUnit, interactiveTabTitle } = useStoragePreferences();
	const { data: transferInfo } = useTransferInfo(interactiveTabTitle);

	const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
		{
			id: "torrents",
			label: "Torrents",
			icon: <Download className="h-5 w-5" />,
		},
		{ id: "add", label: "Add", icon: <Server className="h-5 w-5" /> },
		{ id: "rss", label: "RSS", icon: <Radio className="h-5 w-5" /> },
		{ id: "search", label: "Search", icon: <Search className="h-5 w-5" /> },
		{ id: "logs", label: "Logs", icon: <FileText className="h-5 w-5" /> },
		{
			id: "settings",
			label: "Settings",
			icon: <Settings className="h-5 w-5" />,
		},
	];

	const transferInfoData = useMemo(() => {
		if (!transferInfo) return null;
		return {
			dlSpeed: formatSize(transferInfo.dl_info_speed, sizeUnit) + "/s",
			dlData: formatSize(transferInfo.dl_info_data, sizeUnit),
			upSpeed: formatSize(transferInfo.up_info_speed, sizeUnit) + "/s",
			upData: formatSize(transferInfo.up_info_data, sizeUnit),
		};
	}, [transferInfo, sizeUnit]);

	useEffect(() => {
		if (interactiveTabTitle) {
			document.title = `DL: ${transferInfoData?.dlSpeed || "-"} | UP: ${transferInfoData?.upSpeed || "-"}`;
		} else {
			document.title = "qBittorrent";
		}
	}, [interactiveTabTitle, transferInfoData]);

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="flex h-14 items-center justify-between px-4">
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							className="md:hidden"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						>
							{mobileMenuOpen ? (
								<X className="h-5 w-5" />
							) : (
								<Menu className="h-5 w-5" />
							)}
						</Button>
						<h1
							className="text-lg font-semibold hidden sm:block"
							style={{ fontFamily: "Silkscreen", fontSize: 24 }}
						>
							qBittorrent
						</h1>
					</div>

					{/* Transfer stats */}
					<div className="flex items-center gap-3">
						{transferInfo ? (
							<div className="flex items-center gap-2 text-xs">
								<div className="flex items-center gap-1 bg-muted/60 rounded px-2 py-1 text-[10px] sm:text-xs">
									<span className="text-blue-500 font-bold">↓</span>
									<span className="font-medium">
										{transferInfoData?.dlSpeed}
									</span>
									<span className="text-muted-foreground inline">
										({transferInfoData?.dlData})
									</span>
								</div>
								<div className="flex items-center gap-1 bg-muted/60 rounded text-[10px] sm:text-xs py-1 px-2">
									<span className="text-green-500 font-bold">↑</span>
									<span className="font-medium">
										{transferInfoData?.upSpeed}
									</span>
									<span className="text-muted-foreground inline">
										({transferInfoData?.upData})
									</span>
								</div>
							</div>
						) : (
							<Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />
						)}
						{/* Theme toggle */}
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 hidden sm:flex"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							title="Toggle theme"
						>
							{theme === "dark" ? (
								<Sun className="h-4 w-4" />
							) : (
								<Moon className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>

				{/* Mobile menu */}
				{mobileMenuOpen && (
					<div className="md:hidden border-t">
						<nav className="flex flex-col p-2">
							{tabs.map((tab) => (
								<Button
									key={tab.id}
									variant={activeTab === tab.id ? "secondary" : "ghost"}
									className="justify-start gap-2"
									onClick={() => {
										onTabChange(tab.id);
										setMobileMenuOpen(false);
									}}
								>
									{tab.icon}
									{tab.label}
								</Button>
							))}
							<Button
								variant="ghost"
								className="justify-start gap-2 text-destructive hover:text-destructive mt-1"
								onClick={logout}
							>
								<LogOut className="h-5 w-5" />
								Logout
							</Button>
							<div className="border-t my-2" />
							<Button
								variant="ghost"
								className="justify-start gap-2"
								onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
								title="Toggle theme"
							>
								{theme === "dark" ? (
									<>
										<Sun className="h-4 w-4" />
										<span>dark</span>
									</>
								) : (
									<>
										<Moon className="h-4 w-4" />
										<span>light</span>
									</>
								)}
							</Button>
						</nav>
					</div>
				)}
			</header>

			{/* Desktop sidebar + main content */}
			<div className="flex">
				{/* Desktop sidebar */}
				<aside className="hidden md:flex w-48 flex-col border-r p-2 gap-1 sticky top-14 self-start h-[calc(100vh-56px)] overflow-y-auto pb-4">
					{tabs.map((tab) => (
						<Button
							key={tab.id}
							variant={activeTab === tab.id ? "secondary" : "ghost"}
							className="justify-start gap-2"
							onClick={() => onTabChange(tab.id)}
						>
							{tab.icon}
							{tab.label}
						</Button>
					))}
					<div className="flex-1" />
					<Button
						variant="ghost"
						className="justify-start gap-2 text-destructive hover:text-destructive mt-1"
						onClick={logout}
					>
						<LogOut className="h-5 w-5" />
						Logout
					</Button>
				</aside>

				{/* Main content */}
				<main className="flex-1 p-4 pb-16 md:pb-4">{children}</main>
			</div>

			{/* Mobile bottom nav — all 6 tabs */}
			<nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur">
				<div className="flex justify-around py-2">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							className={cn(
								"flex flex-col items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-all",
								activeTab === tab.id
									? "text-primary"
									: "text-muted-foreground hover:text-foreground hover:bg-accent hover:brightness-95",
							)}
							onClick={() => onTabChange(tab.id)}
						>
							{tab.icon}
							<span className="text-[9px]">{tab.label}</span>
						</button>
					))}
				</div>
			</nav>
		</div>
	);
}
