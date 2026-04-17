import { useState } from 'react';
import { Header } from './components/Header';
import { IssueFeed } from './components/IssueFeed';
import { IssueDetail } from './components/IssueDetail';
import { ImpactDashboard } from './components/ImpactDashboard';
import { ISSUES } from './data/mockData';
import type { Issue } from './types';

type View = 'feed' | 'detail' | 'impact';

export default function App() {
  const [issues, setIssues] = useState<Issue[]>(ISSUES);
  const [view, setView] = useState<View>('feed');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const selectedIssue = issues.find((i) => i.id === selectedIssueId) ?? null;

  function handleSelectIssue(id: string) {
    setSelectedIssueId(id);
    setView('detail');
  }

  function handleApplyFix(issueId: string, deployedArticle: string) {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId ? { ...issue, status: 'fix_applied', deployedArticle } : issue
      )
    );
  }

  function handleNavigate(dest: 'feed' | 'impact') {
    setView(dest);
    setSelectedIssueId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header
        onNavigate={handleNavigate}
        activeView={view === 'detail' ? 'feed' : view}
      />
      <main>
        {view === 'feed' && (
          <IssueFeed issues={issues} onSelectIssue={handleSelectIssue} />
        )}
        {view === 'detail' && selectedIssue && (
          <IssueDetail
            issue={selectedIssue}
            onBack={() => setView('feed')}
            onApplyFix={handleApplyFix}
          />
        )}
        {view === 'impact' && (
          <ImpactDashboard issues={issues} onSelectIssue={handleSelectIssue} />
        )}
      </main>
    </div>
  );
}
