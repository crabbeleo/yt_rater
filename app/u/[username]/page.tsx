import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { USE_STUB } from "@/lib/video";
import FollowButton from "@/components/FollowButton";
import { connection } from "next/server";

export const instant = false;

export default async function ProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;
    await connection();
    const supabase = await createClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("username", username.toLowerCase())
        .maybeSingle();
    if (!profile) notFound();

    const { data: claimsData } = await supabase.auth.getClaims();
    const viewerId: string | undefined = claimsData?.claims?.sub;

    const [logsRes, followersRes, followingRes, isFollowingRes] =
        await Promise.all([
            supabase
                .from("logs")
                .select("video_id, rating, review, logged_at, videos(title)")
                .eq("user_id", profile.id)
                .order("logged_at", { ascending: false }),
            supabase
                .from("follows")
                .select("*", { count: "exact", head: true })
                .eq("following_id", profile.id),
            supabase
                .from("follows")
                .select("*", { count: "exact", head: true })
                .eq("follower_id", profile.id),
            viewerId
                ? supabase
                    .from("follows")
                    .select("follower_id")
                    .eq("follower_id", viewerId)
                    .eq("following_id", profile.id)
                    .maybeSingle()
                : Promise.resolve({ data: null }),
        ]);

    const logs = logsRes.data ?? [];
    const followers = followersRes.count ?? 0;
    const following = followingRes.count ?? 0;
    const isFollowing = Boolean(isFollowingRes.data);

    return (
        <main className="mx-auto flex max-w-xl flex-col gap-4 p-8">
            <header className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold">
                    {profile.display_name ?? profile.username}
                </h1>
                <p className="text-gray-500">@{profile.username}</p>
                <p className="text-sm text-gray-500">
                    {followers} {followers === 1 ? "follower" : "followers"} · {following}{" "}
                    following · {logs.length} {logs.length === 1 ? "log" : "logs"}
                </p>
                <div className="mt-2">
                    {!viewerId ? (
                        <Link href="/login" className="underline">
                            Sign in to follow
                        </Link>
                    ) : viewerId === profile.id ? (
                        <Link href="/settings" className="underline">
                            Edit profile
                        </Link>
                    ) : (
                        <FollowButton
                            viewerId={viewerId}
                            targetId={profile.id}
                            initiallyFollowing={isFollowing}
                        />
                    )}
                </div>
            </header>

            {logs.length === 0 && <p className="text-gray-500">Nothing logged yet.</p>}

            {logs.map((log) => {
                const video = log.videos as unknown as { title: string } | null;
                return (
                    <Link
                        key={log.video_id}
                        href={`/video/${log.video_id}`}
                        className="flex gap-4 rounded-lg border border-gray-400 p-3"
                    >
                        {USE_STUB ? (
                            <div className="aspect-video w-32 rounded bg-gray-300" />
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={`https://i.ytimg.com/vi/${log.video_id}/mqdefault.jpg`}
                                alt={video?.title ?? "Video"}
                                className="w-32 rounded"
                            />
                        )}
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold">
                                {video?.title ?? "Unknown video"}
                            </span>
                            <span className="text-yellow-400">
                                {"★".repeat(log.rating)}
                                <span className="text-gray-400">
                                    {"★".repeat(5 - log.rating)}
                                </span>
                            </span>
                            {log.review && <p className="text-sm">{log.review}</p>}
                            <span className="text-xs text-gray-500">
                                {new Date(log.logged_at).toLocaleDateString()}
                            </span>
                        </div>
                    </Link>
                );
            })}
        </main>
    );
}