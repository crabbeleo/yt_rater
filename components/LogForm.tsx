"use client";

import { useEffect, useState } from "react";
import { readLogs, saveLog } from "@/lib/logs";

export default function LogForm({ id, title }: { id: string; title: string }) {
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);

  // Load an existing log for this video, if you've logged it before
  useEffect(() => {
    const existing = readLogs()[id];
    if (existing) {
      setRating(existing.rating);
      setReview(existing.review);
      setSaved(true);
    }
  }, [id]);

  function handleSave() {
    saveLog({
      id,
      title,
      rating,
      review,
      loggedAt: new Date().toISOString(),
    });
    setSaved(true);
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex gap-1 text-3xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setRating(n);
              setSaved(false);
            }}
            className={n <= rating ? "text-yellow-400" : "text-gray-400"}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={review}
        onChange={(e) => {
          setReview(e.target.value);
          setSaved(false);
        }}
        placeholder="Add a review (optional)"
        rows={3}
        className="rounded-lg border border-gray-400 px-4 py-2 text-black"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={rating === 0}
        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-40"
      >
        {saved ? "Logged ✓" : "Log it"}
      </button>
    </div>
  );
}