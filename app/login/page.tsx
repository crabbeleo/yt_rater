"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleSignUp() {
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setMessage("Check your email to confirm your account.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <form onSubmit={handleSignIn} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="rounded-lg border border-gray-400 px-4 py-2 text-black"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (6+ characters)"
          required
          minLength={6}
          className="rounded-lg border border-gray-400 px-4 py-2 text-black"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-40"
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={handleSignUp}
          disabled={busy}
          className="rounded-lg border border-gray-400 px-4 py-2 disabled:opacity-40"
        >
          Create account
        </button>
      </form>
      <p className="text-xs text-gray-500">
        By creating an account you agree that your username, logs and reviews are
        public. See the{" "}
        <Link href="/privacy" className="underline">
          privacy page
        </Link>
        .
      </p>
      {message && <p className="text-red-500">{message}</p>}
    </main>
  );
}