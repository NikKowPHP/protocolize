import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const MOCK_NOTES = [
  { id: "n1", content: "Key takeaway: the timing of light exposure is critical for anchoring the circadian rhythm.", createdAt: "2 days ago" },
  { id: "n2", content: "Need to remember that the cold stimulus should be enough to be uncomfortable but not so much that it causes shivering.", createdAt: "1 day ago" },
];

export const NoteList = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Notes</CardTitle>
        <CardDescription>Review your previous notes and insights</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {MOCK_NOTES.map((note) => (
          <div key={note.id} className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-muted-foreground">{note.createdAt}</p>
            <p className="mt-1">{note.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};