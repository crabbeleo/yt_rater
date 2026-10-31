import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";

type Row = {
    user_id: string;
    rating: number;
    review: string;
    logged_at: string;
    profiles: { username: string; display_name: string | null } | null;
};

export default async function VideoLogs({ videoId }: { videoId: string }) {
    await connection();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("logs")
        .select("user_id, rating, review, logged_at, profiles(username, display_name)")
        .eq("video_id", videoId)
        .order("logged_at", { ascending: false });

    if (error) {
        return <p className="text-danger">{error.message}</p>;
    }

    const rows = (data ?? []) as unknown as Row[];
    const count = rows.length;
    const average =
        count > 0 ? rows.reduce((sum, r) => sum + r.rating, 0) / count : 0;

    return (
        <section className="flex w-full max-w-xl flex-col gap-3">
            <h2 className="text-xl font-bold">
                {count === 0 ? "No logs yet" : "Logs"}
            </h2>

            {count > 0 && (
                <p className="text-muted">
                    <span className="text-accent">★</span> {average.toFixed(1)}{" "}
                    average · {count} {count === 1 ? "log" : "logs"}
                </p>
            )}

            {rows.slice(0, 30).map((row) => (
                <div
                    key={row.user_id}
                    className="flex flex-col gap-1 rounded-lg border border-line p-3"
                >
                    <div className="flex items-center gap-2 text-sm">
                        {row.profiles ? (
                            <Link href={`/u/${row.profiles.username}`} className="underline">
                                {row.profiles.display_name ?? row.profiles.username}
                            </Link>
                        ) : (
                            <span>Someone</span>
                        )}
                        <span className="text-accent">
                            {"★".repeat(row.rating)}
                            <span className="text-muted/60">{"★".repeat(5 - row.rating)}</span>
                        </span>
                        <span className="ml-auto text-xs text-muted">
                            {new Date(row.logged_at).toLocaleDateString()}
                        </span>
                    </div>
                    {row.review && <p className="text-sm">{row.review}</p>}
                </div>
            ))}
        </section>
    );
}