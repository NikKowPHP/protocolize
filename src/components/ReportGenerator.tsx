import React from 'react';
import { useAuth } from '../lib/auth-context';

type TemplateType = 'standard' | 'detailed' | 'compact';

const ReportGenerator: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [template, setTemplate] = React.useState<TemplateType>('standard');

  const generateReport = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `progress-report-${user.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Generate Progress Report</h2>
      <p className="mb-4">Export your interview preparation progress to a PDF report.</p>

      <div className="mb-4">
        <label className="block font-bold mb-2">Select Report Template:</label>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value as TemplateType)}
          className="border rounded px-2 py-1 w-full"
        >
          <option value="standard">Standard</option>
          <option value="detailed">Detailed</option>
          <option value="compact">Compact</option>
        </select>
      </div>

      <button
        onClick={generateReport}
        disabled={isLoading || !user}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isLoading ? 'Generating...' : 'Generate Report'}
      </button>
    </div>
  );
};

export default ReportGenerator;