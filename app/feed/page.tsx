import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { USE_STUB } from "@/lib/video";
import { connection } from "next/server";

export const instant = false;

type FeedRow = {
    user_id: string;
    video_id: string;
    rating: number;
    review: string;
    logged_at: string;
    videos: { title: string } | null;
    profiles: { username: string; display_name: string | null } | null;
};

export default async function FeedPage() {
    await connection();
    const supabase = await createClient();

    const { data: claimsData } = await supabase.auth.getClaims();
    const viewerId = claimsData?.claims?.sub;
    if (!viewerId) redirect("/login");

    // Who do I follow?
    const { data: followRows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", viewerId);
    const followingIds = (followRows ?? []).map((r) => r.following_id);

    // Their recent logs, or everyone's if I don't follow anyone yet
    let query = supabase
        .from("logs")
        .select(
            "user_id, video_id, rating, review, logged_at, videos(title), profiles(username, display_name)"
        )
        .order("logged_at", { ascending: false })
        .limit(30);
    if (followingIds.length > 0) {
        query = query.in("user_id", followingIds);
    }
    const { data, error } = await query;
    const rows = (data ?? []) as unknown as FeedRow[];

    return (
        <main className="mx-auto flex max-w-xl flex-col gap-4 p-8">
            <h1 className="text-3xl font-bold">
                {followingIds.length > 0 ? "Feed" : "Recent from everyone"}
            </h1>

            {followingIds.length === 0 && (
                <p className="text-sm text-muted">
                    You&apos;re not following anyone yet. Open a profile from here and
                    follow people to build your feed.
                </p>
            )}

            {error && <p className="text-danger">{error.message}</p>}

            {!error && rows.length === 0 && (
                <p className="text-muted">Nothing here yet.</p>
            )}

            {rows.map((row) => (
                <div
                    key={`${row.user_id}-${row.video_id}`}
                    className="flex gap-4 rounded-lg border border-line p-3"
                >
                    <Link href={`/video/${row.video_id}`}>
                        {USE_STUB ? (
                            <div className="aspect-video w-32 rounded bg-surface" />
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={`https://i.ytimg.com/vi/${row.video_id}/mqdefault.jpg`}
                                alt={row.videos?.title ?? "Video"}
                                className="w-32 rounded"
                            />
                        )}
                    </Link>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted">
                            {row.profiles ? (
                                <Link href={`/u/${row.profiles.username}`} className="underline">
                                    {row.profiles.display_name ?? row.profiles.username}
                                </Link>
                            ) : (
                                "Someone"
                            )}{" "}
                            logged
                        </span>
                        <Link href={`/video/${row.video_id}`} className="font-semibold">
                            {row.videos?.title ?? "Unknown video"}
                        </Link>
                        <span className="text-accent">
                            {"★".repeat(row.rating)}
                            <span className="text-muted/60">
                                {"★".repeat(5 - row.rating)}
                            </span>
                        </span>
                        {row.review && <p className="text-sm">{row.review}</p>}
                        <span className="text-xs text-muted">
                            {new Date(row.logged_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            ))}
        </main>
    );
}