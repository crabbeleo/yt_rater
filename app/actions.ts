"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVideoInfo } from "@/lib/video";

export async function logVideo(input: {
  videoId: string;
  rating: number;
  review: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: "You need to sign in to log videos." };

  if (!/^[A-Za-z0-9_-]{11}$/.test(input.videoId)) {
    return { error: "Invalid video ID." };
  }
  if (
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 5
  ) {
    return { error: "Invalid rating." };
  }

  // The server looks the video up itself instead of trusting the browser
  const video = await getVideoInfo(input.videoId);
  if (!video) return { error: "Couldn't find that video." };

  const admin = createAdminClient();
  const { error: videoError } = await admin.from("videos").upsert({
    id: input.videoId,
    title: video.title,
    channel_name: video.author,
    fetched_at: new Date().toISOString(),
  });
  if (videoError) return { error: videoError.message };

  // Saved as the signed-in user, so RLS applies
  const { error } = await supabase.from("logs").upsert({
    user_id: userId,
    video_id: input.videoId,
    rating: input.rating,
    review: input.review.slice(0, 5000),
    logged_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  return {};
}

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: "You need to be signed in." };

  // Deleting the auth user also deletes their profile, logs and follows
  // (the foreign keys we set up use "on delete cascade")
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  return {};
}

export async function signIn(input: {
  identifier: string;
  password: string;
}): Promise<{ error?: string }> {
  const generic = "Invalid login credentials";
  let email = input.identifier.trim();

  // No "@" means it's a username: look up the email on the server only
  if (!email.includes("@")) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("username", email.toLowerCase())
      .maybeSingle();
    if (!profile) return { error: generic };

    const { data, error } = await admin.auth.admin.getUserById(profile.id);
    if (error || !data.user?.email) return { error: generic };
    email = data.user.email;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });
  if (error) return { error: error.message };
  return {};
}