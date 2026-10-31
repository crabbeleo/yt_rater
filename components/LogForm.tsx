"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { readLog } from "@/lib/logs";
import { logVideo } from "@/app/actions";

export default function LogForm({ id }: { id: string }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function load() {
      const { data } = await createClient().auth.getUser();
      if (!data.user) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      const existing = await readLog(id, data.user.id);
      if (existing) {
        setRating(existing.rating);
        setReview(existing.review);
        setSaved(true);
      }
    }
    load();
  }, [id]);

  async function handleSave() {
    setBusy(true);
    setError("");
    const result = await logVideo({ videoId: id, rating, review });
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
    }
  }

  if (signedIn === null) {
    return <p className="text-gray-500">Loading…</p>;
  }

  if (!signedIn) {
    return (
      <Link href="/login" className="underline">
        Sign in to log this video
      </Link>
    );
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
        disabled={rating === 0 || busy}
        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-40"
      >
        {busy
          ? "Saving…"
          : rating === 0
          ? "Pick a rating first"
          : saved
          ? "Logged ✓"
          : "Log it"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}