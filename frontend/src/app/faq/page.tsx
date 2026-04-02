import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ApnaResume FAQ — ATS, Scoring, Credits, and Resume Analysis',
  description:
    'Find answers to common questions about ATS scoring, credits, keyword analysis, and improving your resume match rate.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'ApnaResume FAQ',
    description: 'Answers about ATS scoring, credits, and resume optimization.',
    url: 'https://apnaresume.com/faq',
    siteName: 'ApnaResume',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ApnaResume FAQ',
    description: 'Answers about ATS scoring, credits, and resume optimization.',
    images: ['/og-image.png'],
  },
};

const FAQ_ITEMS = [
  { question: 'How does ATS analysis work?', answer: 'Upload a text-based PDF resume and ApnaResume evaluates format, keyword relevance, and role fit using our scoring pipeline.' },
  { question: 'Why did I get a quota limit error?', answer: 'Advanced AI features are limited per user each hour/day to keep the service fair and stable for everyone.' },
  { question: 'Do unused credits expire?', answer: 'No. Your credits remain in your account until you use them.' },
  { question: 'How can I improve match percentage?', answer: 'Tailor project bullets, add role-specific keywords from the job description, and quantify impact with numbers.' }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-mesh py-20 px-6">
      <div className="max-w-4xl mx-auto space-y-16">
        <div className="text-center motion-fade-up">
          <h1 className="text-6xl font-black text-neutral-900 tracking-tight mb-6">Knowledge Base</h1>
          <p className="text-neutral-500 font-bold text-xl">Quick answers for analysis, credits, and optimization.</p>
        </div>

        <div className="grid gap-6 motion-fade-up">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="bg-glass p-10 rounded-[2.5rem] shadow-xl border border-white/40 backdrop-blur-3xl hover:bg-white/60 transition-all group">
              <h2 className="text-2xl font-black text-neutral-900 mb-4 tracking-tight group-hover:text-indigo-600 transition-colors">{item.question}</h2>
              <p className="text-neutral-600 font-bold leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>

        <div className="bg-indigo-600 p-12 rounded-[3rem] text-center shadow-2xl shadow-indigo-200 motion-fade-up">
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Still have questions?</h2>
          <p className="text-indigo-100 font-bold mb-10">Our support team is ready to help with any questions about your career growth.</p>
          <button className="px-10 py-5 bg-white text-indigo-600 font-black rounded-2xl hover:bg-neutral-900 hover:text-white shadow-xl transition-all active:scale-95">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
