import { useState } from "react";
import { useParche } from "../context/ParcheContext";
import { REPORT_REASONS } from "../lib/constants";
import { SheetShell } from "./SheetShell";

export function ReportSheet() {
  const { reportOpen, reportTarget, closeReport, submitReport, blockUser } = useParche();
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [block, setBlock] = useState(false);


  if (!reportOpen || !reportTarget) return null;

  const handleSubmit = () => {
    submitReport(reason);
    if (block && reportTarget.hostHandle) blockUser(reportTarget.hostHandle);
  };

  return (
    <SheetShell onClose={closeReport} labelledBy="report-sheet-title">
        <header className="create-header">
          <button type="button" className="text-btn" onClick={closeReport}>Cancelar</button>
          <h2 id="report-sheet-title">Reportar</h2>
          <button type="button" className="text-btn accent" onClick={handleSubmit}>Enviar</button>
        </header>
        <div className="create-body">
          <p className="create-hint">Reportando: {reportTarget.label}</p>
          <label className="field">
            <span>Motivo</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="select-field">
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="field checkbox-row">
            <input type="checkbox" checked={block} onChange={(e) => setBlock(e.target.checked)} />
            <span>También bloquear a este usuario</span>
          </label>
        </div>
    </SheetShell>
  );
}
