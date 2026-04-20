import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Installer Notes collects, uses, and protects your personal information. We only collect your name, email, and optional profile photo.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-text-bright mb-2">Privacy Policy</h1>
      <p className="text-sm text-text-dim mb-8">Last updated: March 19, 2026</p>

      <div className="prose-custom space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">1. Who We Are</h2>
          <p>
            Installer Notes is a free community tool operated by SnapTip (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). Installer Notes lets window-tint, PPF, and coatings installers share and access real-world vehicle installation notes. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">2. Information We Collect</h2>
          <p>We collect the minimum information needed to run the platform:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong className="text-text-bright">Full name</strong> &mdash; required at signup. We require real, full names (not nicknames or aliases) so the community can trust who is contributing.</li>
            <li><strong className="text-text-bright">Email address</strong> &mdash; used for account authentication, important account notifications, and platform communications.</li>
            <li><strong className="text-text-bright">Profile photo</strong> &mdash; optional. You may upload a photo that will be displayed alongside your contributions.</li>
            <li><strong className="text-text-bright">Content you submit</strong> &mdash; installation notes, difficulty ratings, reviews, photos, and videos you choose to share on the platform.</li>
          </ul>
          <p className="mt-2">
            We do not collect payment information, location data, or any personal data beyond what is listed above. We do not purchase data from third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-text-bright">To provide the service</strong> &mdash; your name and profile photo are displayed publicly alongside your contributions so other installers know who shared the information.</li>
            <li><strong className="text-text-bright">To authenticate your account</strong> &mdash; your email and password are used to sign you in securely.</li>
            <li><strong className="text-text-bright">To communicate with you</strong> &mdash; we may send account-related emails such as confirmation emails, security alerts, and important platform updates.</li>
            <li><strong className="text-text-bright">To moderate content</strong> &mdash; we review submitted content (including via automated tools) to maintain quality and enforce our Terms of Service.</li>
            <li><strong className="text-text-bright">To calculate community metrics</strong> &mdash; your note count, average rating, and contributor score are calculated and displayed publicly on your profile and the leaderboard.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">4. What We Share Publicly</h2>
          <p>
            Installer Notes is a community platform. The following information is visible to all registered users:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Your full name</li>
            <li>Your profile photo (if uploaded)</li>
            <li>Your installation notes and all associated content (tips, difficulty ratings, photos, videos)</li>
            <li>Your contributor statistics (note count, average rating, contributor score)</li>
            <li>Ratings and reviews you leave on other users&rsquo; notes</li>
          </ul>
          <p className="mt-2">
            <strong className="text-text-bright">Your email address is never shared publicly or with other users.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">5. Third-Party Services</h2>
          <p>We use the following third-party services to operate the platform:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong className="text-text-bright">Supabase</strong> &mdash; database hosting and authentication</li>
            <li><strong className="text-text-bright">Vercel</strong> &mdash; application hosting</li>
          </ul>
          <p className="mt-2">
            These providers process data on our behalf and are bound by their own privacy policies. We do not sell, rent, or trade your personal information to any third party.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">6. Data Retention</h2>
          <p>
            We retain your account information and contributed content for as long as your account is active. If you delete your account, we will remove your personal information (name, email, profile photo) within 30 days. Contributed notes may be retained in anonymized form to preserve the community knowledge base.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">7. Your Rights</h2>
          <p>You may at any time:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Update your name or profile photo from your profile settings</li>
            <li>Request a copy of the personal data we hold about you</li>
            <li>Request deletion of your account and personal data</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, contact us at <a href="mailto:support@snaptip.app" className="text-primary hover:underline">support@snaptip.app</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">8. Cookies</h2>
          <p>
            We use essential cookies only &mdash; specifically, authentication session cookies that keep you signed in. We do not use tracking cookies, advertising cookies, or analytics cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">9. Children&rsquo;s Privacy</h2>
          <p>
            Installer Notes is not intended for anyone under the age of 16. We do not knowingly collect personal information from children. If you believe a child has created an account, please contact us and we will remove it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or by posting a notice on the platform. Your continued use of Installer Notes after changes are posted constitutes your acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at{" "}
            <a href="mailto:support@snaptip.app" className="text-primary hover:underline">support@snaptip.app</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
