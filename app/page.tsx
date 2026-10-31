import LogLinkForm from "@/components/LogLinkForm";
import Feed from "@/components/Feed";

export const instant = false;

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 p-4 sm:p-8">
      <LogLinkForm />
      <Feed />
    </main>
  );
}