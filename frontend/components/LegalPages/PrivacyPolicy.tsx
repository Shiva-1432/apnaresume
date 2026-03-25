export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-3">1. Introduction</h2>
          <p className="text-gray-700">
            ApnaResume (&quot;we&quot; or &quot;us&quot; or &quot;our&quot;) operates the ApnaResume website and the ApnaResume application.
            This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service
            and the choices you have associated with that data.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">2. Information Collection and Use</h2>
          <p className="text-gray-700 mb-3">We collect several different types of information for various purposes:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>Account Information:</strong> Name, email address, password</li>
            <li><strong>Resume Data:</strong> Resume content, PDF files, analysis results</li>
            <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, time and date</li>
            <li><strong>Payment Information:</strong> Payment method, transaction ID (processed by Razorpay)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">3. How We Use Your Data</h2>
          <p className="text-gray-700 mb-3">ApnaResume uses the collected data for various purposes:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To analyze usage patterns to improve the Service</li>
            <li>To send promotional and marketing communications</li>
            <li>To detect, prevent and address fraud and security issues</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">4. Security of Your Data</h2>
          <p className="text-gray-700">
            The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure.
            While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">5. Your Rights (GDPR)</h2>
          <p className="text-gray-700 mb-3">You have the right to:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
          </ul>
          <p className="text-gray-700 mt-3">
            To exercise these rights, contact us at support@apnaresume.com
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">6. Changes to This Privacy Policy</h2>
          <p className="text-gray-700">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">7. Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions about this Privacy Policy, please contact us at support@apnaresume.com
          </p>
        </div>
      </section>

      <p className="text-gray-500 text-sm mt-12">
        Last updated: March 24, 2026
      </p>
    </div>
  );
}
