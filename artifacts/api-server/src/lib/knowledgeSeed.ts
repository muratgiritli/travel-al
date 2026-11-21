/** Admin-authored Q&A bank used to ground the chat assistant (server-side only). */

export interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  /** Comma-separated or array tags for retrieval (insurance, esim, schengen, delivery…) */
  tags: string[];
  sort: number;
  active: boolean;
}

export const KNOWLEDGE_SEED: {
  system_style: string;
  fallback_message: string;
  items: KnowledgeItem[];
} = {
  system_style:
    "You are a friendly Türkiye travel entry assistant. Answer only from the verified facts and approved Q&A below. If the answer is not covered, say you do not have that detail and suggest using Contact or Track. Prefer E-VISA / visa-free wording when those terms appear in the source facts. Keep answers short, plain text, no markdown headers.",
  fallback_message:
    "I do not have a verified answer for that in our current guide. Please check the service options above, or use Contact / Track for help from our team.",
  items: [
    {
      id: "k1",
      question: "What does Schengen mean for Turkey entry?",
      answer:
        "Schengen is a group of European countries with shared border rules. A valid Schengen residence permit or visa can help some travelers qualify for a Türkiye E-VISA option, depending on nationality and the option cards shown for your passport.",
      tags: ["schengen", "evisa", "residence", "entry"],
      sort: 1,
      active: true,
    },
    {
      id: "k2",
      question: "How long does E-VISA delivery take?",
      answer:
        "Depending on the processing speed you choose, delivery typically occurs between 60 minutes and 7 days. Details are sent to your email.",
      tags: ["delivery", "email", "processing", "evisa", "timing"],
      sort: 2,
      active: true,
    },
    {
      id: "k3",
      question: "Do I need travel insurance for Türkiye?",
      answer:
        "Travel health insurance covering your full stay in Türkiye is required or strongly advised for most travelers, including many visa-free nationalities. You should buy it before travel and keep a copy of the certificate.",
      tags: ["insurance", "health", "mandatory", "required"],
      sort: 3,
      active: true,
    },
    {
      id: "k4",
      question: "What is Turkey eSIM?",
      answer:
        "eSIM is a digital SIM for mobile data in Türkiye. Purchase and install before arrival, then enable mobile data after you land. It provides connectivity only — it is not an entry permit or visa.",
      tags: ["esim", "data", "mobile", "sim", "internet"],
      sort: 4,
      active: true,
    },
    {
      id: "k5",
      question: "How do I track my application?",
      answer:
        "Use the Track page with the tracking number from your confirmation email (format like TEG-…). Contact support if you need help.",
      tags: ["track", "status", "application", "email"],
      sort: 5,
      active: true,
    },
  ],
};
