import { DISTANCE_OPTIONS, NEIGHBORHOODS, VIBE_LABELS, VIBE_ORDER } from "../lib/constants";
import type { ContentFilters, ParcheVibe } from "../lib/types";

const VIBES: (ParcheVibe | "all")[] = ["all", ...VIBE_ORDER];

interface FilterBarProps {
  filters: ContentFilters;
  onChange: (f: Partial<ContentFilters>) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const choose = (v: ParcheVibe | "all", chip: HTMLButtonElement) => {
    onChange({ vibe: v });
    // Deja el chip elegido a la vista cuando la fila se desplaza horizontalmente.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    chip.scrollIntoView({ block: "nearest", inline: "center", behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section className="filter-bar" aria-label="Filtros">
      <div className="filter-scroll" role="group" aria-label="Tipo de parche">
        {VIBES.map((v) => (
          <button
            key={v}
            type="button"
            className={`filter-chip ${filters.vibe === v ? "active" : ""}`}
            aria-pressed={filters.vibe === v}
            onClick={(e) => choose(v, e.currentTarget)}
          >
            {v === "all" ? "Todas" : VIBE_LABELS[v]}
          </button>
        ))}
      </div>
      <div className="filter-row">
        <label className="sr-only" htmlFor="filter-neighborhood">Barrio</label>
        <select
          id="filter-neighborhood"
          className="select-field compact"
          value={filters.neighborhood}
          onChange={(e) => onChange({ neighborhood: e.target.value })}
        >
          {NEIGHBORHOODS.map((n) => (
            <option key={n} value={n}>{n === "all" ? "Todos los barrios" : n}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-distance">Distancia</label>
        <select
          id="filter-distance"
          className="select-field compact"
          value={filters.maxDistanceKm ?? ""}
          onChange={(e) => onChange({
            maxDistanceKm: e.target.value === "" ? null : Number(e.target.value),
          })}
        >
          {DISTANCE_OPTIONS.map((d) => (
            <option key={d.label} value={d.km ?? ""}>{d.label}</option>
          ))}
        </select>
      </div>
    </section>
  );
}
