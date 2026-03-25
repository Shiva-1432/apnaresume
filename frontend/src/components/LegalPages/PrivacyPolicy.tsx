export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-3">1. Introduction</h2>
          <p className="text-gray-700">
            ApnaResume (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the ApnaResume platform. This Privacy
            Policy explains how we collect, use, and protect your personal data.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">2. Information We Collect</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>Account Data:</strong> Name, email address, and authentication data.</li>
            <li><strong>Resume Data:</strong> Uploaded resumes and analysis outputs.</li>
            <li><strong>Usage Data:</strong> Device/browser metadata and interaction logs.</li>
            <li><strong>Payment Data:</strong> Transaction metadata from payment processors.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">3. How We Use Data</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Provide resume analysis and related features.</li>
            <li>Improve product quality and reliability.</li>
            <li>Support billing, fraud prevention, and account security.</li>
            <li>Respond to support and legal requests.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">4. Data Security</h2>
          <p className="text-gray-700">
            We use industry-standard safeguards to protect your information, but no online system
            can guarantee absolute security.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">5. Your GDPR Rights</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Access and export your personal data.</li>
            <li>Correct inaccurate information.</li>
            <li>Request deletion of your account data.</li>
          </ul>
          <p className="text-gray-700 mt-3">
            You can exercise these rights from your account settings or by contacting support.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">6. Policy Updates</h2>
          <p className="text-gray-700">
            We may revise this policy as the service evolves. The latest version is always
            published on this page.
          </p>
        </div>
      </section>

      <p className="text-gray-500 text-sm mt-12">Last updated: March 24, 2026</p>
    </div>
  );
}
