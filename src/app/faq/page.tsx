import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Installer Notes — how scoring works, how to contribute, moderation, and more.",
};

type FAQItem = {
  question: string;
  answer: React.ReactNode;
};

const scoringFAQs: FAQItem[] = [
  {
    question: "How does the contributor score work?",
    answer: (
      <>
        <p>
          Your contributor score is a single number that reflects both the{" "}
          <strong>quantity</strong> and <strong>quality</strong> of your
          contributions. It&apos;s calculated automatically using three factors:
        </p>
        <div className="mt-3 bg-bg/50 border border-border rounded-lg p-4 space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold shrink-0">1 pt</span>
            <span>for each approved note you&apos;ve submitted</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold shrink-0">2 pts</span>
            <span>
              multiplied by your average star rating across all your notes
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold shrink-0">0.5 pts</span>
            <span>for each review/rating your notes have received</span>
          </div>
        </div>
        <p className="mt-3 text-text-dim text-sm">
          <strong>Example:</strong> If you have 5 approved notes, a 4.5 average
          rating, and 12 total reviews, your score would be (5 &times; 1) + (4.5
          &times; 2) + (12 &times; 0.5) = <strong>20.0</strong>
        </p>
      </>
    ),
  },
  {
    question: "How do I get on the leaderboard?",
    answer: (
      <p>
        Submit a note on any vehicle and it gets approved — that&apos;s it. As
        soon as your first note is approved, you&apos;ll appear on the{" "}
        <Link href="/leaderboard" className="text-primary hover:underline">
          leaderboard
        </Link>
        . The more quality notes you write and the higher other installers rate
        them, the higher you&apos;ll climb.
      </p>
    ),
  },
  {
    question: "Why did my score change?",
    answer: (
      <p>
        Your score recalculates automatically whenever someone rates one of your
        notes, when you submit a new note, or when a note is approved or
        removed. If your average rating goes up, your score goes up. If a note
        gets rejected, your approved count drops and so does your score.
      </p>
    ),
  },
  {
    question: "Can my score go down?",
    answer: (
      <p>
        Yes. If a note you submitted gets rejected or removed by a moderator,
        your approved note count decreases. If someone leaves a low star rating
        on one of your notes, your average rating may drop. Both of these lower
        your overall score.
      </p>
    ),
  },
];

const contributingFAQs: FAQItem[] = [
  {
    question: "How do I submit a note?",
    answer: (
      <>
        <p>
          Search for a vehicle, open its page, and click{" "}
          <strong>&quot;Add Your Note&quot;</strong>. Fill in your install tips,
          rate the difficulty of each panel, and optionally add a YouTube link.
          Your note is reviewed (usually instantly by AI) and then goes live.
        </p>
        <p className="mt-2">
          You can submit one note per vehicle. If you want to update your tips
          later, just edit your existing note.
        </p>
      </>
    ),
  },
  {
    question: "What makes a good note?",
    answer: (
      <ul className="list-disc list-inside space-y-1.5">
        <li>
          Specific, practical tips — not just &quot;this car is easy&quot;
        </li>
        <li>
          Mention tricky spots (gaskets, dot matrix, tight corners, defroster
          lines)
        </li>
        <li>Tools or techniques that helped you</li>
        <li>Common problems you ran into and how you solved them</li>
        <li>Difficulty ratings on each panel so others know what to expect</li>
      </ul>
    ),
  },
  {
    question: "Can I edit my note after submitting?",
    answer: (
      <p>
        Yes. Go to the vehicle page where you submitted your note and
        you&apos;ll see your existing note with an edit option. Edited notes go
        through moderation again to make sure the updated content still meets
        guidelines.
      </p>
    ),
  },
  {
    question: "Can I add a YouTube video to my note?",
    answer: (
      <p>
        Yes. There&apos;s an optional YouTube URL field when submitting a note.
        If you have a video of the install, paste the link and it&apos;ll be
        embedded on the vehicle page alongside your tips.
      </p>
    ),
  },
  {
    question: "What are difficulty ratings?",
    answer: (
      <>
        <p>
          When you submit a note, you can rate the difficulty of individual
          panels on a 1&ndash;5 scale:
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Rollups (side windows)</li>
          <li>Back glass</li>
          <li>Windshield</li>
          <li>Sunroof</li>
          <li>Quarter glass</li>
        </ul>
        <p className="mt-2">
          An overall difficulty is auto-calculated from the panels you rate.
          These ratings help other installers know what to expect before they
          start.
        </p>
      </>
    ),
  },
];

const ratingsFAQs: FAQItem[] = [
  {
    question: "How do I rate someone else's note?",
    answer: (
      <p>
        On any vehicle page, you&apos;ll see notes from other installers. Each
        note has a star rating option (1&ndash;5 stars) and an optional written
        review. Rate based on how helpful and accurate the tips were for that
        vehicle.
      </p>
    ),
  },
  {
    question: "Can I change my rating?",
    answer: (
      <p>
        You can only submit one rating per note. Choose carefully — your rating
        directly affects the author&apos;s contributor score and helps the
        community identify the most helpful notes.
      </p>
    ),
  },
  {
    question: "Are ratings monitored?",
    answer: (
      <p>
        Yes. We run automated audits to detect suspicious rating patterns (like
        targeted low ratings or fake high ratings). Ratings that are flagged as
        potentially manipulative are reviewed by moderators.
      </p>
    ),
  },
];

const moderationFAQs: FAQItem[] = [
  {
    question: "How does moderation work?",
    answer: (
      <p>
        When you submit a note, it&apos;s reviewed by AI to check for spam,
        offensive content, or anything unrelated to vehicle installations. Most
        notes are approved instantly. If the AI is unsure, your note is flagged
        for a human moderator to review — this usually happens within a few
        hours.
      </p>
    ),
  },
  {
    question: "Why was my note flagged or rejected?",
    answer: (
      <ul className="list-disc list-inside space-y-1.5">
        <li>
          <strong>Spam or promotional content</strong> — links to products,
          businesses, or unrelated services
        </li>
        <li>
          <strong>Offensive language</strong> — profanity or inappropriate
          content
        </li>
        <li>
          <strong>Not related to installations</strong> — content that
          isn&apos;t about installing tint, PPF, or other films
        </li>
        <li>
          <strong>Dangerous advice</strong> — tips that could damage vehicles or
          harm installers
        </li>
      </ul>
    ),
  },
  {
    question: "How do I report a note or review?",
    answer: (
      <p>
        Each note and review has a report option. Select a reason and our
        moderators will review it. Reports are taken seriously — we want this to
        be a helpful, trustworthy resource.
      </p>
    ),
  },
];

const generalFAQs: FAQItem[] = [
  {
    question: "Is Installer Notes really free?",
    answer: (
      <p>
        Yes, 100% free. No trial, no credit card, no premium tier. Installer
        Notes is a community tool built by{" "}
        <a
          href="https://snaptip.app"
          className="text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          SnapTip
        </a>{" "}
        to help the tint and automotive appearance community share knowledge.
      </p>
    ),
  },
  {
    question: "What is SnapTip?",
    answer: (
      <p>
        SnapTip is an all-in-one business management platform for window tint,
        PPF, coatings, and appearance shops. It handles proposals, invoicing,
        scheduling, inventory, payroll, and more. Installer Notes is the free
        community side of the platform — your account works on both. You can
        learn more at{" "}
        <a
          href="https://snaptip.app"
          className="text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          snaptip.app
        </a>
        .
      </p>
    ),
  },
  {
    question: "Do I need a SnapTip account to use Installer Notes?",
    answer: (
      <p>
        You need an account to submit notes, rate notes, and appear on the
        leaderboard. But your Installer Notes account is free and separate from a
        SnapTip business subscription — signing up for Installer Notes does not
        commit you to anything.
      </p>
    ),
  },
  {
    question: "What vehicles are covered?",
    answer: (
      <p>
        Our vehicle database covers thousands of year/make/model combinations
        across all major manufacturers. If a vehicle isn&apos;t in the database
        yet, it will be added as the catalog grows. The community drives
        coverage — the more installers who contribute, the more vehicles get
        documented.
      </p>
    ),
  },
];

const sections = [
  { id: "scoring", title: "Scoring & Leaderboard", items: scoringFAQs },
  { id: "contributing", title: "Contributing Notes", items: contributingFAQs },
  { id: "ratings", title: "Ratings & Reviews", items: ratingsFAQs },
  { id: "moderation", title: "Moderation", items: moderationFAQs },
  { id: "general", title: "General", items: generalFAQs },
];

function FAQSection({
  title,
  items,
}: {
  title: string;
  items: FAQItem[];
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-text-bright mb-4">{title}</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <details
            key={i}
            className="group bg-surface border border-border rounded-lg overflow-hidden"
          >
            <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none hover:bg-surface-hover transition-colors">
              <span className="text-sm font-medium text-text-bright pr-4">
                {item.question}
              </span>
              <span className="text-text-dim text-lg leading-none shrink-0 group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <div className="px-4 pb-4 text-sm text-text-muted leading-relaxed">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

const faqSchemaItems = [
  { q: "How does the contributor score work?", a: "Your contributor score reflects the quantity and quality of your contributions, calculated from approved notes, average star rating, and total reviews received." },
  { q: "How do I submit a note?", a: "Search for a vehicle, open its page, and click Add Your Note. Fill in your install tips, rate the difficulty of each panel, and optionally add a YouTube link." },
  { q: "What makes a good note?", a: "Specific, practical tips mentioning tricky spots, tools or techniques that helped, common problems and solutions, and difficulty ratings on each panel." },
  { q: "How does moderation work?", a: "Notes are reviewed by AI to check for spam, offensive content, or anything unrelated to vehicle installations. Most notes are approved instantly." },
  { q: "Is Installer Notes really free?", a: "Yes, 100% free. No trial, no credit card, no premium tier. Installer Notes is a community tool built by SnapTip." },
  { q: "What is SnapTip?", a: "SnapTip is an all-in-one business management platform for window tint, PPF, coatings, and appearance shops." },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqSchemaItems.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />

      <h1 className="text-3xl font-black text-text-bright mb-2">
        Frequently Asked Questions
      </h1>
      <p className="text-text-muted mb-10">
        Everything you need to know about Installer Notes — how scoring works,
        how to contribute, and more.
      </p>

      {/* Jump links */}
      <div className="flex flex-wrap gap-2 mb-10">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="text-xs font-medium text-text-muted bg-surface border border-border rounded-full px-3 py-1.5 hover:text-primary hover:border-primary/40 transition-colors"
          >
            {s.title}
          </a>
        ))}
      </div>

      <div className="space-y-10">
        {sections.map((s) => (
          <div key={s.id} id={s.id}>
            <FAQSection title={s.title} items={s.items} />
          </div>
        ))}
      </div>

      {/* Still have questions */}
      <div className="mt-12 bg-surface border border-border rounded-xl p-6 text-center">
        <h3 className="font-semibold text-text-bright mb-2">
          Still have questions?
        </h3>
        <p className="text-sm text-text-muted">
          Reach out to us at{" "}
          <a
            href="mailto:support@snaptip.app"
            className="text-primary hover:underline"
          >
            support@snaptip.app
          </a>
        </p>
      </div>
    </div>
  );
}
