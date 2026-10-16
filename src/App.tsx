import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { UrlDownloader } from './components/UrlDownloader';
import { Mp4ToMp3Converter } from './components/Mp4ToMp3Converter';
import { Mp3ToMp4Converter } from './components/Mp3ToMp4Converter';
import { DownloadHistory } from './components/DownloadHistory';
import { PlatformGuideModal } from './components/PlatformGuideModal';
import { Footer } from './components/Footer';
import { getHistory } from './services/downloadService';
import { HistoryItem, ParsedMediaInfo } from './types/media';

export default function App() {
  const [activeTab, setActiveTab] = useState<'downloader' | 'mp4-to-mp3' | 'mp3-to-mp4' | 'history'>('downloader');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const refreshHistory = () => {
    setHistory(getHistory());
  };

  const handleSendToMp3Converter = (media: ParsedMediaInfo) => {
    setActiveTab('mp4-to-mp3');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenGuide={() => setIsGuideOpen(true)}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 pb-24 md:pb-10">
        {activeTab === 'downloader' && (
          <UrlDownloader
            onMediaProcessed={refreshHistory}
            onSendToMp3Converter={handleSendToMp3Converter}
          />
        )}

        {activeTab === 'mp4-to-mp3' && (
          <Mp4ToMp3Converter />
        )}

        {activeTab === 'mp3-to-mp4' && (
          <Mp3ToMp4Converter />
        )}

        {activeTab === 'history' && (
          <DownloadHistory
            history={history}
            setHistory={setHistory}
            onGoToDownloader={() => setActiveTab('downloader')}
          />
        )}
      </main>

      {/* Footer */}
      <div className="mb-16 md:mb-0">
        <Footer
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      </div>

      {/* Supported Sites & Help Guide Modal */}
      <PlatformGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
