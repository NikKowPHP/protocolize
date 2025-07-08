import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface NoteEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
}

export const NoteEditor = ({
  initialContent = '',
  onSave,
}: NoteEditorProps) => {
  const [content, setContent] = React.useState(initialContent);

  return (
    <div className="space-y-4">
      <Label htmlFor="note-content">Journal Entry</Label>
      <Textarea
        id="note-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[200px]"
      />
      <div className="flex justify-end">
        <Button onClick={() => onSave(content)}>Save Entry</Button>
      </div>
    </div>
  );
};
