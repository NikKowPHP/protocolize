'use client';

import { NoteEditor } from '@/components/note-editor';
import { NoteList } from '@/components/note-list';
import { PublicNotesList } from '@/components/public-notes-list';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { PublicNotesList } from '@/components/public-notes-list';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEpisodes } from '@/lib/api/content';

export default function JournalPage() {
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>('');

  const { data: episodes, isLoading: isLoadingEpisodes } = useQuery({
    queryKey: ['episodes'],
    queryFn: getEpisodes,
  });

  const selectedEpisodeTitle =
    episodes?.find((e) => e.id === selectedEpisodeId)?.title ||
    'selected episode';

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">My Journal</h1>
        <div className="w-full md:w-72">
          <Select
            onValueChange={setSelectedEpisodeId}
            value={selectedEpisodeId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an episode..." />
            </SelectTrigger>
            <SelectContent>
              {isLoadingEpisodes ? (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              ) : (
                episodes?.map((ep) => (
                  <SelectItem key={ep.id} value={ep.id}>
                    {ep.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedEpisodeId ? (
        <div className="space-y-6">
          <NoteEditor
            episodeId={selectedEpisodeId}
            episodeTitle={selectedEpisodeTitle}
          />
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Your Notes</TabsTrigger>
              <TabsTrigger value="community">Community Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="personal">
              <NoteList episodeId={selectedEpisodeId} />
            </TabsContent>
            <TabsContent value="community">
              <PublicNotesList episodeId={selectedEpisodeId} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
          Please select an episode to view or add notes.
        </div>
      )}
    </div>
  );
}
