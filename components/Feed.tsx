import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { USE_STUB } from "@/lib/video";

type FeedRow = {
  user_id: string;
  video_id: string;
  rating: number;
  review: string;
  logged_at: string;
  videos: { title: string } | null;
  profiles: { username: string; display_name: string | null } | null;
};

export default async function Feed() {
  await connection();
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const viewerId = claimsData?.claims?.sub;

  // Who do I follow? (nobody, if signed out)
  let followingIds: string[] = [];
  if (viewerId) {
    const { data: followRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", viewerId);
    followingIds = (followRows ?? []).map((r) => r.following_id);
  }

  // Their recent logs, or everyone's if I don't follow anyone
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
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">
        {followingIds.length > 0 ? "Feed" : "Recent from everyone"}
      </h2>

      {!viewerId && (
        <p className="text-sm text-muted">
          <Link href="/login" className="underline">
            Sign in
          </Link>{" "}
          to follow people and build your own feed.
        </p>
      )}

      {viewerId && followingIds.length === 0 && (
        <p className="text-sm text-muted">
          You&apos;re not following anyone yet. Open a profile from here, or
          use Search, and follow people to build your feed.
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
          <Link href={`/video/${row.video_id}`} className="shrink-0">
            {USE_STUB ? (
              <div className="aspect-video w-32 rounded bg-surface" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://i.ytimg.com/vi/${row.video_id}/mqdefault.jpg`}
                alt={row.videos?.title ?? "Video"}
                className="aspect-video w-32 rounded object-cover"
              />
            )}
          </Link>
          <div className="flex min-w-0 flex-col gap-1">
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
              <span className="text-muted/60">{"★".repeat(5 - row.rating)}</span>
            </span>
            {row.review && <p className="text-sm">{row.review}</p>}
            <span className="text-xs text-muted">
              {new Date(row.logged_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}