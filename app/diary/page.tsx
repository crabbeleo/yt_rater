"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { readLogs, deleteLog, type Log } from "@/lib/logs";
import { USE_STUB } from "@/lib/video";

export default function DiaryPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [signedIn, setSignedIn] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      const { data } = await createClient().auth.getUser();
      if (data.user) {
        setSignedIn(true);
        setLogs(await readLogs(data.user.id));
      }
      setLoaded(true);
    }
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this log?")) return;
    const error = await deleteLog(id);
    if (error) {
      window.alert(error);
      return;
    }
    setLogs((prev) => prev.filter((log) => log.id !== id));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold">Diary</h1>

      {loaded && !signedIn && (
        <Link href="/login" className="underline">
          Sign in to see your diary
        </Link>
      )}

      {loaded && signedIn && logs.length === 0 && (
        <p className="text-gray-500">Nothing logged yet.</p>
      )}

      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-2 rounded-lg border border-gray-400 p-3"
        >
          <Link href={`/video/${log.id}`} className="flex flex-1 gap-4">
            {USE_STUB ? (
              <div className="aspect-video w-32 rounded bg-gray-300" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://i.ytimg.com/vi/${log.id}/mqdefault.jpg`}
                alt={log.title}
                className="w-32 rounded"
              />
            )}
            <div className="flex flex-col gap-1">
              <span className="font-semibold">{log.title}</span>
              <span className="text-yellow-400">
                {"★".repeat(log.rating)}
                <span className="text-gray-400">
                  {"★".repeat(5 - log.rating)}
                </span>
              </span>
              {log.review && <p className="text-sm">{log.review}</p>}
              <span className="text-xs text-gray-500">
                {new Date(log.loggedAt).toLocaleDateString()}
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(log.id)}
            className="text-sm text-red-500"
          >
            Delete
          </button>
        </div>
      ))}
    </main>
  );
}