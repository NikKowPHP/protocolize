export interface Question {
  id: string;
  question: string; // Primary question text
  content: string; // Alias for question - maintained for backward compatibility
  answer: string;
  category: string;
  difficulty: string;
  user_id: string;
  rating: number;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
  codeExample?: boolean; // Only present for coding questions
}