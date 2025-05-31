"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const status = "unauthenticated"; // Replace with actual authentication status

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  }, [router, status]);

  return null;
}
