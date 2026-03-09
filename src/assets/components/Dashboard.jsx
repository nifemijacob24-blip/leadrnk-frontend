import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';

// Helper to format timestamps into "12 mins ago"
const formatTimeAgo = (dateString) => {
  if (!dateString) return "just now";
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return Math.floor(seconds) + " seconds ago";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('feed');

  // --- Feed & Generation State ---
  const [leads, setLeads] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // AI Reply State
  const [generatingId, setGeneratingId] = useState(null);
  const [aiReplies, setAiReplies] = useState({});
  
  // AI Summary State
  const [summarizingId, setSummarizingId] = useState(null);
  const [postSummaries, setPostSummaries] = useState({});

  // Tracker State
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ keyword: '' }); 
  const [visibleCount, setVisibleCount] = useState(15);
  const [copiedId, setCopiedId] = useState(null);

  
  // --- UPGRADE MODAL STATE ---
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState('growth');

  // --- ANNOUNCEMENT BANNER STATE ---
  const ANNOUNCEMENTS = [
    "Remember to keep optimising your trackers for better results.",
    "Speed matters: Commenting early is an important factor for converting leads.",
    "Need help or feature requests? Reach out to us at jacob@sublurker.com"
  ];
  const [alertIndex, setAlertIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(true);

  // --- WEBHOOK & NOTIFICATION STATE ---
  const [webhookUrl, setWebhookUrl] = useState('');

  // Reset the browser tab title when the user looks at the page again
  useEffect(() => {
    const handleFocus = () => { document.title = "sublurker Dashboard"; };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Rotate the message every 6 seconds
  useEffect(() => {
    if (!showAlert) return;
    const interval = setInterval(() => {
      setAlertIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [showAlert]);

  // --- Settings State ---
  const [trackers, setTrackers] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Plan & Trial State ---
  const [agencyPlan, setAgencyPlan] = useState('freelancer');
  const [trialEndsAt, setTrialEndsAt] = useState(null);
  const [isPaidCustomer, setIsPaidCustomer] = useState(false);

  // --- Dynamic Calculations ---
  const maxTrackers = agencyPlan === 'growth' ? 40 : 20;
  const daysLeft = trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))) 
    : 0;
  
  // THE NEW LOCK: True if they haven't paid and their days hit 0
  const isTrialExpired = !isPaidCustomer && daysLeft === 0 && trialEndsAt !== null; 
  
  // Master lock for the premium AI feature
  const canUseAIPitch = isPaidCustomer;

  // Used purely for the UI button text
  const amountToCharge = selectedPlanToBuy === 'growth' ? 39 : 19; 

  // --- Fetch Data & Setup Real-time Listener ---
  useEffect(() => {
    let leadSubscription;

    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUser(user);
        
        const { data: agency } = await supabase
          .from('agencies')
          .select('plan, trial_ends_at, is_paid, webhook_url')
          .eq('id', user.id)
          .single();
          
        if (agency) {
          setAgencyPlan(agency.plan);
          setTrialEndsAt(agency.trial_ends_at);
          setIsPaidCustomer(agency.is_paid || false);
          setWebhookUrl(agency.webhook_url || ''); 
        }
        
        const { data: trackerData } = await supabase
          .from('trackers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (trackerData) setTrackers(trackerData);

        const { data: leadsData } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (leadsData) {
          // 🚨 FILTER OUT HIDDEN LEADS ON LOAD 🚨
          const unreadLeads = leadsData.filter(lead => lead.is_read !== true);
          setLeads(unreadLeads);
        }

        leadSubscription = supabase
          .channel('public:leads')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `user_id=eq.${user.id}` }, (payload) => {
            setLeads((currentLeads) => [payload.new, ...currentLeads]);
            
            // BROWSER PING ALERT
            document.title = "(1) New Lead! - sublurker";
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play();
            } catch (err) { console.log('Audio autoplay blocked by browser'); }
            
          })
          .subscribe();
      }
      setIsLoading(false);
    };

    fetchUserData();

    return () => {
      if (leadSubscription) supabase.removeChannel(leadSubscription);
    };
  }, []);

  // --- Handlers ---

  // 🚨 NEW: MARK AS READ HANDLER 🚨
  const handleMarkAsRead = async (leadId) => {
    // 1. Optimistically hide it from the UI instantly
    setLeads(currentLeads => currentLeads.filter(lead => lead.id !== leadId));
    
    // 2. Update it in Supabase silently
    try {
      await supabase.from('leads').update({ is_read: true }).eq('id', leadId);
    } catch (err) {
      console.error("Failed to hide lead:", err);
    }
  };

  const handleSaveWebhook = async () => {
    if (!currentUser) return;
    const { error } = await supabase.from('agencies').update({ webhook_url: webhookUrl }).eq('id', currentUser.id);
    if (!error) {
      alert("Webhook saved successfully! You will now receive alerts in your channel.");
    } else {
      alert("Failed to save webhook.");
    }
  };

  const handleAutoGenerate = async () => {
    if (!currentUser) return;
    setIsGenerating(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.post(`${apiUrl}/api/generate-trackers`, {
        userId: currentUser.id
      });
      
      if (response.data.success) {
        const { data: trackerData } = await supabase
          .from('trackers')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
        if (trackerData) setTrackers(trackerData);
      }
    } catch (err) {
      alert("Failed to generate trackers. Is your backend running?");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Summarize Post Handler
  const handleSummarizePost = async (lead) => {
    if (!currentUser) return;
    setSummarizingId(lead.id);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.post(`${apiUrl}/api/summarize-post`, {
        leadTitle: lead.title,
        leadBody: lead.body
      });
      
      if (response.data.success) {
        setPostSummaries(prev => ({
          ...prev,
          [lead.id]: response.data.summary
        }));
      }
    } catch (err) {
      alert("Failed to summarize post.");
      console.error(err);
    } finally {
      setSummarizingId(null);
    }
  };

  const handleGenerateAI = async (lead) => {
    if (!currentUser) return;

    if (!canUseAIPitch) {
      setShowUpgradeModal(true);
      return;
    }
    
    setGeneratingId(lead.id);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.post(`${apiUrl}/api/generate-reply`, {
        userId: currentUser.id,
        leadId: lead.id,
        leadTitle: lead.title,
        leadBody: lead.body
      });
      
      if (response.data.success) {
        setAiReplies(prev => ({
          ...prev,
          [lead.id]: response.data.reply
        }));
      }
    } catch (err) {
      alert("Failed to draft reply. Ensure backend is running.");
      console.error(err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate('/');
  };

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKeyword || !currentUser) return;
    if (trackers.length >= maxTrackers) return alert(`You've reached your limit of ${maxTrackers} trackers.`);
    
    const { data, error } = await supabase.from('trackers').insert([{ user_id: currentUser.id, keyword: newKeyword, subreddit: null }]).select();
    if (!error && data) { setTrackers([data[0], ...trackers]); setNewKeyword(''); }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); 
  };

  const handleCancelSubscription = () => {
    if (window.confirm("To cancel your subscription, please visit your Gumroad library or click 'Manage Membership' in your receipt email. Do you want to go to Gumroad now?")) {
      window.open('https://app.gumroad.com/library', '_blank');
    }
  };

  const handleDiscard = (id) => {
    const updatedReplies = { ...aiReplies };
    delete updatedReplies[id];
    setAiReplies(updatedReplies);
  };

  const startEditing = (tracker) => {
    setEditingId(tracker.id);
    setEditValues({ keyword: tracker.keyword || '' });
  };

  const saveEdit = async (id) => {
    const updatedData = { 
      keyword: editValues.keyword.trim() === '' ? null : editValues.keyword
    };
    const { error } = await supabase.from('trackers').update(updatedData).eq('id', id);
    if (!error) {
      setTrackers(trackers.map(t => t.id === id ? { ...t, ...updatedData } : t));
    } else {
      alert("Failed to update tracker.");
    }
    setEditingId(null);
  };

  const removeTracker = async (id) => {
    const { error } = await supabase.from('trackers').delete().eq('id', id);
    if (!error) setTrackers(trackers.filter(t => t.id !== id));
  };

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Loading Dashboard...</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      
      {/* --- UPGRADE OVERLAY MODAL --- */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 md:p-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Choose your plan</h3>
              <p className="text-slate-500 mb-6 leading-relaxed text-sm">
                Unlock the AI Reply Agent and keep your lead generation running on autopilot. Both plans include full AI access.
              </p>

              {/* PLAN SELECTION CARDS */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {/* Freelancer Option */}
                <div 
                  onClick={() => setSelectedPlanToBuy('freelancer')}
                  className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                    selectedPlanToBuy === 'freelancer' 
                      ? 'border-blue-600 bg-blue-50/50' 
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900">Freelancer</h4>
                    {selectedPlanToBuy === 'freelancer' && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    )}
                  </div>
                  <div className="text-2xl font-black text-slate-900 mb-2">$19<span className="text-xs text-slate-500 font-normal">/mo</span></div>
                  <p className="text-xs font-semibold text-slate-600">20 Trackers</p>
                </div>

                {/* Growth Option */}
                <div 
                  onClick={() => setSelectedPlanToBuy('growth')}
                  className={`border-2 rounded-2xl p-4 cursor-pointer transition-all relative ${
                    selectedPlanToBuy === 'growth' 
                      ? 'border-blue-600 bg-blue-50/50' 
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    Most Popular
                  </div>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900">Growth</h4>
                    {selectedPlanToBuy === 'growth' && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    )}
                  </div>
                  <div className="text-2xl font-black text-slate-900 mb-2">$39<span className="text-xs text-slate-500 font-normal">/mo</span></div>
                  <p className="text-xs font-semibold text-slate-600">40 Trackers</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <a
                  href={`https://pay.sublurker.com?userid=${currentUser?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition shadow-md block text-center"
                >
                  Pay ${amountToCharge} securely
                </a>

                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full text-slate-500 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6">
            <div className="text-2xl font-black text-white tracking-tighter cursor-pointer">
              sublurker<span className="text-blue-500">.</span>
            </div>
          </div>
          <nav className="mt-2 space-y-2 px-4">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'feed' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              <span>Lead Feed</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span>Settings & Billing</span>
            </button>
          </nav>
        </div>
        
        <div className="mt-auto">
          {/* Status Box */}
          <div className="px-4 mb-4">
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                {isPaidCustomer ? 'Subscription' : 'Trial Status'}
              </div>
              <div className="text-sm font-medium text-white flex justify-between">
                <span className="capitalize">{agencyPlan}</span>
                
                {isPaidCustomer ? (
                  <span className="text-blue-400">Active</span>
                ) : (
                  <span className={daysLeft > 0 ? "text-green-400" : "text-red-400"}>
                    {daysLeft > 0 ? `${daysLeft} Days Left` : 'Expired'}
                  </span>
                )}
              </div>
              
              {!isPaidCustomer && (
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="mt-3 w-full bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold py-2 rounded transition"
                >
                  Add Card to Keep Access
                </button>
              )}
            </div>
          </div>

          <div className="px-4 mb-6">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center">
          <div className="text-xl font-black text-slate-900">sublurker<span className="text-blue-600">.</span></div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setActiveTab('feed')} className={`px-3 py-1.5 text-sm font-semibold rounded ${activeTab === 'feed' ? 'bg-blue-100 text-blue-600' : 'text-slate-500'}`}>Feed</button>
            <button onClick={() => setActiveTab('settings')} className={`px-3 py-1.5 text-sm font-semibold rounded ${activeTab === 'settings' ? 'bg-blue-100 text-blue-600' : 'text-slate-500'}`}>Settings</button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">

          {/* --- ROTATING ANNOUNCEMENT BANNER --- */}
          {showAlert && (
            <div className="max-w-4xl mx-auto mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 shadow-md flex items-center justify-between text-white relative overflow-hidden">
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/20 p-2.5 rounded-xl shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                </div>
                <p className="font-medium text-sm md:text-base tracking-wide" key={alertIndex}>
                  <span className="font-bold mr-2 text-blue-200">Tip:</span> 
                  {ANNOUNCEMENTS[alertIndex]}
                </p>
              </div>
              <button 
                onClick={() => setShowAlert(false)} 
                className="text-white/60 hover:text-white relative z-10 transition shrink-0 ml-4 bg-white/10 hover:bg-white/20 p-1.5 rounded-lg"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>
          )}
          
          {/* --- LEAD FEED VIEW --- */}
          {activeTab === 'feed' && (
            <div className="max-w-4xl mx-auto">
              
              {isTrialExpired ? (
                <div className="bg-white border border-red-200 rounded-3xl p-10 text-center shadow-sm mb-8 mt-10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                  <div className="mx-auto w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  </div>
                  <h2 className="text-3xl font-black mb-4 text-slate-900 tracking-tight">Your free trial has expired</h2>
                  <p className="text-slate-500 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                    Your background bots have been paused and your lead feed is locked. Activate your subscription to instantly turn your automated lead engine back on.
                  </p>
                  <button 
                    onClick={() => setShowUpgradeModal(true)} 
                    className="bg-red-600 hover:bg-red-700 text-white text-lg font-bold py-4 px-10 rounded-xl transition shadow-lg shadow-red-500/30"
                  >
                    Activate Subscription Now
                  </button>
                </div>
              ) : (
                <>
                  {trackers.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm mb-8 mt-10">
                      <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      </div>
                      <h2 className="text-2xl font-black mb-3 text-slate-900">Your radar is empty</h2>
                      <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                        Let our AI scan your website and automatically generate the perfect keywords to monitor for your specific niche.
                      </p>
                      <button 
                        onClick={handleAutoGenerate} 
                        disabled={isGenerating}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl transition disabled:opacity-50 shadow-md shadow-blue-500/20"
                      >
                        {isGenerating ? 'Scanning your site & generating...' : 'Generate AI Trackers'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                          <h1 className="text-3xl font-extrabold text-slate-900">Live Feed</h1>
                          <p className="text-slate-500 mt-1">Found {leads.length} high-intent leads.</p>
                        </div>
                        <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold border border-green-200">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          <span>Polling Active</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {leads.length === 0 ? (
                          <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-2xl">
                            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            <p className="text-slate-500 font-medium text-lg">Running historical deep scan...</p>
                            <p className="text-slate-400 text-sm mt-1">Leads will appear here automatically.</p>
                          </div>
                        ) : (
                          <>
                            {leads.slice(0, visibleCount).map((lead) => (
                              <div key={lead.id} className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-md transition group">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                                    <span className="font-bold text-slate-800">{lead.subreddit}</span>
                                    <span>•</span>
                                    <span>{formatTimeAgo(lead.posted_at || lead.created_at)}</span>
                                  </div>
                                  
                                  {/* 🚨 NEW: BADGE AND HIDE BUTTON COMBINED 🚨 */}
                                  <div className="flex items-center gap-2">
                                    <span className="bg-blue-50 text-blue-700 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100 uppercase tracking-wide">
                                      High Intent Match
                                    </span>
                                    <button 
                                      onClick={() => handleMarkAsRead(lead.id)}
                                      className="text-slate-300 hover:text-slate-600 transition p-1 hover:bg-slate-100 rounded-md opacity-50 group-hover:opacity-100"
                                      title="Hide this lead"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                  </div>
                                </div>
                                
                                <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-2">{lead.title}</h2>
                                <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-4 line-clamp-3">{lead.body}</p>                            
                                
                                {/* --- THE AI SUMMARY HIGHLIGHT BOX --- */}
                                {postSummaries[lead.id] && (
                                  <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-900 leading-relaxed">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                      <span className="font-bold text-indigo-800 uppercase tracking-wider text-xs">AI Summary</span>
                                    </div>
                                    <p className="font-medium">{postSummaries[lead.id]}</p>
                                  </div>
                                )}

                                {aiReplies[lead.id] && (
                                  <div className="mb-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4 transition-all">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                      <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">AI Drafted Reply</span>
                                    </div>
                                    <textarea 
                                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                      rows="4"
                                      value={aiReplies[lead.id]}
                                      onChange={(e) => setAiReplies({ ...aiReplies, [lead.id]: e.target.value })}
                                    ></textarea>
                                    <div className="flex justify-end mt-2 space-x-3">
                                      <button 
                                        onClick={() => handleDiscard(lead.id)}
                                        className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                                      >
                                        Discard
                                      </button>
                                      <button 
                                        onClick={() => handleCopy(lead.id, aiReplies[lead.id])}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                                          copiedId === lead.id 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-slate-900 text-white hover:bg-slate-800'
                                        }`}
                                      >
                                        {copiedId === lead.id ? 'Copied!' : 'Copy'}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* ACTION BUTTONS STACK ON MOBILE */}
                                <div className="flex flex-col sm:flex-row flex-wrap gap-3 border-t border-slate-100 pt-4">
                                  <a 
                                    href={lead.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white border-2 border-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-lg hover:bg-slate-50 transition"
                                  >
                                    <svg className="w-5 h-5 text-[#FF4500]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.56 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.562-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-2.46 3.655c-1.644 0-2.887.674-2.924.694-.15.086-.2.28-.112.43.088.15.28.2.43.111.014-.008 1.127-.585 2.606-.585 1.464 0 2.56.565 2.585.578.149.091.344.043.435-.106.09-.15.042-.345-.107-.435-.045-.028-1.266-.687-2.912-.687z"/></svg>
                                    <span>View on Reddit</span>
                                  </a>
                                  
                                  {/* THE NEW SUMMARIZE BUTTON */}
                                  {!postSummaries[lead.id] && (
                                    <button 
                                      onClick={() => handleSummarizePost(lead)}
                                      disabled={summarizingId === lead.id}
                                      className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-6 py-2.5 rounded-lg hover:bg-indigo-100 transition"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                      <span>{summarizingId === lead.id ? 'Summarizing...' : 'Summarize Post'}</span>
                                    </button>
                                  )}

                                  {!aiReplies[lead.id] && (
                                    <button 
                                      onClick={() => handleGenerateAI(lead)}
                                      disabled={generatingId === lead.id}
                                      className={`w-full sm:w-auto flex items-center justify-center space-x-2 font-bold px-6 py-2.5 rounded-lg transition border ${
                                        canUseAIPitch 
                                          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                      }`}
                                    >
                                      {!canUseAIPitch && (
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                                      )}
                                      <span>{generatingId === lead.id ? 'Drafting...' : (canUseAIPitch ? 'Generate AI Pitch' : 'Unlock AI Pitch')}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}

                            {visibleCount < leads.length && (
                              <div className="pt-4 pb-10 flex justify-center">
                                <button 
                                  onClick={() => setVisibleCount(prev => prev + 15)}
                                  className="bg-white border-2 border-slate-200 text-slate-700 font-bold px-8 py-3 rounded-xl hover:bg-slate-50 transition hover:shadow-sm"
                                >
                                  Load Older Leads
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* --- SETTINGS VIEW --- */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8">
              
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">Account Settings</h1>
                <p className="text-sm md:text-base text-slate-500">Manage your subscription, trackers, and alert preferences.</p>
              </div>

              {/* 1. Billing Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-900">Subscription</h2>
                  
                  {isPaidCustomer ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-700">
                      Active
                    </span>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${daysLeft > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {daysLeft > 0 ? 'Trial Active' : 'Trial Expired'}
                    </span>
                  )}
                </div>
                <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 capitalize">{agencyPlan} Plan</h3>
                    <p className="text-sm text-slate-500 mt-1">Real-time alerts, {maxTrackers} keywords, and AI Reply Agent.</p>
                    
                    {!isPaidCustomer && (
                      daysLeft > 0 ? (
                        <p className="text-sm text-orange-600 font-medium mt-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Your free trial expires in {daysLeft} day{daysLeft > 1 ? 's' : ''}.
                        </p>
                      ) : (
                        <p className="text-sm text-red-600 font-bold mt-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                          Trial has expired. Add a card to keep finding leads.
                        </p>
                      )
                    )}

                  </div>
                  
                  {isPaidCustomer ? (
                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                      <button className="w-full sm:w-auto bg-green-100 text-green-700 font-bold px-6 py-2.5 rounded-lg border border-green-200 cursor-default">
                        Active {agencyPlan === 'growth' ? 'Growth' : 'Freelancer'} Plan
                      </button>
                      <button 
                        onClick={handleCancelSubscription}
                        className="text-xs font-bold text-slate-400 hover:text-red-500 transition underline underline-offset-2"
                      >
                        Cancel Subscription
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full sm:w-auto bg-blue-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md"
                    >
                      Activate Subscription
                    </button>
                  )}

                </div>
              </div>

              {/* 2. Trackers Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Active Keyword Trackers</h2>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">We actively search our master list of 100+ business subreddits for these keywords.</p>
                  </div>
                  <div className={`text-xs font-bold px-3 py-1 rounded-md whitespace-nowrap ${trackers.length >= maxTrackers ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                    {trackers.length} / {maxTrackers} Used
                  </div>
                </div>
                
                <div className="p-4 md:p-6">
                  
                  {/* 🚨 OVER-LIMIT WARNING BANNER 🚨 */}
                  {trackers.length > maxTrackers && (
                    <div className="mb-6 bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl text-sm leading-relaxed flex items-start gap-3">
                      <svg className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      <div>
                        <p className="font-bold mb-1">You are over your tracker limit.</p>
                        <p>Your Freelancer plan allows {maxTrackers} trackers, but you have {trackers.length}. The bottom {trackers.length - maxTrackers} trackers have been paused. Delete older trackers to make room, or upgrade to the Growth plan to reactivate them all!</p>
                      </div>
                    </div>
                  )}
                  
                  {/* FULL WIDTH KEYWORD INPUT */}
                  <div className="mb-8">
                    <form onSubmit={handleAddKeyword} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Add a new keyword to track</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                          type="text" required disabled={trackers.length >= maxTrackers}
                          placeholder="e.g., 'need a developer'" 
                          value={newKeyword} onChange={e => setNewKeyword(e.target.value)}
                          className="flex-1 w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 text-sm disabled:bg-slate-100"
                        />
                        <button type="submit" disabled={trackers.length >= maxTrackers} className="w-full sm:w-auto bg-slate-900 text-white font-bold px-8 py-3 rounded-lg hover:bg-slate-800 transition disabled:bg-slate-300">
                          Add
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Keyword Phrase</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[120px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100 text-sm">
                        {trackers.map((tracker, index) => {
                          const isEditing = editingId === tracker.id;
                          const isPaused = index >= maxTrackers;

                          return (
                            <tr key={tracker.id} className={`transition ${isPaused ? 'opacity-50 bg-slate-50' : 'hover:bg-slate-50'}`}>
                              <td className="px-4 py-4 whitespace-nowrap text-slate-900 font-semibold">
                                <div className="flex items-center">
                                  {isPaused && (
                                    <span className="mr-3 bg-slate-200 text-slate-500 text-[10px] font-black uppercase px-2 py-0.5 rounded cursor-help" title="Upgrade to Growth to reactivate">
                                      Paused
                                    </span>
                                  )}
                                  
                                  {isEditing ? (
                                    <input 
                                      type="text" 
                                      placeholder="Any keyword"
                                      value={editValues.keyword}
                                      onChange={e => setEditValues({...editValues, keyword: e.target.value})}
                                      className="border border-blue-400 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 w-full"
                                    />
                                  ) : (
                                    `"${tracker.keyword}"`
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right font-medium">
                                {isEditing ? (
                                  <div className="flex justify-end gap-3">
                                    <button onClick={() => saveEdit(tracker.id)} className="text-green-600 hover:text-green-700 font-bold transition">Save</button>
                                    <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-700 transition">Cancel</button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end gap-3">
                                    <button onClick={() => startEditing(tracker)} className="text-blue-500 hover:text-blue-700 transition">Edit</button>
                                    <button onClick={() => removeTracker(tracker.id)} className="text-red-500 hover:text-red-700 transition">Delete</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {trackers.length === 0 && (
                          <tr>
                            <td colSpan="2" className="px-4 py-8 text-center text-slate-500">No active trackers. Add one above to start finding leads.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>

              {/* 3. Alert Preferences (Webhooks) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900">Alert Preferences</h2>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">Receive an instant Slack or Discord message when we find a high-intent lead.</p>
                </div>
                <div className="p-5 md:p-6 bg-slate-50">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Discord / Slack Webhook URL</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="url" 
                      placeholder="https://hooks.slack.com/... or https://discord.com/api/webhooks/..." 
                      value={webhookUrl} 
                      onChange={e => setWebhookUrl(e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 text-sm"
                    />
                    <button 
                      onClick={handleSaveWebhook}
                      className="w-full sm:w-auto bg-slate-900 text-white font-bold px-6 py-3 rounded-lg hover:bg-slate-800 transition whitespace-nowrap"
                    >
                      Save Webhook
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Paste your channel webhook URL here. We will send a secure link directing you straight to your dashboard to generate the AI pitch.
                  </p>
                </div>
              </div>

              {/* Mobile Logout */}
              <div className="md:hidden bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden mb-8">
                <div className="p-5 flex justify-between items-center">
                  <h2 className="text-base font-bold text-slate-900">Sign Out</h2>
                  <button onClick={handleLogout} className="bg-red-50 text-red-600 font-bold px-4 py-2 rounded-lg hover:bg-red-100 transition shadow-sm border border-red-200 text-sm">
                    Log Out
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;