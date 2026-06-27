import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  onBack: () => void;
}

export const LegalPrivacy: React.FC<LegalPageProps> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto pb-16">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#2D4A3E] hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to App</span>
      </button>

      <article className="bg-[#F7F2EB] border border-[#E5E0D8] rounded-2xl p-6 md:p-10 shadow-sm">
        <h1 className="text-3xl font-serif italic text-[#1F1F1F] mb-2">Privacy Policy</h1>
        <p className="text-xs font-mono text-[#1F1F1F]/50 mb-8">Last updated: June 2026</p>

        <div className="space-y-6 text-sm text-[#1F1F1F]/80 leading-relaxed">
          <section>
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#2D4A3E] mb-2">
              Google Authentication
            </h2>
            <p>
              This application uses Google Authentication through Firebase Authentication to sign you in.
              When you sign in with Google, we receive your display name, email address, and profile photo URL
              from your Google account. This information is used to personalize your experience and associate
              your tasks with your account.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#2D4A3E] mb-2">
              Firebase Storage
            </h2>
            <p>
              User account data, task records, AI usage counters, and cached AI plan results are stored in
              Google Cloud Firestore, a Firebase database service. Your data is stored securely and is only
              accessible to you when authenticated. We track login and logout events, as well as monthly AI
              usage limits, to protect service costs and ensure fair access.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#2D4A3E] mb-2">
              User Task Storage
            </h2>
            <p>
              Tasks you create — including titles, deadlines, priorities, risk scores, subtasks, and completion
              status — are stored in Firestore under your user account. If you use the app without signing in,
              tasks are stored locally in your browser and are not synced to the cloud. You can delete tasks at
              any time from within the application.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#2D4A3E] mb-2">
              AI Processing
            </h2>
            <p>
              When you submit text for task generation or rescue mode planning, your input is sent to the
              Gemini API for processing. Cached results may be stored to avoid duplicate API calls. We do not
              sell or share your personal data with third parties beyond the Google Cloud services required to
              operate this application.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
};
