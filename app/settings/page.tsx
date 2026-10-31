
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DeleteAccount from "@/components/DeleteAccount";

export default function SettingsPage() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [savedUsername, setSavedUsername] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profile) {
          setUsername(profile.username);
          setSavedUsername(profile.username);
          setDisplayName(profile.display_name ?? "");
        }
      }
      setLoaded(true);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;

    const name = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(name)) {
      setMessage("Usernames are 3–20 characters: letters, numbers, underscores.");
      return;
    }

    setBusy(true);
    setMessage("");
    const { error } = await createClient()
      .from("profiles")
      .update({ username: name, display_name: displayName.trim() || null })
      .eq("id", userId);
    setBusy(false);

    if (error) {
      setMessage(
        error.code === "23505" ? "That username is taken." : error.message
      );
      return;
    }
    setUsername(name);
    setSavedUsername(name);
    setMessage("Saved.");
  }

  if (!loaded) return <main className="p-8 text-gray-500">Loading…</main>;

  if (!userId) {
    return (
      <main className="p-8">
        <Link href="/login" className="underline">
          Sign in to edit your profile
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold">Profile settings</h1>
      <p className="text-sm text-gray-500">
        Your username, display name and logs are public.
      </p>
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-lg border border-gray-400 px-4 py-2 text-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Display name (optional)
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            className="rounded-lg border border-gray-400 px-4 py-2 text-black"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
      {message && <p className="text-sm">{message}</p>}
      {savedUsername && (
        <Link href={`/u/${savedUsername}`} className="underline">
          View your public profile
        </Link>
      )}
      {savedUsername && <DeleteAccount username={savedUsername} />}
    </main>
  );
}