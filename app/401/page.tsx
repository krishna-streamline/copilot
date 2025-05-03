"use client";

import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/"); // Redirect to home page or login
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center space-y-4 w-full">
      <h1 className="text-5xl font-bold">401</h1>
      <p className="text-lg">Unauthorized Access</p>
      <button
        onClick={handleGoHome}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go Home
      </button>
    </div>
  );
}
