import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useParche } from "../context/ParcheContext";
import { Avatar } from "../components/Avatar";
import { Icons } from "../components/Icons";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { INVITE_STATUS_LABEL, SYSTEM_HANDLE } from "../lib/invites";
import type { DMMessage, DMThread, InviteRequest, PeerInfo } from "../lib/types";

type ListTab = "main" | "requests";

interface ThreadRow {
  thread: DMThread;
  messages: DMMessage[];
  last?: DMMessage;
  unread: number;
  peer: PeerInfo;
  invite?: InviteRequest;
  /** Solicitud de invitación que recibí como anfitrión. */
  incoming: boolean;
  ts: number;
}

function shortTime(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} d`;
  return `${Math.floor(days / 7)} sem`;
}

function clockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

export function MessagesScreen() {
  const {
    dmThreads, dmMessages, profile, activeThreadId, openDMThread, closeThread,
    sendThreadMessage, getPeerInfo, inviteRequests, decideInvite, openPeerProfile,
    pendingInviteCount, spots, activeParches, openDM, canViewPrivate, blockedHandles,
  } = useParche();

  const [listTab, setListTab] = useState<ListTab>("main");
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLUListElement>(null);

  const rows = useMemo<ThreadRow[]>(() => {
    return dmThreads
      .map((thread) => {
        const messages = dmMessages
          .filter((m) => m.threadId === thread.id)
          .sort((a, b) => a.createdAt - b.createdAt);
        const last = messages[messages.length - 1];
        const unread = messages.filter((m) => m.senderHandle !== profile.handle && !m.readAt).length;
        const peerHandle = thread.hostHandle === profile.handle ? thread.guestHandle : thread.hostHandle;
        const invite = thread.inviteId ? inviteRequests.find((r) => r.id === thread.inviteId) : undefined;
        return {
          thread, messages, last, unread,
          peer: getPeerInfo(peerHandle),
          invite,
          incoming: !!invite && invite.hostHandle === profile.handle,
          ts: last?.createdAt ?? thread.createdAt,
        };
      })
      .sort((a, b) => b.ts - a.ts);
  }, [dmThreads, dmMessages, profile.handle, inviteRequests, getPeerInfo]);

  const active = rows.find((r) => r.thread.id === activeThreadId);

  // Si se abre una conversación desde otro lugar, muestra la pestaña que le corresponde.
  useEffect(() => {
    if (!active) return;
    setListTab(active.incoming ? "requests" : "main");
    setComposing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId]);

  const messageCount = active?.messages.length ?? 0;
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeThreadId, messageCount]);

  const requestsRows = rows.filter((r) => r.incoming);
  const mainRows = rows.filter((r) => !r.incoming);
  const q = query.trim().toLowerCase();
  const visible = (listTab === "requests" ? requestsRows : mainRows).filter((r) => {
    if (!q) return true;
    return (
      r.peer.name.toLowerCase().includes(q) ||
      r.peer.handle.toLowerCase().includes(q) ||
      r.thread.title.toLowerCase().includes(q) ||
      (r.last?.text.toLowerCase().includes(q) ?? false)
    );
  });

  // Personas a quienes se puede escribir: quienes publicaron parches o spots.
  const contacts = useMemo(() => {
    const map = new Map<string, { handle: string; type: "parche" | "spot"; id: string; title: string }>();
    const add = (type: "parche" | "spot", id: string, hostName: string, title: string) => {
      if (!hostName || hostName === profile.handle || blockedHandles.includes(hostName)) return;
      if (map.has(hostName)) return;
      if (!canViewPrivate(type, id)) return; // los planes por invitación se piden desde el plan
      map.set(hostName, { handle: hostName, type, id, title });
    };
    activeParches.forEach((p) => add("parche", p.id, p.hostName, p.title));
    spots.forEach((s) => add("spot", s.id, s.hostName, s.title));
    return [...map.values()];
  }, [activeParches, spots, profile.handle, blockedHandles, canViewPrivate]);

  const startChat = (c: { handle: string; type: "parche" | "spot"; id: string; title: string }) => {
    setComposing(false);
    if (c.type === "parche") openDM(c.id, undefined, c.handle, c.title);
    else openDM(undefined, c.id, c.handle, c.title);
  };

  const preview = (r: ThreadRow): string => {
    const m = r.last;
    if (!m) return "Sin mensajes todavía";
    const mine = m.senderHandle === profile.handle;
    if (m.kind === "system") {
      return r.thread.hostHandle === profile.handle && m.altText ? m.altText : m.text;
    }
    if (m.kind === "invite_request") {
      return mine ? `Solicitaste invitación: ${m.text || "sin mensaje"}` : `Pide invitación: ${m.text || "sin mensaje"}`;
    }
    return `${mine ? "Tú: " : ""}${m.text}`;
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!activeThreadId || !draft.trim()) return;
    sendThreadMessage(activeThreadId, draft);
    setDraft("");
  };

  const view = active ? "thread" : "list";

  return (
    <section className="messages-screen" data-view={view} aria-label="Mensajes">
      <aside className="msg-list-panel" aria-label="Conversaciones">
        <header className="msg-list-head">
          <h2 className="msg-me">@{profile.handle}</h2>
          <button
            type="button"
            className="msg-icon-btn"
            aria-label="Mensaje nuevo"
            aria-pressed={composing}
            onClick={() => setComposing((v) => !v)}
          >
            <Icons.Compose />
          </button>
        </header>

        {composing ? (
          <div className="msg-compose">
            <p className="msg-compose-title">Escribir a quien publicó</p>
            {contacts.length === 0 ? (
              <p className="msg-empty-list">No hay anfitriones disponibles por ahora.</p>
            ) : (
              <ul className="msg-rows">
                {contacts.map((c) => {
                  const peer = getPeerInfo(c.handle);
                  return (
                    <li key={c.handle}>
                      <button type="button" className="msg-row" onClick={() => startChat(c)}>
                        <Avatar peer={peer} size="lg" />
                        <span className="msg-row-body">
                          <span className="msg-row-name">@{peer.handle}</span>
                          <span className="msg-row-preview">{c.title}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <>
            <div className="msg-search">
              <Icons.Search />
              <input
                type="search"
                placeholder="Buscar"
                aria-label="Buscar conversaciones"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="msg-tabs" role="tablist" aria-label="Tipo de conversación">
              <button
                type="button"
                role="tab"
                id="msg-tab-main"
                aria-selected={listTab === "main"}
                aria-controls="msg-list"
                className={`msg-tab ${listTab === "main" ? "active" : ""}`}
                onClick={() => setListTab("main")}
              >
                Principal
              </button>
              <button
                type="button"
                role="tab"
                id="msg-tab-requests"
                aria-selected={listTab === "requests"}
                aria-controls="msg-list"
                className={`msg-tab ${listTab === "requests" ? "active" : ""}`}
                onClick={() => setListTab("requests")}
              >
                Solicitudes
                {pendingInviteCount > 0 && (
                  <span className="msg-tab-count" aria-label={`${pendingInviteCount} pendientes`}>
                    {pendingInviteCount}
                  </span>
                )}
              </button>
            </div>

            <ul
              id="msg-list"
              className="msg-rows"
              role="tabpanel"
              aria-labelledby={listTab === "main" ? "msg-tab-main" : "msg-tab-requests"}
            >
              {visible.length === 0 && (
                <li className="msg-empty-list">
                  {q
                    ? "Sin resultados."
                    : listTab === "requests"
                      ? "Sin solicitudes de invitación por ahora."
                      : "Aún no tienes conversaciones. Escribe a quien publicó un parche."}
                </li>
              )}
              {visible.map((r) => {
                const selected = r.thread.id === activeThreadId;
                return (
                  <li key={r.thread.id}>
                    <button
                      type="button"
                      className={`msg-row ${selected ? "selected" : ""} ${r.unread > 0 ? "unread" : ""}`}
                      aria-current={selected ? "true" : undefined}
                      onClick={() => openDMThread(r.thread.id)}
                    >
                      <Avatar peer={r.peer} size="lg" />
                      <span className="msg-row-body">
                        <span className="msg-row-top">
                          <span className="msg-row-name">
                            <span className="msg-row-name-text">{r.peer.name}</span>
                            {r.invite && (
                              <span className="msg-row-lock" role="img" aria-label="Plan por invitación"><Icons.Lock /></span>
                            )}
                          </span>
                          {r.invite && r.incoming && (
                            <span className={`invite-chip invite-chip-${r.invite.status}`}>
                              {INVITE_STATUS_LABEL[r.invite.status]}
                            </span>
                          )}
                        </span>
                        <span className="msg-row-preview">
                          {preview(r)} · {shortTime(r.ts)}
                        </span>
                      </span>
                      {r.unread > 0 && (
                        <span className="msg-unread-dot" role="img" aria-label={`${r.unread} sin leer`} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </aside>

      <section className="msg-thread-panel" aria-label={active ? `Conversación con ${active.peer.name}` : "Tus mensajes"}>
        {!active ? (
          <div className="msg-empty">
            <span className="msg-empty-icon" aria-hidden><Icons.Send /></span>
            <h3>Tus mensajes</h3>
            <p>Envía mensajes privados a quien publicó un parche.</p>
            <button type="button" className="btn btn-primary" onClick={() => setComposing(true)}>
              Enviar mensaje
            </button>
          </div>
        ) : (
          <>
            <header className="msg-thread-head">
              <button type="button" className="msg-icon-btn msg-back" onClick={closeThread} aria-label="Volver a mensajes">
                <Icons.Back />
              </button>
              <Avatar peer={active.peer} size="md" />
              <div className="msg-thread-who">
                <strong>
                  {active.peer.name}
                  {active.peer.verified && <VerifiedBadge size="sm" />}
                </strong>
                <span>
                  {active.peer.name !== active.peer.handle ? `@${active.peer.handle} · ` : ""}
                  {active.invite && <Icons.Lock />} {active.thread.title}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary compact msg-profile-btn"
                onClick={() => openPeerProfile(active.peer.handle, active.invite?.id)}
              >
                Ver perfil
              </button>
            </header>

            <ul className="msg-log" ref={logRef} role="log" aria-live="polite" aria-label="Mensajes de la conversación">
              {active.messages.length === 0 && (
                <li className="msg-system">Escribe para coordinar con @{active.peer.handle}.</li>
              )}
              {active.messages.map((m) => {
                if (m.kind === "system" || m.senderHandle === SYSTEM_HANDLE) {
                  const iAmHost = active.thread.hostHandle === profile.handle;
                  return (
                    <li key={m.id} className="msg-system">
                      {iAmHost && m.altText ? m.altText : m.text}
                    </li>
                  );
                }
                if (m.kind === "invite_request" && active.invite) {
                  return (
                    <li key={m.id} className="msg-card-row">
                      <InviteCard
                        invite={active.invite}
                        iAmHost={active.invite.hostHandle === profile.handle}
                        onProfile={() => openPeerProfile(active.invite!.requester.handle, active.invite!.id)}
                        onDecide={(s) => decideInvite(active.invite!.id, s)}
                      />
                    </li>
                  );
                }
                const mine = m.senderHandle === profile.handle;
                return (
                  <li key={m.id} className={`dm-bubble ${mine ? "mine" : "theirs"}`}>
                    <span>{m.text}</span>
                    <time dateTime={new Date(m.createdAt).toISOString()}>{clockTime(m.createdAt)}</time>
                  </li>
                );
              })}
            </ul>

            <form className="msg-composer" onSubmit={send}>
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escribe un mensaje…"
                aria-label="Mensaje"
                autoComplete="off"
                maxLength={500}
              />
              <button
                type="submit"
                className="msg-send"
                aria-label="Enviar mensaje"
                disabled={!draft.trim()}
              >
                <Icons.Send />
              </button>
            </form>
          </>
        )}
      </section>
    </section>
  );
}

interface InviteCardProps {
  invite: InviteRequest;
  iAmHost: boolean;
  onProfile: () => void;
  onDecide: (status: "accepted" | "denied") => void;
}

function InviteCard({ invite, iAmHost, onProfile, onDecide }: InviteCardProps) {
  const { requester } = invite;
  return (
    <article className={`invite-card ${iAmHost ? "is-incoming" : "is-sent"}`} aria-label="Solicitud de invitación">
      <header className="invite-card-head">
        <Avatar peer={requester} size="lg" />
        <div className="invite-card-who">
          <strong>
            {requester.name}
            {requester.verified && <VerifiedBadge size="sm" />}
          </strong>
          <span>@{requester.handle}</span>
        </div>
        <span className={`invite-chip invite-chip-${invite.status}`}>{INVITE_STATUS_LABEL[invite.status]}</span>
      </header>
      <p className="invite-card-plan">
        <Icons.Lock />
        {iAmHost ? "Pide invitación a" : "Solicitaste invitación a"} «{invite.targetTitle}»
      </p>
      <blockquote className={invite.message ? "invite-card-msg" : "invite-card-msg is-empty"}>
        {invite.message || "Sin mensaje"}
      </blockquote>

      {iAmHost && invite.status === "pending" && (
        <div className="invite-card-actions">
          <button type="button" className="btn btn-secondary" onClick={onProfile}>Ver perfil</button>
          <button type="button" className="btn btn-secondary" onClick={() => onDecide("denied")}>
            <Icons.X /> Denegar
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onDecide("accepted")}>
            <Icons.Check /> Aceptar
          </button>
        </div>
      )}
      {iAmHost && invite.status !== "pending" && (
        <div className="invite-card-actions">
          <button type="button" className="btn btn-secondary" onClick={onProfile}>Ver perfil</button>
        </div>
      )}
      {!iAmHost && invite.status === "pending" && (
        <p className="invite-card-foot">Esperando respuesta de @{invite.hostHandle}.</p>
      )}
    </article>
  );
}
