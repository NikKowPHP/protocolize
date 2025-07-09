import { prisma } from '@/lib/db';
import { EpisodeEditor } from '@/components/admin/episode-editor';
import { notFound } from 'next/navigation';

async function getEpisodeData(episodeId: string) {
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: {
      summaries: true,
      protocols: true,
    },
  });
  return episode;
}

export default async function EpisodeCurationPage({
  params,
}: {
  params: { episodeId: string };
}) {
  const episode = await getEpisodeData(params.episodeId);

  if (!episode) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Curation Console</h1>
      <EpisodeEditor episode={episode} />
    </div>
  );
}