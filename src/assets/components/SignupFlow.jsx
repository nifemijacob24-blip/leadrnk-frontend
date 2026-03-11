import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; 

const SignupFlow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('leadrnk_temp_form');
    if (savedData) return JSON.parse(savedData);
    return location.state?.leadData || { domain: '', competitor1: '', competitor2: '', description: '', webhook_url: '' };
  });
  
  const [step, setStep] = useState(1);
  const [isActivating, setIsActivating] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let isInitialized = false; 

    const checkUserStatus = async (session) => {
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (agency) {
        navigate('/dashboard');
      } else {
        setStep(2);
      }
      setLoadingSession(false);
    };

    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await checkUserStatus(session);
      } else {
        setLoadingSession(false);
      }
      isInitialized = true; 
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && !isInitialized) {
        await checkUserStatus(session);
        isInitialized = true;
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleAuth = async () => {
    localStorage.setItem('leadrnk_temp_form', JSON.stringify(formData));

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding` 
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with Google:', error.message);
      alert('Failed to authenticate. Please try again.');
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setIsSaving(true); 
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Session expired. Please log in again.");
      setStep(1);
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from('agencies')
      .upsert({
        id: user.id,
        email: user.email, // 🚨 CAPTURES THEIR EMAIL FOR RESEND ALERTS!
        domain: formData.domain,
        competitor1: formData.competitor1,
        competitor2: formData.competitor2,
        description: formData.description,
        webhook_url: formData.webhook_url 
      });

    if (error) {
      console.error('Error saving agency data:', error.message);
      alert('Failed to save details. Please try again.');
      setIsSaving(false);
      return;
    }

    localStorage.removeItem('leadrnk_temp_form');
    setStep(3);
    setIsSaving(false);
  };

  if (loadingSession) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">Loading session...</div>;
  }

  const handleStartTrial = async () => {
    setIsActivating(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Session expired. Please log in again.");
      setStep(1);
      setIsActivating(false);
      return;
    }

    const { error } = await supabase
      .from('agencies')
      .update({ plan: 'growth' })
      .eq('id', user.id);

    if (error) {
      console.error('Error saving plan:', error.message);
      alert('Failed to activate plan. Please try again.');
      setIsActivating(false);
      return;
    }

    try {
      // 🚨 FIXED TYPO HERE (Removed the '1' from generate-trackers)
      await fetch(`${import.meta.env.VITE_API_URL}/api/generate-trackers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      });
    } catch (err) {
      console.error("AI Generation failed or skipped:", err);
    }

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="text-3xl font-black text-slate-900 tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
          sublurker<span className="text-blue-600">.</span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-200">
          
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-100 -z-10"></div>
            <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 -z-10 ${step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'}`}></div>
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
          </div>

          {/* STEP 1: Google Auth */}
          {step === 1 && (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2">Save your custom lead feed</h2>
              <p className="text-slate-500 mb-8">Create an account to lock in your keywords and start tracking.</p>
              
              <button 
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
          )}

          {/* STEP 2: Confirm Agency Details */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2 text-center">Confirm your targeting</h2>
              <p className="text-slate-500 mb-6 text-center">We use this to auto-generate your first Reddit keyword trackers.</p>
              
              <form onSubmit={handleSaveDetails} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Agency Domain (e.g leadrnk.com)</label>
                  <input type="text" required value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Competitor 1</label>
                    <input type="text" value={formData.competitor1} onChange={e => setFormData({...formData, competitor1: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Competitor 2</label>
                    <input type="text" value={formData.competitor2} onChange={e => setFormData({...formData, competitor2: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Your Pitch (Be very specific on what you sell and who you sell to)</label>
                  <textarea rows="3" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500"></textarea>
                </div>
                
                {/* WEBHOOK FIELD */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Slack / Discord Webhook URL <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="url" 
                    placeholder="https://hooks.slack.com/..." 
                    value={formData.webhook_url} 
                    onChange={e => setFormData({...formData, webhook_url: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500" 
                  />
                  <p className="text-xs text-slate-500 mt-1.5">Get instant alerts in your team's channel the second we find a high-intent lead.</p>
                </div>

                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-lg hover:bg-slate-800 transition shadow-md mt-4 disabled:bg-slate-400"
                >
                  {isSaving ? 'Saving...' : 'Save & Continue \u2192'}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: Automated Trial Confirmation */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-6">
                <div className="bg-green-100 text-green-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Your feed is ready.</h2>
                <p className="text-slate-500">No credit card required to start tracking.</p>
              </div>

              <div className="bg-slate-900 border-2 border-slate-900 rounded-xl p-6 shadow-lg relative flex flex-col justify-between max-w-sm mx-auto mb-6">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                  Full Access Unlocked
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-white text-lg">Agency Growth Trial</h3>
                  <div className="text-3xl font-black text-white mt-2 mb-2">$0<span className="text-sm text-slate-400 font-normal"> for 24 hours</span></div>
                  <div className="text-sm text-slate-400 mb-6">Then $39/mo</div>
                  <ul className="text-sm text-slate-300 space-y-3 mb-8 text-left max-w-[200px] mx-auto">
                    <li className="flex items-center gap-2">✓ 40 Active Trackers</li>
                    <li className="flex items-center gap-2">✓ Real-time Alerts</li>
                    <li className="flex items-center gap-2">✓ AI Reply Agent</li>
                  </ul>
                </div>
                <button 
                  onClick={handleStartTrial}
                  disabled={isActivating}
                  className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 transition shadow-lg flex justify-center items-center gap-2 disabled:bg-blue-400"
                >
                  {isActivating ? 'Activating...' : 'Enter Dashboard \u2192'}
                </button>
              </div>
              <p className="text-xs text-center text-slate-400">Downgrade to Freelancer or cancel anytime.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SignupFlow;