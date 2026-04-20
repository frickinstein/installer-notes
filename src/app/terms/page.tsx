import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Installer Notes — the free community knowledge base for window tint, PPF, and coatings installers.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-text-bright mb-2">Terms of Service</h1>
      <p className="text-sm text-text-dim mb-8">Last updated: March 19, 2026</p>

      <div className="prose-custom space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">1. Agreement to Terms</h2>
          <p>
            By creating an account on Installer Notes or using the platform in any way, you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). Installer Notes is operated by SnapTip (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). If you do not agree to these Terms, do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">2. What Installer Notes Is</h2>
          <p>
            Installer Notes is a free, community-driven knowledge base for window tint, paint protection film (PPF), and coatings installers. Users share real-world vehicle installation notes &mdash; tips, difficulty ratings, photos, and videos &mdash; so that other installers can learn from their experience. The platform is free to use and free to contribute to.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">3. Your Account</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-text-bright">Real names required.</strong> You must use your real, full name on your profile. Nicknames, aliases, fake names, and business names are not permitted. We reserve the right to remove or suspend accounts that do not use a real name.
            </li>
            <li>
              <strong className="text-text-bright">One account per person.</strong> You may only create and maintain one account.
            </li>
            <li>
              <strong className="text-text-bright">You are responsible for your account.</strong> Keep your password secure. You are responsible for all activity that occurs under your account.
            </li>
            <li>
              <strong className="text-text-bright">Accurate information.</strong> You agree to provide truthful, accurate information when creating your account and when contributing content.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">4. Community Content</h2>
          <p className="mb-2">
            The core of Installer Notes is user-contributed content. By submitting content (notes, tips, difficulty ratings, photos, videos, reviews), you agree to the following:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-text-bright">You grant us a license.</strong> You retain ownership of your content, but you grant SnapTip a worldwide, royalty-free, non-exclusive, perpetual license to use, display, reproduce, and distribute your content on the Installer Notes platform and for promotional purposes. This license allows us to show your notes to other users, feature them on the homepage, and include them in platform communications.
            </li>
            <li>
              <strong className="text-text-bright">Your content is public.</strong> All approved notes, ratings, reviews, photos, and videos are visible to other registered users. Your name and profile photo are displayed alongside your contributions. Do not submit content you want to keep private.
            </li>
            <li>
              <strong className="text-text-bright">Content must be your own.</strong> Only submit content that you have the right to share. Do not copy content from other sources, other installers, or copyrighted materials without permission.
            </li>
            <li>
              <strong className="text-text-bright">Content must be relevant and helpful.</strong> Notes should contain genuine installation tips, experiences, or information. Do not submit spam, advertisements, or irrelevant content.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">5. Prohibited Conduct</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Submit false, misleading, or intentionally harmful installation advice</li>
            <li>Harass, bully, or intimidate other users</li>
            <li>Use hate speech, slurs, or discriminatory language</li>
            <li>Spam, self-promote, or advertise products or services</li>
            <li>Manipulate ratings or reviews (e.g., rating your own notes from multiple accounts)</li>
            <li>Attempt to scrape, crawl, or bulk-download content from the platform</li>
            <li>Reverse-engineer, hack, or attempt to gain unauthorized access to the platform or other users&rsquo; accounts</li>
            <li>Use the platform for any illegal purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">6. Moderation and Removal</h2>
          <p>
            All submitted content may be reviewed by automated moderation tools and/or human moderators before being published.
          </p>
          <p className="mt-2">
            <strong className="text-text-bright">We reserve the right to remove any content and to suspend or permanently ban any user from the platform, at any time, for any reason, with or without notice.</strong> This includes but is not limited to violations of these Terms, disruptive behavior, or any conduct we determine to be harmful to the community.
          </p>
          <p className="mt-2">
            If your account is suspended or banned, you may not create a new account without our explicit permission.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">7. Disclaimer of Warranties</h2>
          <p>
            Installer Notes is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, whether express or implied. We do not warrant that:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>The platform will be available at all times or free from errors</li>
            <li>Any installation notes, tips, or advice shared by users are accurate, safe, or appropriate for your specific situation</li>
            <li>Following advice found on the platform will produce any particular result</li>
          </ul>
          <p className="mt-2">
            <strong className="text-text-bright">User-submitted content reflects individual experiences and opinions.</strong> Always use your own professional judgment when performing installations. We are not responsible for any damage, injury, or loss resulting from information found on the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, SnapTip and its officers, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenue, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">9. Intellectual Property</h2>
          <p>
            The Installer Notes name, logo, and platform design are the property of SnapTip. You may not use our branding without written permission. User-contributed content remains the intellectual property of the respective user, subject to the license granted in Section 4.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">10. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material changes, we will notify you by email or by posting a notice on the platform. Your continued use of Installer Notes after changes are posted constitutes your acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">11. Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the United States. Any disputes arising from these Terms or your use of the platform shall be resolved in the courts of competent jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-bright mb-2">12. Contact Us</h2>
          <p>
            If you have questions about these Terms, contact us at{" "}
            <a href="mailto:support@snaptip.app" className="text-primary hover:underline">support@snaptip.app</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
