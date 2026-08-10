import { useState } from "react";
import { Loader2 } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { StorageProvider } from "@/contexts/StorageContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/LoginForm";
import { Layout } from "@/components/Layout";
import { TorrentsView } from "@/components/torrents/TorrentsView";
import { AddTorrentView } from "@/components/torrents/AddTorrentView";
import { RSSView } from "@/components/rss/RSSView";
import { SearchView } from "@/components/search/SearchView";
import { LogsView } from "@/components/logs/LogsView";
import { SettingsView } from "@/components/settings/SettingsView";

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
		<Layout activeTab={activeTab} onTabChange={setActiveTab}>
			{activeTab === "torrents" && <TorrentsView />}
			{activeTab === "add" && <AddTorrentView />}
			{activeTab === "rss" && <RSSView />}
			{activeTab === "search" && <SearchView />}
			{activeTab === "logs" && <LogsView />}
			{activeTab === "settings" && <SettingsView />}
		</Layout>
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
