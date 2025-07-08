import { NoteEditor } from '@/components/note-editor';
import { NoteList } from '@/components/note-list';
import React from 'react';

export default function JournalPage() {
  const episodeTitle = 'Morning Sunlight Protocol';

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-bold">Journal</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">New Entry</h2>
          <NoteEditor
            initialContent=""
            onSave={(content) => console.log('Saving:', content)}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Previous Entries</h2>
          <NoteList />
        </div>
      </div>
    </div>
  );
}
