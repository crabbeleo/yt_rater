import { notFound } from "next/navigation";
import LogForm from "@/components/LogForm";

type OEmbed = {
  title: string;
  author_name: string;
};

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
  );
  if (!res.ok) notFound();

  const video: OEmbed = await res.json();

  return (
    <main className="min-h-screen flex flex-col items-center gap-4 p-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt={video.title}
        className="w-full max-w-xl rounded-lg"
      />
      <h1 className="text-2xl font-bold text-center">{video.title}</h1>
      <p className="text-gray-500">{video.author_name}</p>
       <LogForm id={id} title={video.title} />
    </main>
  );
}