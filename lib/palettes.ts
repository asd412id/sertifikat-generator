export type Palette = {
  id: string;
  name: string;
  paperClass: string;
  inkClass: string;
  borderClass: string;
  softBorderClass: string;
  gradientClass: string;
  decoAClass: string;
  decoBClass: string;
  decoCClass: string;
};

export const PALETTES: readonly Palette[] = [
  {
    id: "ocean",
    name: "Ocean",
    paperClass: "bg-white",
    inkClass: "text-slate-800",
    borderClass: "border-sky-200",
    softBorderClass: "border-slate-200/70",
    gradientClass: "bg-gradient-to-br from-sky-50 via-white to-teal-50",
    decoAClass: "bg-sky-600/15",
    decoBClass: "bg-teal-500/12",
    decoCClass: "bg-slate-500/10",
  },
  {
    id: "indigo",
    name: "Indigo",
    paperClass: "bg-white",
    inkClass: "text-slate-800",
    borderClass: "border-indigo-200",
    softBorderClass: "border-slate-200/70",
    gradientClass: "bg-gradient-to-br from-indigo-50 via-white to-sky-50",
    decoAClass: "bg-indigo-600/14",
    decoBClass: "bg-sky-500/12",
    decoCClass: "bg-slate-500/10",
  },
  {
    id: "emerald",
    name: "Emerald",
    paperClass: "bg-white",
    inkClass: "text-slate-800",
    borderClass: "border-emerald-200",
    softBorderClass: "border-slate-200/70",
    gradientClass: "bg-gradient-to-br from-emerald-50 via-white to-lime-50",
    decoAClass: "bg-emerald-600/14",
    decoBClass: "bg-lime-500/10",
    decoCClass: "bg-slate-500/10",
  },
  {
    id: "slate",
    name: "Slate",
    paperClass: "bg-white",
    inkClass: "text-slate-800",
    borderClass: "border-slate-300",
    softBorderClass: "border-slate-200/70",
    gradientClass: "bg-gradient-to-br from-slate-50 via-white to-zinc-50",
    decoAClass: "bg-slate-700/12",
    decoBClass: "bg-zinc-600/10",
    decoCClass: "bg-sky-500/10",
  },
  {
    id: "rose",
    name: "Rose",
    paperClass: "bg-white",
    inkClass: "text-slate-800",
    borderClass: "border-rose-200",
    softBorderClass: "border-slate-200/70",
    gradientClass: "bg-gradient-to-br from-rose-50 via-white to-orange-50",
    decoAClass: "bg-rose-600/12",
    decoBClass: "bg-orange-500/10",
    decoCClass: "bg-slate-500/10",
  },
] as const;
