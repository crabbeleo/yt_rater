import LogLinkForm from "@/components/LogLinkForm";
import Feed from "@/components/Feed";

export const instant = false;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 p-4 sm:p-8">
      <LogLinkForm />
      <Feed tab={tab === "everyone" || tab === "following" ? tab : undefined} />
    </main>
  );
}