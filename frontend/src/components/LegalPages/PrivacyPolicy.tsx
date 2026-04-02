export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-mesh py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-glass p-12 md:p-20 rounded-[3.5rem] shadow-2xl border border-white/40 backdrop-blur-3xl motion-fade-up">
          <h1 className="text-5xl font-black text-neutral-900 tracking-tight mb-12 border-b border-white/20 pb-8">Privacy Policy</h1>

          <section className="space-y-12">
            {[
              { 
                id: '01', 
                title: 'Overview', 
                content: 'ApnaResume ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your personal data.' 
              },
              { 
                id: '02', 
                title: 'Data We Collect', 
                list: [
                  { label: 'Account Info', text: 'Name, email address, and authentication details.' },
                  { label: 'Resume Data', text: 'Uploaded resumes and AI-generated analysis results.' },
                  { label: 'Usage Data', text: 'Device/browser info and how you interact with the platform.' }
                ] 
              },
              { 
                id: '03', 
                title: 'How We Use Your Data', 
                list: [
                  { label: 'Functionality', text: 'Powering resume analysis and job role matching.' },
                  { label: 'Improvement', text: 'Improving product reliability and AI model accuracy.' },
                  { label: 'Security', text: 'Managing billing and keeping your account secure.' }
                ] 
              },
              { 
                id: '04', 
                title: 'Data Security', 
                content: 'We use industry-standard TLS encryption and secure storage. While we take every precaution, no platform can guarantee 100% security.' 
              },
              { 
                id: '05', 
                title: 'Your Rights / GDPR', 
                content: 'You have full control over your data. You can export or permanently delete all your information from your Dashboard Settings at any time.' 
              }
            ].map((sect) => (
              <div key={sect.id} className="relative pl-12">
                <div className="absolute left-0 top-0 text-xs font-black text-indigo-600/40 tracking-widest">{sect.id}</div>
                <h2 className="text-2xl font-black text-neutral-900 mb-4 uppercase tracking-widest">{sect.title}</h2>
                {sect.content && <p className="text-neutral-600 font-bold leading-relaxed">{sect.content}</p>}
                {sect.list && (
                  <ul className="space-y-4">
                    {sect.list.map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                        <p className="text-neutral-600 font-bold leading-relaxed">
                          <span className="text-neutral-900 font-black">{item.label}:</span> {item.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>

          <div className="mt-20 pt-10 border-t border-white/20 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            <span>Last Updated: March 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
