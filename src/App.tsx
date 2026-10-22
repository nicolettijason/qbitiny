import { lazy, Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { StorageProvider } from "@/contexts/StorageContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/LoginForm";
import { Layout } from "@/components/Layout";
import { TorrentsView } from "@/components/torrents/TorrentsView";
import { VersionCheckDialog } from "@/components/VersionCheckDialog";

// Secondary tabs are split into their own chunks, loaded on first visit.
const AddTorrentView = lazy(() =>
	import("@/components/torrents/AddTorrentView").then((m) => ({
		default: m.AddTorrentView,
	})),
);
const RSSView = lazy(() =>
	import("@/components/rss/RSSView").then((m) => ({ default: m.RSSView })),
);
const SearchView = lazy(() =>
	import("@/components/search/SearchView").then((m) => ({
		default: m.SearchView,
	})),
);
const LogsView = lazy(() =>
	import("@/components/logs/LogsView").then((m) => ({ default: m.LogsView })),
);
const SettingsView = lazy(() =>
	import("@/components/settings/SettingsView").then((m) => ({
		default: m.SettingsView,
	})),
);

const viewFallback = (
	<div className="flex justify-center py-8">
		<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
	</div>
);

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5000,
			retry: 1,
		},
	},
});

type Tab = "torrents" | "add" | "rss" | "search" | "logs" | "settings";

function AppContent() {
	const [activeTab, setActiveTab] = useState<Tab>("torrents");
	const { isAuthenticated, isLoading } = useAuth();
	const appVersion = import.meta.env.VITE_APP_VERSION || "1.0.0";

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return <LoginForm />;
	}

	return (
		<>
			<VersionCheckDialog currentVersion={appVersion} />
			<Layout activeTab={activeTab} onTabChange={setActiveTab}>
				{/* Kept mounted (only hidden) so search, filters, page and selection
				    survive tab switches. */}
				<div hidden={activeTab !== "torrents"}>
					<TorrentsView />
				</div>
				<Suspense fallback={viewFallback}>
					{activeTab === "add" && <AddTorrentView />}
					{activeTab === "rss" && <RSSView />}
					{activeTab === "search" && <SearchView />}
					{activeTab === "logs" && <LogsView />}
					{activeTab === "settings" && <SettingsView />}
				</Suspense>
			</Layout>
		</>
	);
}

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<StorageProvider>
				<Toaster position="bottom-right" />
				<AuthProvider>
					<AppContent />
				</AuthProvider>
			</StorageProvider>
		</QueryClientProvider>
	);
}

export default App;
