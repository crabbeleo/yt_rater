"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Pulls the 11-character video ID out of the common YouTube URL formats
function getVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|v=|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function Home() {
  const [link, setLink] = useState<string>("");
  const [error, setError] = useState<string>("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const id = getVideoId(link);
    if (!id) {
      setError("That doesn't look like a YouTube link.");
      return;
    }
    router.push(`/video/${id}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Log a video</h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-xl gap-2">
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Paste a YouTube link"
          className="flex-1 rounded-lg border border-gray-400 px-4 py-2 text-black"
        />
        <button
          type="submit"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Log it
        </button>
      </form>
      {error && <p className="text-red-500">{error}</p>}
    </main>
    
  );
}