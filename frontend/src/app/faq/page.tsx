import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Get quick answers about ATS scoring, usage limits, credits, and resume optimization on ApnaResume.',
  alternates: {
    canonical: '/faq',
  },
};

const FAQ_ITEMS = [
  {
    question: 'How does ATS analysis work?',
    answer:
      'Upload a text-based PDF resume and ApnaResume evaluates format, keyword relevance, and role fit using our scoring pipeline.'
  },
  {
    question: 'Why did I get a quota limit error?',
    answer:
      'Advanced AI features are limited per user each hour/day to keep the service fair and stable for everyone.'
  },
  {
    question: 'Do unused credits expire?',
    answer:
      'No. Your credits remain in your account until you use them.'
  },
  {
    question: 'How can I improve match percentage?',
    answer:
      'Tailor project bullets, add role-specific keywords from the job description, and quantify impact with numbers.'
  }
];

export default function FAQPage() {
  return (
    <section className="py-10 sm:py-14 max-w-3xl mx-auto motion-fade-up">
      <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900">Frequently Asked Questions</h1>
      <p className="mt-3 text-neutral-600">
        Quick answers for analysis, credits, limits, and resume optimization.
      </p>

      <div className="mt-8 space-y-4">
        {FAQ_ITEMS.map((item) => (
          <article
            key={item.question}
            className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover-lift-soft"
          >
            <h2 className="text-lg font-semibold text-neutral-900">{item.question}</h2>
            <p className="mt-2 text-neutral-700">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
