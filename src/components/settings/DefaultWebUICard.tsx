import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { qbitClient } from "@/lib/api";

export function DefaultWebUICard() {
	const [revertDialogOpen, setRevertDialogOpen] = useState(false);
	const [reverting, setReverting] = useState(false);

	const handleRevert = async () => {
		setReverting(true);
		try {
			await qbitClient.revertToDefaultWebUI();
			setRevertDialogOpen(false);
			toast.success(
				"Reverted to default Web UI. Reload the page or visit the root URL to access the default interface.",
			);
		} catch (error) {
			console.error("Failed to revert to default Web UI:", error);
			toast.error("Failed to revert to default Web UI");
		} finally {
			setReverting(false);
		}
	};

	return (
		<Card className="mt-3">
			<CardHeader>
				<CardTitle>Default Web UI</CardTitle>
				<CardDescription>
					Disable qbitwebber and revert to qBittorrent's built-in Web UI
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Dialog
					open={revertDialogOpen}
					onOpenChange={setRevertDialogOpen}
				>
					<DialogTrigger asChild>
						<Button
							variant="destructive"
							size="default"
							className="gap-2"
						>
							Revert to Default Web UI
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Revert to Default Web UI?</DialogTitle>
							<DialogDescription>
								This will disable qbitwebber. You will need to re-enable
								the alternative Web UI in qBittorrent's settings to use
								qbitwebber again.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setRevertDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={handleRevert}
								disabled={reverting}
							>
								{reverting ? "Reverting..." : "Confirm"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</CardContent>
		</Card>
	);
}
