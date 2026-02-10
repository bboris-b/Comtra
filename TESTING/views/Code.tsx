
import React, { useState, useEffect } from 'react';
import { BRUTAL, COLORS, TIER_LIMITS } from '../constants';
import { UserPlan } from '../types';
import { Confetti } from '../components/Confetti';

interface Props { 
  plan: UserPlan; 
  userTier?: string;
  onUnlockRequest: () => void;
  usageCount: number;
  onUse: () => void;
}

const LANGUAGES = [
  { id: 'REACT', label: 'React + Tailwind' },
  { id: 'STORYBOOK', label: 'Storybook (.stories.tsx)' },
  { id: 'LIQUID', label: 'Shopify Liquid' },
  { id: 'CSS', label: 'HTML + Clean CSS' },
  { id: 'VUE', label: 'Vue 3' },
  { id: 'SVELTE', label: 'Svelte' },
  { id: 'ANGULAR', label: 'Angular' },
];

const SYNC_ITEMS_MOCK = [
  { id: 'c1', name: 'Primary Button', status: 'DRIFT', lastEdited: '2h ago', desc: 'Padding inconsistency: Figma 12px vs Code 16px' },
  { id: 'c2', name: 'Input Field', status: 'DRIFT', lastEdited: '5h ago', desc: 'Missing focus state definition in Figma' },
  { id: 'c3', name: 'Navbar', status: 'DRIFT', lastEdited: '1d ago', desc: 'Color token mismatch: primary-500 vs primary-600' },
];

const COOLDOWN_MS = 120000; // 2 Minutes

type Tab = 'TOKENS' | 'TARGET' | 'SYNC';

export const Code: React.FC<Props> = ({ plan, userTier, onUnlockRequest, usageCount, onUse }) => {
  const [activeTab, setActiveTab] = useState<Tab>('TOKENS');
  
  // Cooldown State
  const [cooldowns, setCooldowns] = useState<{ [key: string]: number }>({});
  const [now, setNow] = useState(Date.now());

  // Single Target State
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [lang, setLang] = useState('REACT');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncingComp, setIsSyncingComp] = useState(false);
  const [lastSyncedComp, setLastSyncedComp] = useState<Date | null>(null);
  
  // Tokens / CSS State
  const [isSyncingTokens, setIsSyncingTokens] = useState(false);
  
  // Dual Timestamp Logic for Tokens Tab
  const [lastGeneratedCssDate, setLastGeneratedCssDate] = useState<Date | null>(null);
  const [lastSyncedStorybookDate, setLastSyncedStorybookDate] = useState<Date | null>(null);
  
  const [tokenSyncSource, setTokenSyncSource] = useState<'Storybook' | 'GitHub' | 'Bitbucket' | null>(null);
  const [generatedCss, setGeneratedCss] = useState<string | null>(null);
  const [isGeneratingCss, setIsGeneratingCss] = useState(false);
  const [copiedCss, setCopiedCss] = useState(false);

  // JSON State
  const [generatedJson, setGeneratedJson] = useState<string | null>(null);
  const [isGeneratingJson, setIsGeneratingJson] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [lastGeneratedJsonDate, setLastGeneratedJsonDate] = useState<Date | null>(null);
  
  // Deep Sync State
  const [activeSyncTab, setActiveSyncTab] = useState<'SB' | 'GH' | 'BB'>('SB');
  const [isSbConnected, setIsSbConnected] = useState(false);
  const [isSyncScanning, setIsSyncScanning] = useState(false);
  const [syncItems, setSyncItems] = useState<typeof SYNC_ITEMS_MOCK>([]);
  const [hasSyncScanned, setHasSyncScanned] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastSyncAllDate, setLastSyncAllDate] = useState<Date | null>(null);
  const [expandedDriftId, setExpandedDriftId] = useState<string | null>(null);
  const [layerSelectionFeedback, setLayerSelectionFeedback] = useState<string | null>(null);

  const isPro = plan === 'PRO';
  const isAnnual = userTier === '1y';
  
  // Credit Limit Logic
  const limit = isPro 
    ? (userTier && TIER_LIMITS[userTier] ? TIER_LIMITS[userTier] : TIER_LIMITS['PRO']) 
    : TIER_LIMITS['FREE'];
    
  // Mocking previous usage for Pro to make it look realistic (450 used), Free starts at 0 + session usage
  const effectiveUsage = isPro ? 450 + usageCount : usageCount;
  const remaining = Math.max(0, limit - effectiveUsage);
  
  const canUseFeature = isPro || remaining > 0;
  const creditsDisplay = isPro ? `${limit - effectiveUsage}/${limit}` : `${remaining}/${limit}`;

  // Calculated State for Tokens Sync Status
  // If Storybook date is newer or equal to CSS/JSON date, we are synced.
  const isTokensSynced = lastSyncedStorybookDate && lastGeneratedCssDate && lastSyncedStorybookDate >= lastGeneratedCssDate;
  const isJsonSynced = lastSyncedStorybookDate && lastGeneratedJsonDate && lastSyncedStorybookDate >= lastGeneratedJsonDate;

  // Timer Tick
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getRemainingTime = (key: string) => {
    const end = cooldowns[key];
    if (!end || end < now) return null;
    const diff = Math.ceil((end - now) / 1000);
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startCooldown = (key: string) => {
    setCooldowns(prev => ({ ...prev, [key]: Date.now() + COOLDOWN_MS }));
  };

  const handleAction = (action: () => void, requiresCredit = false) => {
    if (!canUseFeature) {
      onUnlockRequest();
      return;
    }
    if (requiresCredit && !isPro) onUse();
    action();
  };

  const getTimeStamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --- MOCK GENERATORS ---
  const generateCodeString = () => {
    const ts = getTimeStamp();
    if (lang === 'CSS') return `/* Generated on ${ts} */\n.btn {\n  background: #ff90e8;\n  border: 2px solid #000;\n  padding: 8px 16px;\n  cursor: pointer;\n}`;
    if (lang === 'VUE') return `<!-- Generated on ${ts} -->\n<template>\n  <button class="btn">Click me</button>\n</template>`;
    if (lang === 'LIQUID') return `{% comment %} Generated on ${ts} {% endcomment %}\n{% render 'button', label: 'Click me', class: 'btn-primary' %}`;
    if (lang === 'STORYBOOK') return `// Generated on ${ts}\nimport type { Meta, StoryObj } from '@storybook/react';\nimport { Button } from './Button';\n\nconst meta: Meta<typeof Button> = {\n  component: Button,\n};\nexport default meta;\n\ntype Story = StoryObj<typeof Button>;\n\nexport const Primary: Story = {\n  args: {\n    primary: true,\n    label: 'Button',\n  },\n};`;
    return `// Generated on ${ts}\nexport const Button = () => (\n  <button className="bg-[#ff90e8] border-2 border-black p-2 hover:bg-[#ffc900] transition-all">\n    Click me\n  </button>\n);`;
  };

  const getRawCss = () => {
    return `/* Generated on ${getTimeStamp()} */\n:root {\n  --primary: #ff90e8;\n  --surface: #ffffff;\n  --border: 2px solid #000;\n}\n\n.component-base {\n  background: var(--primary);\n  border: var(--border);\n}`;
  };

  const getRawJson = () => {
    return JSON.stringify({
      meta: {
        generatedAt: getTimeStamp(),
        version: "1.0.0"
      },
      tokens: {
        colors: {
          primary: "#ff90e8",
          surface: "#ffffff",
          text: "#000000"
        },
        spacing: {
          sm: "4px",
          md: "8px",
          lg: "16px"
        },
        border: "2px solid #000"
      }
    }, null, 2);
  };

  // --- HANDLERS ---
  const handleGenerate = () => {
     handleAction(() => {
        setIsGenerating(true);
        // Generation always uses generic credits if not Pro
        if(!isPro) onUse();
        setTimeout(() => {
          setGeneratedCode(generateCodeString());
          setIsGenerating(false);
          // Reset sync if code changes
          setLastSyncedComp(null);
        }, 1500);
     });
  };

  const handleGenerateCss = () => {
    // Uses CSS Update Cooldown
    handleAction(() => {
      setIsGeneratingCss(true);
      if(!isPro) onUse();
      setTimeout(() => {
        setGeneratedCss(getRawCss());
        setIsGeneratingCss(false);
        // Update CSS Gen Date. This will make "Sync Storybook" active again if it was synced.
        setLastGeneratedCssDate(new Date()); 
        startCooldown('css_update');
      }, 1000);
    });
  };

  const handleGenerateJson = () => {
    handleAction(() => {
      setIsGeneratingJson(true);
      if(!isPro) onUse();
      setTimeout(() => {
        setGeneratedJson(getRawJson());
        setIsGeneratingJson(false);
        setLastGeneratedJsonDate(new Date());
        startCooldown('json_update');
      }, 1000);
    });
  };

  const handleCopy = () => { 
    setCopied(true); 
    navigator.clipboard.writeText(generatedCode || "");
    setTimeout(() => setCopied(false), 2000); 
  };

  const handleCopyCss = () => {
    setCopiedCss(true);
    navigator.clipboard.writeText(generatedCss || "");
    setTimeout(() => setCopiedCss(false), 2000);
  };

  const handleCopyJson = () => {
    setCopiedJson(true);
    navigator.clipboard.writeText(generatedJson || "");
    setTimeout(() => setCopiedJson(false), 2000);
  };
  
  const handleSyncComp = (target: 'SB' | 'GH' | 'BB') => {
    if (!isPro) {
      onUnlockRequest();
      return;
    }
    if (!selectedLayer) return;
    if (target === 'GH' || target === 'BB') return; 

    // Credit usage for sync
    if(!isAnnual) onUse(); 

    setIsSyncingComp(true);
    setTimeout(() => {
      setLastSyncedComp(new Date());
      setIsSyncingComp(false);
      startCooldown('comp_sync');
    }, 2000);
  };

  const handleTokenSync = (target: 'SB' | 'GH' | 'BB') => {
     if (!isPro) {
       onUnlockRequest();
       return;
     }
     
     if (target === 'GH' || target === 'BB') return;

     // Credit usage for sync
     if(!isAnnual) onUse();

     setIsSyncingTokens(true);
     setTimeout(() => {
       setLastSyncedStorybookDate(new Date());
       setTokenSyncSource(target === 'SB' ? 'Storybook' : target === 'GH' ? 'GitHub' : 'Bitbucket');
       setIsSyncingTokens(false);
       startCooldown('token_sync');
     }, 2000);
  };

  const handleSelectLayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLayerSelectionFeedback(id);
    setTimeout(() => setLayerSelectionFeedback(null), 2000);
  };

  // Sync Logic
  const handleConnectSb = () => {
    setIsSbConnected(true);
  };

  const handleSyncScan = () => {
    // Check Cooldown
    if (getRemainingTime('scan_sync')) return;

    if(!isAnnual) onUse(); // Uses credits

    setIsSyncScanning(true);
    setTimeout(() => {
      setIsSyncScanning(false);
      setSyncItems(SYNC_ITEMS_MOCK);
      setHasSyncScanned(true);
      startCooldown('scan_sync');
    }, 2000);
  };

  const handleSyncItem = (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setSyncItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSyncAll = () => {
    if(!isAnnual) onUse(); // Uses credits
    setSyncItems([]);
    setLastSyncAllDate(new Date());
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  return (
    <div data-component="Code: View Container" className="p-4 pb-24 flex flex-col gap-4">
      {showConfetti && <Confetti />}
      
      {/* Credit Banner */}
      <div className="flex justify-center mb-2">
        <div data-component="Code: Credit Banner" className={`transform -rotate-2 border-2 border-black px-3 py-1 text-[10px] font-black uppercase shadow-[3px_3px_0_0_#000] ${remaining === 0 && !isPro ? 'bg-red-100 text-red-600' : 'bg-[#ffc900] text-black'}`}>
          {isPro ? `Credits: ${creditsDisplay}` : `Free Credits Remaining: ${remaining}/${limit}`}
        </div>
      </div>

      {/* Tabs */}
      <div data-component="Code: Tab Bar" className="grid grid-cols-3 border-2 border-black bg-white shadow-[4px_4px_0_0_#000]">
        <button 
          onClick={() => setActiveTab('TOKENS')}
          data-component="Code: Tab Tokens"
          className={`py-2 text-[10px] font-black uppercase transition-colors ${activeTab === 'TOKENS' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
        >
          Tokens
        </button>
        <button 
          onClick={() => setActiveTab('TARGET')}
          data-component="Code: Tab Target"
          className={`py-2 text-[10px] font-black uppercase transition-colors border-l-2 border-black ${activeTab === 'TARGET' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
        >
          Target
        </button>
        <button 
          onClick={() => setActiveTab('SYNC')}
          data-component="Code: Tab Sync"
          className={`py-2 text-[10px] font-black uppercase transition-colors border-l-2 border-black ${activeTab === 'SYNC' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
        >
          Sync
        </button>
      </div>

      {/* TAB 1: CSS & TOKENS */}
      {activeTab === 'TOKENS' && (
        <div data-component="Code: Tokens Panel" className="flex flex-col gap-4 animate-in slide-in-from-left-2">
           <div data-component="Code: Tokens Info Alert" className="bg-white border-2 border-black p-3 text-[10px] font-medium leading-tight shadow-[4px_4px_0_0_#000]">
              <span data-component="Code: Info Title" className="font-bold uppercase block mb-1">⚠️ Crucial Step</span>
              <span data-component="Code: Info Body">You must copy/paste this code into your project's global stylesheet first. It defines the core variables required for individual components to work correctly.</span>
           </div>

           {/* SECTION 1: RAW CSS */}
           <div data-component="Code: Tokens Generator" className="flex flex-col gap-1 border-2 border-black bg-black p-4 text-white shadow-[4px_4px_0_0_#000]">
            <div className="flex justify-between items-start mb-2 border-b border-gray-700 pb-2">
                <label data-component="Code: Tokens Label" className="text-[10px] font-bold uppercase pl-1 inline-block w-fit px-1 text-[#ff90e8] self-end">Raw CSS & Tokens</label>
                <div className="flex flex-col items-end">
                    {lastGeneratedCssDate && (
                        <span data-component="Code: CSS Gen Date" className="text-[9px] font-mono text-gray-400">
                            CSS Generated: {lastGeneratedCssDate.toLocaleTimeString()}
                        </span>
                    )}
                    {lastSyncedStorybookDate && (
                        <span data-component="Code: SB Sync Date" className="text-[9px] font-mono text-[#ffc900]">
                            SB Synced: {lastSyncedStorybookDate.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>
            
            {!generatedCss ? (
              <button 
                  onClick={handleGenerateCss} 
                  data-component="Code: Generate CSS Button"
                  disabled={!!getRemainingTime('css_update') || isGeneratingCss}
                  className={`${BRUTAL.btn} bg-[${COLORS.primary}] text-black w-full flex justify-center items-center gap-2 relative mt-2 hover:bg-white hover:border-black disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {getRemainingTime('css_update') ? `Wait ${getRemainingTime('css_update')}` : (isGeneratingCss ? 'Updating...' : 'Generate CSS & Tokens')}
                  {!getRemainingTime('css_update') && <span className="absolute bottom-0.5 right-1 text-[8px] bg-black text-white px-1 font-bold rounded-sm">FREE</span>}
                </button>
            ) : (
              <div className="animate-in fade-in">
                <div data-component="Code: CSS Output Block" className="bg-[#1a1a1a] border border-gray-700 p-2 font-mono text-[9px] text-[#ffc900] h-32 overflow-y-auto mb-3 custom-scrollbar">
                  <pre>{generatedCss}</pre>
                </div>
                
                {/* CSS Actions */}
                <div className="flex flex-col gap-2">
                    <button data-component="Code: Copy CSS Button" className={`${BRUTAL.btn} w-full text-[10px] bg-white text-black border-white hover:bg-gray-200`} onClick={handleCopyCss}>
                      {copiedCss ? 'COPIED!' : 'Copy CSS'}
                    </button>
                    
                    <button 
                        onClick={handleGenerateCss} 
                        data-component="Code: Update CSS Button"
                        disabled={!!getRemainingTime('css_update') || isGeneratingCss}
                        className={`${BRUTAL.btn} bg-[${COLORS.primary}] text-black w-full flex justify-center items-center gap-2 relative hover:bg-white hover:border-black disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {getRemainingTime('css_update') ? `Wait ${getRemainingTime('css_update')}` : (isGeneratingCss ? 'Updating...' : 'Update CSS')}
                      {!getRemainingTime('css_update') && <span className="absolute bottom-0.5 right-1 text-[8px] bg-black text-white px-1 font-bold rounded-sm">FREE</span>}
                    </button>

                    <button 
                        className={`${BRUTAL.btn} w-full h-12 text-[10px] border-white relative disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2 ${
                            isTokensSynced 
                                ? 'bg-white text-gray-400 border-gray-300' 
                                : 'bg-transparent text-white hover:bg-white hover:text-black'
                        }`} 
                        onClick={() => handleTokenSync('SB')}
                        disabled={isSyncingTokens || !!getRemainingTime('token_sync') || isTokensSynced}
                    >
                        {isSyncingTokens ? 'Syncing...' : getRemainingTime('token_sync') ? `Wait ${getRemainingTime('token_sync')}` : isTokensSynced ? 'Synced (No Changes)' : lastSyncedStorybookDate ? 'Update Storybook' : 'Sync Storybook'}
                        {!getRemainingTime('token_sync') && !isTokensSynced && <span className="absolute bottom-0.5 right-1 text-[8px] bg-[#ff90e8] text-black px-1 font-bold rounded-sm">-10 Credits</span>}
                        {isTokensSynced && <span className="absolute bottom-0.5 right-1 text-[8px] bg-green-500 text-white px-1 font-bold rounded-sm">✓</span>}
                    </button>
                    
                    <button 
                        data-component="Code: Sync GitHub Button"
                        className={`${BRUTAL.btn} w-full h-12 text-[10px] bg-gray-800 text-gray-500 border-gray-600 relative cursor-not-allowed`} 
                        disabled={true}
                    >
                        Sync GitHub
                        <span className="absolute bottom-0.5 right-1 text-[8px] bg-white text-black px-1 font-bold rounded-sm">SOON</span>
                    </button>

                    <button 
                        data-component="Code: Sync Bitbucket Button"
                        className={`${BRUTAL.btn} w-full h-12 text-[10px] bg-gray-800 text-gray-500 border-gray-600 relative cursor-not-allowed`} 
                        disabled={true}
                    >
                        Sync Bitbucket
                        <span className="absolute bottom-0.5 right-1 text-[8px] bg-white text-black px-1 font-bold rounded-sm">SOON</span>
                    </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: JSON */}
          <div data-component="Code: JSON Generator" className="flex flex-col gap-1 border-2 border-black bg-black p-4 text-white shadow-[4px_4px_0_0_#000]">
            <div className="flex justify-between items-start mb-2 border-b border-gray-700 pb-2">
                <label data-component="Code: JSON Label" className="text-[10px] font-bold uppercase pl-1 inline-block w-fit px-1 text-[#ff90e8] self-end">JSON</label>
                <div className="flex flex-col items-end">
                    {lastGeneratedJsonDate && (
                        <span data-component="Code: JSON Gen Date" className="text-[9px] font-mono text-gray-400">
                            JSON Generated: {lastGeneratedJsonDate.toLocaleTimeString()}
                        </span>
                    )}
                    {lastSyncedStorybookDate && (
                        <span data-component="Code: SB Sync Date" className="text-[9px] font-mono text-[#ffc900]">
                            SB Synced: {lastSyncedStorybookDate.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>
            
            {!generatedJson ? (
              <button 
                  onClick={handleGenerateJson} 
                  data-component="Code: Generate JSON Button"
                  disabled={!!getRemainingTime('json_update') || isGeneratingJson}
                  className={`${BRUTAL.btn} bg-[${COLORS.primary}] text-black w-full flex justify-center items-center gap-2 relative mt-2 hover:bg-white hover:border-black disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {getRemainingTime('json_update') ? `Wait ${getRemainingTime('json_update')}` : (isGeneratingJson ? 'Generating...' : 'Generate JSON')}
                  {!getRemainingTime('json_update') && <span className="absolute bottom-0.5 right-1 text-[8px] bg-black text-white px-1 font-bold rounded-sm">FREE</span>}
                </button>
            ) : (
              <div className="animate-in fade-in">
                <div data-component="Code: JSON Output Block" className="bg-[#1a1a1a] border border-gray-700 p-2 font-mono text-[9px] text-[#ffc900] h-32 overflow-y-auto mb-3 custom-scrollbar">
                  <pre>{generatedJson}</pre>
                </div>
                
                {/* JSON Actions */}
                <div className="flex flex-col gap-2">
                    <button data-component="Code: Copy JSON Button" className={`${BRUTAL.btn} w-full text-[10px] bg-white text-black border-white hover:bg-gray-200`} onClick={handleCopyJson}>
                      {copiedJson ? 'COPIED!' : 'Copy JSON'}
                    </button>
                    
                    <button 
                        onClick={handleGenerateJson} 
                        data-component="Code: Update JSON Button"
                        disabled={!!getRemainingTime('json_update') || isGeneratingJson}
                        className={`${BRUTAL.btn} bg-[${COLORS.primary}] text-black w-full flex justify-center items-center gap-2 relative hover:bg-white hover:border-black disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {getRemainingTime('json_update') ? `Wait ${getRemainingTime('json_update')}` : (isGeneratingJson ? 'Updating...' : 'Update JSON')}
                      {!getRemainingTime('json_update') && <span className="absolute bottom-0.5 right-1 text-[8px] bg-black text-white px-1 font-bold rounded-sm">FREE</span>}
                    </button>

                    <button 
                        className={`${BRUTAL.btn} w-full h-12 text-[10px] border-white relative disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2 ${
                            isJsonSynced 
                                ? 'bg-white text-gray-400 border-gray-300' 
                                : 'bg-transparent text-white hover:bg-white hover:text-black'
                        }`} 
                        onClick={() => handleTokenSync('SB')}
                        disabled={isSyncingTokens || !!getRemainingTime('token_sync') || isJsonSynced}
                    >
                        {isSyncingTokens ? 'Syncing...' : getRemainingTime('token_sync') ? `Wait ${getRemainingTime('token_sync')}` : isJsonSynced ? 'Synced (No Changes)' : lastSyncedStorybookDate ? 'Update Storybook' : 'Sync Storybook'}
                        {!getRemainingTime('token_sync') && !isJsonSynced && <span className="absolute bottom-0.5 right-1 text-[8px] bg-[#ff90e8] text-black px-1 font-bold rounded-sm">-10 Credits</span>}
                        {isJsonSynced && <span className="absolute bottom-0.5 right-1 text-[8px] bg-green-500 text-white px-1 font-bold rounded-sm">✓</span>}
                    </button>
                    
                    <button 
                        data-component="Code: Sync GitHub Button"
                        className={`${BRUTAL.btn} w-full h-12 text-[10px] bg-gray-800 text-gray-500 border-gray-600 relative cursor-not-allowed`} 
                        disabled={true}
                    >
                        Sync GitHub
                        <span className="absolute bottom-0.5 right-1 text-[8px] bg-white text-black px-1 font-bold rounded-sm">SOON</span>
                    </button>

                    <button 
                        data-component="Code: Sync Bitbucket Button"
                        className={`${BRUTAL.btn} w-full h-12 text-[10px] bg-gray-800 text-gray-500 border-gray-600 relative cursor-not-allowed`} 
                        disabled={true}
                    >
                        Sync Bitbucket
                        <span className="absolute bottom-0.5 right-1 text-[8px] bg-white text-black px-1 font-bold rounded-sm">SOON</span>
                    </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SINGLE TARGET */}
      {activeTab === 'TARGET' && (
        <div data-component="Code: Target Panel" className="flex flex-col gap-4 animate-in slide-in-from-right-2">
          
          {/* Info Alert */}
          <div data-component="Code: Target Info Alert" className="bg-white border-2 border-black p-3 text-[10px] font-medium leading-tight shadow-[4px_4px_0_0_#000]">
              <span data-component="Code: Target Info Title" className="font-bold uppercase block mb-1">ℹ️ Workflow Info</span>
              <span data-component="Code: Target Info Body">
                1. <strong>Selected a Component?</strong> Sync to Storybook.<br/>
                2. <strong>Selected a Wireframe?</strong> Push to GitHub/Bitbucket.<br/>
                3. <strong>Selected a Prototype?</strong> Push to GitHub/Bitbucket.<br/>
                <span className="block mt-1 pt-1 border-t border-black/10 text-gray-600">
                    In all cases, you can generate and copy code directly.
                </span>
              </span>
          </div>

          {/* Layer Selection */}
          <div data-component="Code: Layer Selector Card" className={`${BRUTAL.card} bg-white py-3 flex flex-col gap-2`}>
            <div className="flex justify-between items-center">
              <span data-component="Code: Selector Label" className="text-xs font-bold uppercase">Target Layer</span>
              {/* In Prod, user must select in Figma canvas. We only offer deselect (clear state). */}
              {selectedLayer && (
                <button data-component="Code: Deselect Button" onClick={() => { setSelectedLayer(null); setGeneratedCode(null); setLastSyncedComp(null); }} className="text-[10px] font-bold bg-black text-white px-2 py-1">
                  Deselect
                </button>
              )}
            </div>
            {selectedLayer ? (
              <span data-component="Code: Selector Value" className="font-mono text-lg font-black text-black">{selectedLayer}</span>
            ) : (
              <span 
                data-component="Code: Selector Empty" 
                className="w-fit bg-red-100 text-red-600 border-2 border-red-600 px-3 py-2 font-black uppercase text-sm inline-block transform -rotate-1"
                onClick={() => setSelectedLayer("Button_Primary")} // Clickable in TEST for convenience
              >
                No Layer Selected (Click to Simulate)
              </span>
            )}
          </div>

          {selectedLayer && (
            <>
              {/* Code Generation - Wrapped in Blue Card */}
              <div data-component="Code: Gen Card" className={`${BRUTAL.card} bg-[#e0f2fe] border-black border-2 relative overflow-hidden flex flex-col gap-2 animate-in slide-in-from-top-2`}>
                <div className="flex justify-between items-start mb-1">
                    <h3 data-component="Code: Gen Title" className="font-black uppercase text-sm">Generate Code</h3>
                </div>
                
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold uppercase pl-1">Output Format</label>
                  <div className="relative w-1/2">
                    <select 
                      value={lang} 
                      onChange={(e) => { setLang(e.target.value); setGeneratedCode(null); }}
                      className={`${BRUTAL.input} appearance-none bg-white pr-8 text-[10px] font-bold uppercase py-1 h-8`}
                    >
                      {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none font-bold text-[8px]">▼</div>
                  </div>
                </div>

                {!generatedCode ? (
                  <button 
                    onClick={handleGenerate} 
                    className={`${BRUTAL.btn} bg-[${COLORS.primary}] text-black w-full flex justify-center items-center gap-2 relative`}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Code'}
                    <span className="absolute bottom-0.5 right-1 text-[8px] bg-black text-white px-1 font-bold rounded-sm">-40 Credits</span>
                  </button>
                ) : (
                  <div className="animate-in fade-in">
                    <div className={`${BRUTAL.card} font-mono text-[10px] bg-[#1a1a1a] text-gray-300 overflow-x-auto h-48 p-3 relative mb-2`}>
                      <div className="absolute top-2 right-2 text-[9px] text-gray-500 uppercase">{lang}</div>
                      <pre>{generatedCode}</pre>
                    </div>
                    <button onClick={handleCopy} className={`${BRUTAL.btn} bg-white w-full text-xs`}>
                      {copied ? 'COPIED!' : 'COPY CODE'}
                    </button>
                  </div>
                )}
              </div>

              {/* Component Sync Section (Storybook) */}
              <div data-component="Code: SB Sync Card" className={`${BRUTAL.card} bg-[#e0f2fe] border-black border-2 relative overflow-hidden animate-in slide-in-from-top-2`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <h3 className="font-black uppercase text-sm">Storybook Connect</h3>
                    <p className="text-[10px] text-gray-600">Sync this component.</p>
                  </div>
                  <div className="flex flex-col items-end">
                     {lastSyncedComp && (
                        <span className="text-[9px] font-mono text-gray-500 bg-white px-1 border border-black/10">
                            Synced: {lastSyncedComp.toLocaleTimeString()}
                        </span>
                     )}
                  </div>
                </div>

                <button 
                  onClick={() => handleSyncComp('SB')} 
                  disabled={isSyncingComp || !!getRemainingTime('comp_sync')}
                  className={`${BRUTAL.btn} w-full flex justify-center items-center gap-2 relative ${isSyncingComp || getRemainingTime('comp_sync') ? 'bg-gray-300 border-gray-400 text-gray-600' : `bg-[${COLORS.primary}]`}`}
                >
                  {isSyncingComp ? (
                    <span>Weaving connection...</span>
                  ) : getRemainingTime('comp_sync') ? (
                    <span>Wait {getRemainingTime('comp_sync')}</span>
                  ) : (
                    <>
                      <span className="text-lg">⚡</span>
                      <span>{lastSyncedComp ? 'Update Component' : 'Sync Component'}</span>
                    </>
                  )}
                  {(!getRemainingTime('comp_sync')) && <span className="absolute bottom-0.5 right-1 text-[8px] bg-black text-white px-1 font-bold rounded-sm">-40 Credits</span>}
                </button>
              </div>

              {/* GitHub Connect Section (Coming Soon) */}
              <div data-component="Code: GH Sync Card" className={`${BRUTAL.card} bg-gray-100 border-gray-400 border-2 border-dashed relative overflow-hidden animate-in slide-in-from-top-3 opacity-80`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <h3 className="font-black uppercase text-sm text-gray-600">GitHub Connect</h3>
                    <p className="text-[10px] text-gray-500">Push directly to repo.</p>
                  </div>
                  <span className="bg-black text-white text-[8px] px-2 py-0.5 font-bold uppercase">Coming Soon</span>
                </div>

                <button 
                  disabled={true}
                  className={`${BRUTAL.btn} w-full flex justify-center items-center gap-2 relative bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed`}
                >
                  <span className="text-lg">🐙</span>
                  <span>Push to GitHub</span>
                </button>

                <div className="flex justify-between mt-3 px-1">
                  <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                    <div className="w-10 h-5 bg-gray-300 rounded-full relative flex items-center px-0.5">
                       <div className="w-4 h-4 bg-gray-400 rounded-full shadow-sm"></div>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">AI Motion</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Auto Link</span>
                    <div className="w-10 h-5 bg-gray-300 rounded-full relative flex items-center px-0.5">
                       <div className="w-4 h-4 bg-gray-400 rounded-full shadow-sm"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bitbucket Connect Section (Coming Soon) */}
              <div data-component="Code: BB Sync Card" className={`${BRUTAL.card} bg-gray-100 border-gray-400 border-2 border-dashed relative overflow-hidden animate-in slide-in-from-top-3 opacity-80`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <h3 className="font-black uppercase text-sm text-gray-600">Bitbucket Connect</h3>
                    <p className="text-[10px] text-gray-500">Push directly to repo.</p>
                  </div>
                  <span className="bg-black text-white text-[8px] px-2 py-0.5 font-bold uppercase">Coming Soon</span>
                </div>

                <button 
                  disabled={true}
                  className={`${BRUTAL.btn} w-full flex justify-center items-center gap-2 relative bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed`}
                >
                  <span className="text-lg">⚓</span>
                  <span>Push to Bitbucket</span>
                </button>

                <div className="flex justify-between mt-3 px-1">
                  <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                    <div className="w-10 h-5 bg-gray-300 rounded-full relative flex items-center px-0.5">
                       <div className="w-4 h-4 bg-gray-400 rounded-full shadow-sm"></div>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">AI Motion</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Auto Link</span>
                    <div className="w-10 h-5 bg-gray-300 rounded-full relative flex items-center px-0.5">
                       <div className="w-4 h-4 bg-gray-400 rounded-full shadow-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: SYNCHRONIZE */}
      {activeTab === 'SYNC' && (
        <div data-component="Code: Deep Sync Panel" className={`${BRUTAL.card} relative overflow-hidden bg-white p-0 animate-in slide-in-from-right-2`}>
          <div className="p-3 border-b-2 border-black bg-black text-white flex justify-between items-center">
            <h3 className="font-bold uppercase text-xs">Deep Sync</h3>
          </div>

          {!isPro ? (
            <div className="p-6 text-center">
              <p className="text-xs font-medium text-gray-500 mb-4">
                Unlock Deep Sync to connect Storybook, GitHub & BitBucket and detect design drift automatically.
              </p>
              <button 
                onClick={onUnlockRequest} 
                className={`${BRUTAL.btn} w-full bg-[${COLORS.primary}] text-black relative flex justify-center items-center gap-2`}
              >
                Upgrade to Sync
                <span className="absolute bottom-0.5 right-1 text-[8px] bg-black text-white px-1 font-bold rounded-sm">PRO</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-3 border-b-2 border-black">
                <button 
                  onClick={() => setActiveSyncTab('SB')}
                  className={`py-2 text-[10px] font-bold uppercase transition-colors ${activeSyncTab === 'SB' ? 'bg-[#ff90e8] text-black' : 'bg-white hover:bg-gray-100'}`}
                >
                  Storybook
                </button>
                <button 
                  onClick={() => setActiveSyncTab('GH')}
                  className={`py-2 text-[10px] font-bold uppercase transition-colors border-l-2 border-black ${activeSyncTab === 'GH' ? 'bg-[#ff90e8] text-black' : 'bg-white hover:bg-gray-100'}`}
                >
                  GitHub
                </button>
                <button 
                  onClick={() => setActiveSyncTab('BB')}
                  className={`py-2 text-[10px] font-bold uppercase transition-colors border-l-2 border-black ${activeSyncTab === 'BB' ? 'bg-[#ff90e8] text-black' : 'bg-white hover:bg-gray-100'}`}
                >
                  Bitbucket
                </button>
              </div>

              {activeSyncTab === 'SB' && (
                <div className="p-4 animate-in slide-in-from-left-2">
                  {!isSbConnected ? (
                    <div className="text-center">
                      <p className="text-xs mb-3 font-medium">Connect your instance to audit code vs design.</p>
                      <button onClick={handleConnectSb} className={`${BRUTAL.btn} w-full bg-pink-100 hover:bg-pink-200`}>
                        Connect Storybook
                      </button>
                    </div>
                  ) : (
                    <div>
                      {!hasSyncScanned ? (
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 mb-2">Ready to inspect.</p>
                          <button 
                            onClick={handleSyncScan} 
                            disabled={isSyncScanning || !!getRemainingTime('scan_sync')}
                            className={`${BRUTAL.btn} w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 relative`}
                          >
                            {isSyncScanning ? 'Scanning Drift...' : getRemainingTime('scan_sync') ? `Wait ${getRemainingTime('scan_sync')}` : `Scan Project`}
                            {(!getRemainingTime('scan_sync')) && <span className="absolute bottom-0.5 right-1 text-[8px] bg-[#ff90e8] text-black px-1 font-bold rounded-sm">-15 Credits</span>}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-end mb-3">
                            <span className="text-xs font-bold uppercase">Drift Detected</span>
                            <span className="text-[10px] font-bold bg-[#ffc900] text-black px-1.5 py-0.5 rounded-sm border border-black">{syncItems.length} Violations</span>
                          </div>
                          
                          {syncItems.length === 0 ? (
                            <div className="text-center py-4 bg-green-50 border-2 border-green-200 border-dashed mb-4">
                              <span className="text-2xl block mb-1">🙌</span>
                              <span className="text-xs font-bold text-green-700 uppercase">Everything Synchronized</span>
                              {lastSyncAllDate && (
                                <span className="text-[9px] font-mono text-gray-400 block mt-1">
                                    Last synced: {lastSyncAllDate.toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2 mb-4 max-h-[220px] overflow-y-auto">
                              {syncItems.map(item => {
                                const isExpanded = expandedDriftId === item.id;
                                return (
                                  <div 
                                    key={item.id} 
                                    onClick={() => setExpandedDriftId(isExpanded ? null : item.id)}
                                    className={`${BRUTAL.card} p-3 transition-all ${isExpanded ? 'shadow-[6px_6px_0_0_#000] border-black' : 'bg-white hover:shadow-[6px_6px_0_0_#000] cursor-pointer'}`}
                                  >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[8px] bg-red-100 text-red-600 px-1 font-bold border border-red-200 uppercase">DRIFT</span>
                                                    <span className="font-bold text-xs">{item.name}</span>
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-mono">Last Edit: {item.lastEdited}</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold underline hover:text-[#ff90e8]">{isExpanded ? 'CLOSE' : 'VIEW'}</span>
                                    </div>

                                    {isExpanded && (
                                        <div className="mt-4 pt-3 border-t-2 border-dashed border-black animate-in slide-in-from-top-1">
                                            <p className="text-xs font-medium mb-4 leading-relaxed">
                                                Issue: {item.desc}.<br/>Action: Sync to resolve drift.
                                            </p>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => handleSelectLayer(item.id, e)}
                                                    className={`flex-1 border-2 border-black text-[10px] font-bold uppercase py-2 transition-colors ${layerSelectionFeedback === item.id ? 'bg-white text-black' : 'bg-white hover:bg-gray-100'}`}
                                                >
                                                    {layerSelectionFeedback === item.id ? 'SELECTED!' : 'Select Layer'}
                                                </button>
                                                <button 
                                                    onClick={(e) => handleSyncItem(item.id, e)}
                                                    className={`${BRUTAL.btn} flex-1 text-[10px] bg-[${COLORS.primary}] text-black hover:bg-white border-black relative h-12`}
                                                >
                                                    Sync Fix
                                                    <span className="absolute bottom-0.5 right-1 text-[8px] bg-black text-white px-1 font-bold rounded-sm">-5 Credits</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {syncItems.length > 0 && (
                            <button 
                                onClick={handleSyncAll} 
                                className={`${BRUTAL.btn} w-full bg-[${COLORS.primary}] text-black flex justify-center items-center gap-2 relative h-12`}
                            >
                              <span>Sync All</span>
                              <span className="absolute bottom-0.5 right-1 text-[8px] bg-black text-white px-1 font-bold rounded-sm border border-black">
                                 -{syncItems.length * 5} Credits
                              </span>
                            </button>
                          )}

                          {/* Rescan Button */}
                          {syncItems.length === 0 && (
                              <button 
                                onClick={handleSyncScan}
                                disabled={!!getRemainingTime('scan_sync')}
                                className="w-full bg-black text-white border-2 border-black h-12 px-4 text-xs font-bold uppercase hover:bg-gray-800 flex justify-between items-center shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] disabled:bg-gray-600 mt-2"
                              >
                                <span>{getRemainingTime('scan_sync') ? `Cooldown ${getRemainingTime('scan_sync')}` : 'Start New Scan'}</span>
                                {(!getRemainingTime('scan_sync')) && (
                                    <span className="text-[10px] bg-white text-black px-2 py-0.5 rounded-sm font-black">
                                       -5 Credits
                                    </span>
                                )}
                              </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeSyncTab === 'GH' && (
                <div className="p-6 text-center animate-in slide-in-from-right-2">
                  <p className="text-xs font-bold uppercase text-gray-400 mb-2">Integration In Progress</p>
                  <button disabled className={`${BRUTAL.btn} w-full bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed`}>
                    Connect GitHub (Soon)
                  </button>
                </div>
              )}

              {activeSyncTab === 'BB' && (
                <div className="p-6 text-center animate-in slide-in-from-right-2">
                  <p className="text-xs font-bold uppercase text-gray-400 mb-2">Integration In Progress</p>
                  <button disabled className={`${BRUTAL.btn} w-full bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed`}>
                    Connect Bitbucket (Soon)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
