import { useStorage } from "@/contexts/StorageContext";

/**
 * Hook to access and update storage preferences
 */
export function useStoragePreferences() {
	const storage = useStorage();

	return {
		sizeUnit: storage.qbitwebberSizeUnit,
		setSizeUnit: storage.setQbitwebberSizeUnit,
	interactiveTabTitle: storage.qbitwebberInteractiveTabTitle,
	setInteractiveTabTitle: storage.setQbitwebberInteractiveTabTitle,
		tableViewSettings: storage.qbitwebberTableViewSettings,
		setTableViewSettings: storage.setQbitwebberTableViewSettings,
	};
}
