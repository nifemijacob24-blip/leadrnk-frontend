import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeAgencyType, setActiveAgencyType] = useState('seo');
  
  const [heroForm, setHeroForm] = useState({
    domain: '',
    competitor1: '',
    competitor2: '',
    description: ''
  });

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    navigate('/onboarding', { state: { leadData: heroForm } });
  };

  const handleStandardSignup = () => {
    // Navigates to onboarding without pre-filled hero data
    navigate('/onboarding');
  };

  const agencyTypes = [
    { id: 'seo', label: 'SEO' },
    { id: 'webdev', label: 'Web Dev' },
    { id: 'content', label: 'Content' },
    { id: 'ads', label: 'Paid Ads' },
    { id: 'pr', label: 'PR' },
    { id: 'appdev', label: 'App Dev' }
  ];

  const leadExamples = {
    seo: [
      {
        title: "Looking for an SEO agency that actually delivers B2B results",
        subreddit: "r/SaaS", time: "14 minutes ago",
        text: "We just launched our new product but organic traffic is flat. We need an agency that understands programmatic SEO and account-based marketing. Budget is $3k-$5k/mo."
      },
      {
        title: "Our organic traffic dropped 40% after the core update",
        subreddit: "r/TechSEO", time: "1 hour ago",
        text: "Looking for an expert or agency to do a deep technical audit. We think it's an intent mismatch issue but need a pro to look at our search console data ASAP."
      },
      {
        title: "Best link building services that aren't spammy?",
        subreddit: "r/marketing", time: "3 hours ago",
        text: "Tired of agencies buying links on PBNs. We have a solid SaaS product and need white-hat outreach to authoritative sites in the MarTech space."
      },
      {
        title: "Need help scaling programmatic SEO for a local directory",
        subreddit: "r/Entrepreneur", time: "5 hours ago",
        text: "We have the data, but I need an SEO agency to help structure the URL hierarchy and template tags so we don't cannibalize our own keywords."
      }
    ],
    webdev: [
      {
        title: "Need a React/Tailwind team to rebuild our landing page",
        subreddit: "r/startups", time: "8 minutes ago",
        text: "Our current site is a mess and conversions are dropping. Looking for a web dev agency to completely overhaul our front-end. We have the Figma files ready to go."
      },
      {
        title: "Migrating from WordPress to Headless Shopify - Recommendations?",
        subreddit: "r/ecommerce", time: "42 minutes ago",
        text: "We are doing $150k/mo and our current WP setup is too slow. Need an experienced dev agency to move us to a headless architecture."
      },
      {
        title: "Looking for Webflow experts for an enterprise site",
        subreddit: "r/Webflow", time: "2 hours ago",
        text: "We are moving off our custom CMS to Webflow. Need an agency that understands advanced CMS collections, Finsweet attributes, and complex animations."
      },
      {
        title: "Site speed is killing our conversions",
        subreddit: "r/smallbusiness", time: "4 hours ago",
        text: "Google PageSpeed Insights is showing red across the board. Need a dev to optimize our site architecture and clean up our javascript."
      }
    ],
    content: [
      {
        title: "Who handles your TikTok & short-form video marketing?",
        subreddit: "r/marketing", time: "22 minutes ago",
        text: "Trying to scale our brand awareness but our internal team doesn't have the bandwidth for video. Need an agency to take over our TikTok and Reels strategy."
      },
      {
        title: "Looking for a B2B ghostwriter for LinkedIn",
        subreddit: "r/SaaS", time: "1.5 hours ago",
        text: "I'm the founder of a fintech startup and I have zero time to post. I need a content agency that can interview me for 30 mins a week and turn it into daily LI posts."
      },
      {
        title: "Need a technical copywriter for developer tools",
        subreddit: "r/devops", time: "3 hours ago",
        text: "We sell to engineers. Standard marketing copy doesn't work. Need a content agency that actually understands APIs, Kubernetes, and developer pain points."
      },
      {
        title: "How do you scale newsletter growth?",
        subreddit: "r/newsletters", time: "5 hours ago",
        text: "We have great content but only 500 subs. Looking to hire a growth content agency to run cross-promos and set up a solid lead magnet strategy."
      }
    ],
    ads: [
      {
        title: "Facebook Ads ROAS has tanked this week",
        subreddit: "r/FacebookAds", time: "12 minutes ago",
        text: "Our CPA went from $20 to $65 overnight. Anyone running an ad agency taking on new e-com clients? We need fresh creative testing and a new account structure."
      },
      {
        title: "Need a Google Ads expert for B2B lead gen",
        subreddit: "r/PPC", time: "45 minutes ago",
        text: "We are burning cash on broad match terms. Need an agency that specializes in high-ticket B2B search intent and exact match scaling."
      },
      {
        title: "Looking to scale TikTok ads past $1k/day",
        subreddit: "r/marketing", time: "2 hours ago",
        text: "We've hit a wall with our in-house media buying. Looking for a performance agency that has a vast UGC creator network to keep ad fatigue low."
      },
      {
        title: "Best agency for LinkedIn Ads?",
        subreddit: "r/B2BMarketing", time: "4 hours ago",
        text: "Our LTV is high enough to justify LI ads, but we are paying $15 a click for garbage leads. Need someone to overhaul our targeting."
      }
    ],
    pr: [
      {
        title: "How do we get featured in TechCrunch?",
        subreddit: "r/startups", time: "30 minutes ago",
        text: "We just closed our Seed round and want to make a splash. Looking for a tech-focused PR agency that has actual relationships with journalists, not just newswire syndication."
      },
      {
        title: "Crisis communication help needed ASAP",
        subreddit: "r/PublicRelations", time: "1 hour ago",
        text: "Our SaaS had a massive data breach over the weekend. We need a PR firm to help draft our public response and manage the fallout with enterprise clients."
      },
      {
        title: "Looking for PR agency for an indie game launch",
        subreddit: "r/gamedev", time: "3 hours ago",
        text: "Game is launching in 2 months. Need an agency to handle getting review codes to streamers, IGN, Kotaku, and managing the press kit."
      },
      {
        title: "Do press releases actually work for SEO?",
        subreddit: "r/Entrepreneur", time: "6 hours ago",
        text: "Considering hiring a PR agency to distribute news about our recent merger. Does anyone have a firm they recommend that gets actual tier-1 placements?"
      }
    ],
    appdev: [
      {
        title: "Looking for a React Native agency for MVP",
        subreddit: "r/reactnative", time: "18 minutes ago",
        text: "We have the designs finished. Need an agency to build out the front-end and integrate with our Firebase backend. iOS and Android needed."
      },
      {
        title: "Flutter vs Swift for a fintech app?",
        subreddit: "r/iOSProgramming", time: "1.5 hours ago",
        text: "We are debating the tech stack. If we go native, we need to hire an iOS specific agency. Any recommendations for agencies that specialize in secure financial apps?"
      },
      {
        title: "App rejected from App Store, need rescue agency",
        subreddit: "r/appdev", time: "4 hours ago",
        text: "Apple flagged us for guideline 4.3. Our current freelance dev disappeared. Need a professional agency to step in, fix the codebase, and get us approved."
      },
      {
        title: "Need help with App Store Optimization (ASO)",
        subreddit: "r/mobilemarketing", time: "7 hours ago",
        text: "Our app is built but we are getting zero organic downloads. Looking for an agency that handles screenshot design, keyword research, and review generation."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-2xl font-black text-slate-900 tracking-tighter">
          Leadrnk<span className="text-blue-600">.</span>
        </div>
        <div className="hidden md:flex space-x-8 font-medium text-slate-600">
          <a href="#how-it-works" className="hover:text-slate-900 transition">How it Works</a>
          <a href="#use-cases" className="hover:text-slate-900 transition">Use Cases</a>
          <a href="#pricing" className="hover:text-slate-900 transition">Pricing</a>
          <a href="#faq" className="hover:text-slate-900 transition">FAQ</a>
        </div>
        {/* Updated Navbar Buttons */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleStandardSignup} 
            className="text-slate-600 font-medium hover:text-slate-900 text-sm md:text-base"
          >
            Login
          </button>
          <button 
            onClick={handleStandardSignup}
            className="bg-slate-900 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-sm md:text-base font-medium hover:bg-slate-800 transition shadow-md whitespace-nowrap"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section with Onboarding Form */}
      <header className="container mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-block bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full text-sm mb-6 border border-blue-200">
            Built for agencies, by an agency.
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Stop searching for clients. <br/>
            <span className="text-blue-600">Let them ask for you.</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-lg">
            We turn Reddit into your agency's private lead feed. Input your domain and competitors, and we'll instantly alert you when a prospect asks for exactly what you do.
          </p>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200 relative z-10">
            <h3 className="font-bold text-slate-900 text-lg mb-4">See your first lead in 30 seconds</h3>
            <form onSubmit={handleHeroSubmit} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  required
                  value={heroForm.domain}
                  onChange={(e) => setHeroForm({...heroForm, domain: e.target.value})}
                  placeholder="Your agency domain (e.g., acme.com)" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  value={heroForm.competitor1}
                  onChange={(e) => setHeroForm({...heroForm, competitor1: e.target.value})}
                  placeholder="Competitor 1" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" 
                />
                <input 
                  type="text" 
                  value={heroForm.competitor2}
                  onChange={(e) => setHeroForm({...heroForm, competitor2: e.target.value})}
                  placeholder="Competitor 2" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" 
                />
              </div>
              <div>
                <textarea 
                  rows="2" 
                  required
                  value={heroForm.description}
                  onChange={(e) => setHeroForm({...heroForm, description: e.target.value})}
                  placeholder="Briefly describe what your agency does best..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                ></textarea>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Generate My Custom Lead Feed &rarr;
              </button>
            </form>
          </div>
        </div>

        {/* Interactive Lead Showcase */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-3xl transform rotate-2 scale-105 -z-10"></div>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 md:p-8 flex flex-col h-[600px]">
            <h3 className="text-xl font-bold mb-6 text-center text-slate-800">What kind of agency are you?</h3>
            
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {agencyTypes.map(type => (
                <button 
                  key={type.id}
                  onClick={() => setActiveAgencyType(type.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition border ${
                    activeAgencyType === type.id 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Scrolling Feed */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
              {leadExamples[activeAgencyType].map((lead, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-blue-300 transition group cursor-pointer relative overflow-hidden">
                  {idx === 0 && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wide">
                      New
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mb-2">
                    <span className="font-bold text-slate-700">{lead.subreddit}</span>
                    <span>•</span>
                    <span>{lead.time}</span>
                  </div>
                  <h4 className="font-bold text-[15px] text-slate-900 mb-2 group-hover:text-blue-600 transition">{lead.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{lead.text}</p>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">High Intent</span>
                    <span className="text-sm font-bold text-blue-600">Reply &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500 font-medium">+ 47 more leads found today</p>
            </div>
          </div>
        </div>
      </header>

      {/* Logos Section */}
      <section className="border-y border-slate-200 bg-white py-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Trusted by scaling agencies</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
            <span className="text-2xl font-black">AcmeCorp</span>
            <span className="text-2xl font-black">GlobalMedia</span>
            <span className="text-2xl font-black">TechGrowth</span>
            <span className="text-2xl font-black">DevStudios</span>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">How top agencies win with Leadrnk</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Stop scraping data. Start closing deals. Here are three automated playbooks our users run every day.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-blue-600 text-xl font-black">1</div>
              <h3 className="text-xl font-bold mb-3">Competitor Interception</h3>
              <p className="text-slate-600">Track keywords like "alternative to [Your Competitor]". When someone complains about their current agency, you are the first reply offering a better solution.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-green-600 text-xl font-black">2</div>
              <h3 className="text-xl font-bold mb-3">Pain Point Prospecting</h3>
              <p className="text-slate-600">Don't just look for people saying "hire". Track technical questions your agency solves. Answer their question for free, then pitch your service in the DMs.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-purple-600 text-xl font-black">3</div>
              <h3 className="text-xl font-bold mb-3">Direct Intent Sniping</h3>
              <p className="text-slate-600">Get Slack alerts within 60 seconds whenever someone posts "looking for a [Your Service] agency". Be the first to DM them while they are still online.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-slate-900 py-24 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4">We know the grind. We fixed it.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Agencies using Leadrnk close an average of $6,500 in new MRR within their first 30 days.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
              <div className="flex text-yellow-400 mb-4">★★★★★</div>
              <p className="text-slate-300 mb-6">"Before Leadrnk, we got hundreds of views on promotional posts, but zero deals. Now, we track exact pain points. Closed a $4k/mo retainer in week one."</p>
              <div className="font-bold">— Sarah J., Growth Marketing</div>
            </div>
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
              <div className="flex text-yellow-400 mb-4">★★★★★</div>
              <p className="text-slate-300 mb-6">"If you run a dev shop, this is a cheat code. The second someone complains about a slow WordPress site, my team gets a Slack alert and we swoop in."</p>
              <div className="font-bold">— Marcus T., Web Studio</div>
            </div>
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
              <div className="flex text-yellow-400 mb-4">★★★★★</div>
              <p className="text-slate-300 mb-6">"The competitor tracking is insane. When someone asks for an 'alternative to [Competitor]', we are the very first reply in the thread. Easiest leads ever."</p>
              <div className="font-bold">— Elena R., Lead Gen Agency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">One closed deal pays for the whole year.</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Simple, transparent pricing built to scale with your agency.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
            
            {/* Starter */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 w-full">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Freelancer</h3>
              <p className="text-slate-500 text-sm mb-6">For solo operators starting out.</p>
              <div className="mb-6"><span className="text-4xl font-black">$19</span><span className="text-slate-500">/mo</span></div>
              <ul className="space-y-4 mb-8 text-sm text-slate-700">
                <li className="flex items-center">✓ 20 Active Keyword Trackers</li>
                <li className="flex items-center">✓ Email Alerts (Hourly)</li>
                <li className="flex items-center">✓ Track 20 Subreddits</li>
                <li className="flex items-center">✓ Reply agent</li>
                <li className="flex items-center text-slate-400 line-through">Slack Integration</li>
              </ul>
              <button onClick={handleStandardSignup} className="w-full bg-white border border-slate-300 text-slate-900 font-bold py-3 rounded-lg hover:bg-slate-50 transition">Get 3 days free</button>
            </div>

            {/* Growth */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl transform md:-translate-y-4 relative w-full">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Most Popular</div>
              <h3 className="text-xl font-bold text-white mb-2">Agency Growth</h3>
              <p className="text-slate-400 text-sm mb-6">For agencies actively scaling MRR.</p>
              <div className="mb-6"><span className="text-4xl font-black text-white">$39</span><span className="text-slate-400">/mo</span></div>
              <ul className="space-y-4 mb-8 text-sm text-slate-300">
                <li className="flex items-center">✓ 40 Active Keyword Trackers</li>
                <li className="flex items-center">✓ Instant Alerts (Real-time)</li>
                <li className="flex items-center">✓ 50 Subreddits</li>
                <li className="flex items-center">✓ Reply agent</li>
                <li className="flex items-center font-semibold text-white">✓ Slack & Discord Integration</li>
              </ul>
              <button onClick={handleStandardSignup} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">Get 3 days free</button>
            </div>
            
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-lg mb-2">Is this compliant with Reddit's rules?</h4>
              <p className="text-slate-600">Yes. Leadrnk uses public search data and official endpoints. We do not automate replies or spam users; we simply alert you when a relevant conversation is happening so you can manually jump in and provide value.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-lg mb-2">How fast are the alerts?</h4>
              <p className="text-slate-600">On our Growth and Scale plans, we poll for your keywords constantly. You can expect a Slack notification or email within 60-120 seconds of the post going live on Reddit.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-lg mb-2">Can I track specific subreddits or the whole site?</h4>
              <p className="text-slate-600">Both! You can set a tracker to look at all of Reddit, or narrow it down to specific communities (e.g., only tracking "SEO agency" inside of r/SaaS and r/Entrepreneur).</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-lg mb-2">Can I cancel my subscription at any time?</h4>
              <p className="text-slate-600">Yes. Leadrnk is a month-to-month service. You can cancel your subscription at any time directly from your dashboard with two clicks, no questions asked.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 text-slate-400">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-xl font-black text-white mb-4 md:mb-0">
            Leadrnk<span className="text-blue-600">.</span>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} Leadrnk. All rights reserved. Built for agencies.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;