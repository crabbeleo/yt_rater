"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Person = { username: string; display_name: string | null };

export default function SearchPage() {
    const [query, setQuery] = useState<string>("");
    const [results, setResults] = useState<Person[]>([]);
    const [resultsFor, setResultsFor] = useState<string>("");

    // Usernames are lowercase letters, numbers and underscores only
    const cleaned = query.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    useEffect(() => {
        if (cleaned.length < 2) return;

        let cancelled = false;
        const timer = setTimeout(async () => {
            // In SQL patterns, _ is a wildcard, so escape it
            const pattern = `%${cleaned.replace(/_/g, "\\_")}%`;
            const { data, error } = await createClient()
                .from("profiles")
                .select("username, display_name")
                .ilike("username", pattern)
                .order("username")
                .limit(20);
            if (cancelled) return;
            setResults(error ? [] : data ?? []);
            setResultsFor(cleaned);
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [cleaned]);

    return (
        <main className="mx-auto flex max-w-xl flex-col gap-4 p-8">
            <h1 className="text-3xl font-bold">Find people</h1>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username"
                autoFocus
                className="rounded-lg border border-line px-4 py-2 bg-surface text-foreground"
            />

            {cleaned.length < 2 && (
                <p className="text-sm text-muted">Type at least 2 characters.</p>
            )}

            {cleaned.length >= 2 && resultsFor !== cleaned && (
                <p className="text-sm text-muted">Searching…</p>
            )}

            {cleaned.length >= 2 && resultsFor === cleaned && results.length === 0 && (
                <p className="text-muted">No one found.</p>
            )}

            {cleaned.length >= 2 &&
                resultsFor === cleaned &&
                results.map((person) => (
                    <Link
                        key={person.username}
                        href={`/u/${person.username}`}
                        className="flex flex-col rounded-lg border border-line px-4 py-3"
                    >
                        <span className="font-semibold">
                            {person.display_name ?? person.username}
                        </span>
                        <span className="text-sm text-muted">@{person.username}</span>
                    </Link>
                ))}
        </main>
    );
}