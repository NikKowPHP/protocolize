import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase/client';
import { progressService } from './progress';
import { formatDistanceToNow } from 'date-fns';
import { prisma } from './db';

// Function to generate a PDF report for a user's progress
export async function generateUserReport(userId: string, template: 'standard' | 'detailed' | 'compact' = 'standard') {
  // Verify user is authenticated
  const { data: authData } = await supabase.auth.getSession();
  if (!authData?.session || authData.session.user.id !== userId) {
    throw new Error('Unauthorized');
  }

  // Fetch user data and progress
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!userData) {
    throw new Error('User not found');
  }

  // Get progress metrics
  const progress = await progressService.getUserMetrics(userId);

  // Get all questions and their review status
  const questionsData = await prisma.question.findMany({
    where: { userId: userId },
    select: { id: true, content: true, lastReviewed: true, reviewInterval: true, reviewEase: true },
  });

  // Create a new PDF document
  const doc = new jsPDF();

  // Apply template-specific styling
  if (template === 'detailed') {
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, 210, 297, 'F');
  } else if (template === 'compact') {
    doc.setFontSize(10);
  }

  // Add title
  doc.setFontSize(template === 'compact' ? 16 : 20);
  doc.text('Interview Prep Progress Report', 14, template === 'compact' ? 16 : 22);

  // Add user information
  doc.setFontSize(template === 'compact' ? 12 : 14);
  doc.text(`Name: ${userData.name || 'N/A'}`, 14, template === 'compact' ? 24 : 30);
  doc.text(`Email: ${userData.email}`, 14, template === 'compact' ? 30 : 36);
  doc.text(`Account Created: ${formatDistanceToNow(new Date(userData.createdAt), { addSuffix: true })}`, 14, template === 'compact' ? 36 : 42);

  // Add progress summary
  doc.setFontSize(template === 'compact' ? 14 : 16);
  doc.text('Progress Summary', 14, template === 'compact' ? 44 : 50);

  // Add progress data as a table
  const progressData = [
    ['Metric', 'Value'],
    ['Total Questions', progress.totalQuestions],
    ['Correct Answers', progress.correctAnswers],
    ['Incorrect Answers', progress.incorrectAnswers],
    ['Mastery Score', `${progress.masteryScore.toFixed(2)}%`],
  ];

  autoTable(doc, {
    startY: template === 'compact' ? 52 : 58,
    head: [['Metric', 'Value']],
    body: progressData,
    theme: template === 'detailed' ? 'grid' : 'plain',
  });

  // Add detailed question performance
  doc.addPage();
  doc.setFontSize(template === 'compact' ? 14 : 16);
  doc.text('Question Performance', 14, template === 'compact' ? 16 : 22);

  const questionData = questionsData.map(q => [
    q.content,
    q.lastReviewed ? 'Answered' : 'Pending',
    q.reviewEase >= 2.5 ? '✓' : '✗',
  ]);

  autoTable(doc, {
    startY: template === 'compact' ? 24 : 30,
    head: [['Question', 'Status', 'Correct']],
    body: questionData,
    theme: template === 'detailed' ? 'grid' : 'plain',
  });

  // Return the PDF as a buffer
  return doc.output('arraybuffer');
}