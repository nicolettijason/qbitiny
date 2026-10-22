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
import { useTranslation } from "@/i18n";

export function DefaultWebUICard() {
	const { t } = useTranslation();
	const [revertDialogOpen, setRevertDialogOpen] = useState(false);
	const [reverting, setReverting] = useState(false);

	const handleRevert = async () => {
		setReverting(true);
		try {
			await qbitClient.revertToDefaultWebUI();
			setRevertDialogOpen(false);
			toast.success(
				t("webui.reverted"),
			);
		} catch (error) {
			console.error("Failed to revert to default Web UI:", error);
			toast.error(t("webui.revertFailed"));
		} finally {
			setReverting(false);
		}
	};

	return (
		<Card className="mt-3">
			<CardHeader>
				<CardTitle>{t("webui.title")}</CardTitle>
				<CardDescription>
					{t("webui.description")}
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
							{t("webui.revert")}
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{t("webui.revertConfirm")}</DialogTitle>
							<DialogDescription>
								{t("webui.confirmDescription")}
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setRevertDialogOpen(false)}
							>
								{t("common.cancel")}
							</Button>
							<Button
								variant="destructive"
								onClick={handleRevert}
								disabled={reverting}
							>
								{reverting ? t("webui.reverting") : t("common.confirm")}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</CardContent>
		</Card>
	);
}
