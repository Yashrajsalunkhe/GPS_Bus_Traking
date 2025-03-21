import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Loading...</h3>
        <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the data.</p>
      </div>
    </div>
  );
}
