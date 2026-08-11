"use client";

import { useEffect } from "react";

export function ResumeTokenConsumer() {
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = fragment.get("token");
    if (!token) return;

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    void fetch("/plan-your-home/resume/consume", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((result: unknown) => {
        const restored =
          result &&
          typeof result === "object" &&
          "status" in result &&
          result.status === "restored";
        window.location.replace(
          `/plan-your-home/resume?status=${restored ? "restored" : "unavailable"}`,
        );
      })
      .catch(() => {
        window.location.replace("/plan-your-home/resume?status=unavailable");
      });
  }, []);

  return null;
}
