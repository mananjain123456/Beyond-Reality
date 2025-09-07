import React, { useState } from 'react';
import { Tab } from './types';
import TabButton from './components/TabButton';
import DreamVisualizer from './components/DreamVisualizer';
import IdentityStyler from './components/IdentityStyler';
import MeetYourIcons from './components/MeetYourIcons';
import ArtStyler from './components/ArtStyler';
import CommercialCreator from './components/CommercialCreator';
import ImageFusion from './components/ImageFusion';
import { SparklesIcon } from './components/Icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Dream);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Dream:
        return <DreamVisualizer />;
      case Tab.Identity:
        return <IdentityStyler />;
      case Tab.Icons:
        return <MeetYourIcons />;
      case Tab.Art:
        return <ArtStyler />;
      case Tab.Fusion:
        return <ImageFusion />;
      case Tab.Commercial:
        return <CommercialCreator />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4">
            <SparklesIcon className="w-10 h-10 text-brand-accent" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent text-transparent bg-clip-text">
              Beyond Reality
            </h1>
          </div>
          <p className="mt-2 text-3xl font-handwriting text-brand-secondary">see what you think and dream of</p>
        </header>

        <nav className="flex justify-center border-b border-dark-border mb-8">
          <div className="flex flex-wrap justify-center sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 p-2 bg-dark-card rounded-t-lg">
            {(Object.values(Tab) as Tab[]).map((tab) => (
              <TabButton
                key={tab}
                label={tab}
                isActive={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              />
            ))}
          </div>
        </nav>

        <main>
          {renderContent()}
        </main>
        
        <footer className="text-center mt-12 text-medium-text text-sm">
          <p>Powered by Google Gemini. Creations are AI-generated and may be fictional.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;