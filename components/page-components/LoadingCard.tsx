import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react"; // Loading spinner icon

export default function LoadingCard() {
  return (
    <Card className="flex flex-col items-center justify-center p-8 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      <p className="text-gray-700 text-sm">Loading, please wait...</p>
    </Card>
  );
}
