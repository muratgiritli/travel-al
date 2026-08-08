import { WIRE_CAT, type WireCategory } from '@/lib/wireCodes';
import type { ContentServices } from '@/lib/settings';

export type ServiceId = 'entry' | 'insurance' | 'esim';

type ServiceDef = {
  id: ServiceId;
  title: string;
  subtitle: string;
  accent: string;
  wash: string;
  border: string;
  chip: string;
};

/** 2026 modern palette — each service a distinct color family */
const THEMES: Record<ServiceId, Omit<ServiceDef, 'title' | 'subtitle' | 'id'>> = {
  entry: {
    accent: '#0EA5E9',
    wash: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 55%, #F0FDFA 100%)',
    border: '#7DD3FC',
    chip: '#BAE6FD',
  },
  insurance: {
    accent: '#F43F5E',
    wash: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #FFF7ED 100%)',
    border: '#FDA4AF',
    chip: '#FECDD3',
  },
  esim: {
    accent: '#8B5CF6',
    wash: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 50%, #F0F9FF 100%)',
    border: '#C4B5FD',
    chip: '#DDD6FE',
  },
};

function servicesForCategory(
  labels: ContentServices,
  category?: WireCategory | null,
): ServiceDef[] {
  const cat = category || '';

  let entryTitle = labels.entry_title;
  let entrySubtitle = labels.entry_subtitle;

  if (cat === WIRE_CAT.entryFree) {
    entryTitle = labels.entry_title_free || labels.entry_title;
    entrySubtitle = labels.entry_subtitle_free || labels.entry_subtitle;
  } else if (cat === WIRE_CAT.stickerMission) {
    entryTitle = labels.entry_title_sticker || labels.entry_title;
    entrySubtitle = labels.entry_subtitle_sticker || labels.entry_subtitle;
  } else if (cat === WIRE_CAT.ePermitDirect) {
    entryTitle = labels.entry_title_direct || labels.entry_title;
    entrySubtitle = labels.entry_subtitle_direct || labels.entry_subtitle;
  } else if (cat === WIRE_CAT.ePermitConditional || cat === WIRE_CAT.ageSpecial) {
    entryTitle = labels.entry_title;
    entrySubtitle = labels.entry_subtitle;
  }

  return [
    { id: 'entry', title: entryTitle, subtitle: entrySubtitle, ...THEMES.entry },
    {
      id: 'insurance',
      title: labels.insurance_title,
      subtitle: labels.insurance_subtitle,
      ...THEMES.insurance,
    },
    {
      id: 'esim',
      title: labels.esim_title,
      subtitle: labels.esim_subtitle,
      ...THEMES.esim,
    },
  ];
}

export default function ServiceHub({
  active,
  onSelect,
  category,
  labels,
}: {
  active: ServiceId | null;
  onSelect: (id: ServiceId) => void;
  category?: WireCategory | null;
  labels: ContentServices;
}) {
  const services = servicesForCategory(labels, category);
  const isEntryFree = category === WIRE_CAT.entryFree;

  return (
    <div className="mt-2 space-y-2.5">
      {services.map((s) => {
        // VISA FREE opens insurance — keep both frames visually related when open
        const selected =
          active === s.id ||
          (isEntryFree && s.id === 'entry' && active === 'insurance');
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className="w-full text-left rounded-2xl px-4 py-3.5 transition-all relative overflow-hidden"
            style={{
              background: s.wash,
              border: selected ? `2px solid ${s.accent}` : `1px solid ${s.border}`,
              boxShadow: selected
                ? `0 6px 20px ${s.accent}33`
                : '0 2px 10px rgba(15,23,42,.05)',
            }}
          >
            <span
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ background: s.accent }}
              aria-hidden
            />
            <div className="flex items-center justify-between gap-3 pl-1.5">
              <div>
                <div
                  className="text-[13px] font-bold tracking-wide"
                  style={{ color: s.accent }}
                >
                  {s.title}
                </div>
                <div className="text-[12px] text-gray-600 mt-0.5 leading-snug">
                  {s.subtitle}
                </div>
              </div>
              <span
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold"
                style={{
                  background: selected ? s.accent : s.chip,
                  color: selected ? '#fff' : s.accent,
                }}
              >
                →
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
