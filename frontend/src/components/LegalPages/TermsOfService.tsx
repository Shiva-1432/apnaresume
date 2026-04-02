export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-mesh py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-glass p-12 md:p-20 rounded-[3.5rem] shadow-2xl border border-white/40 backdrop-blur-3xl motion-fade-up">
          <h1 className="text-5xl font-black text-neutral-900 tracking-tight mb-12 border-b border-white/20 pb-8">Universal Terms</h1>

          <section className="space-y-12">
            {[
              { 
                id: '01', 
                title: 'The Compact', 
                content: 'By accessing ApnaResume, you agree to be bound by these Universal Terms. If you disagree with any tactical provision, you must immediately terminate your session.' 
              },
              { 
                id: '02', 
                title: 'Operational License', 
                content: 'We grant you a non-transferable, revocable license to utilize our AI-driven analysis tools for personal career optimization. Commercial scraping or vector redistribution is strictly prohibited.' 
              },
              { 
                id: '03', 
                title: 'Credit Economy', 
                content: 'Paid features are powered by a credit system. Purchased credits are non-transferable and tied to your account. We reserve the right to adjust pricing for balance purposes.' 
              },
              { 
                id: '04', 
                title: 'Intellectual Property', 
                content: 'All analysis logic, UI design tokens, and neural branding are the exclusive property of ApnaResume. Users retain ownership of their uploaded documents but grant us processing rights for optimization.' 
              },
              { 
                id: '05', 
                title: 'Liability Boundary', 
                content: 'ApnaResume provides optimized suggestions, not employment guarantees. We are not liable for any strategic career outcomes, interview performance, or infrastructure downtime.' 
              },
              { 
                id: '06', 
                title: 'Account Termination', 
                content: 'We reserve the right to suspend or terminate any account that violates these terms, applicable laws, or platform security.' 
              }
            ].map((sect) => (
              <div key={sect.id} className="relative pl-12">
                <div className="absolute left-0 top-0 text-xs font-black text-indigo-600/40 tracking-widest">{sect.id}</div>
                <h2 className="text-2xl font-black text-neutral-900 mb-4 uppercase tracking-widest">{sect.title}</h2>
                <p className="text-neutral-600 font-bold leading-relaxed">{sect.content}</p>
              </div>
            ))}
          </section>

          <div className="mt-20 pt-10 border-t border-white/20 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            <span>Universal Rev 2026.03</span>
            <span>Last Updated: March 24, 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
