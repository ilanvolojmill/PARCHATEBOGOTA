import { useState } from "react";
import { useParche } from "../context/ParcheContext";
import { formatTimeAgo } from "../lib/geo";
import type { ContentTargetType } from "../lib/types";

interface CommentsSectionProps {
  targetType: ContentTargetType;
  targetId: string;
}

export function CommentsSection({ targetType, targetId }: CommentsSectionProps) {
  const { getComments, addComment, profile } = useParche();
  const [text, setText] = useState("");
  const list = getComments(targetType, targetId);

  const submit = () => {
    if (!text.trim()) return;
    addComment(targetType, targetId, text);
    setText("");
  };

  return (
    <section className="comments-section">
      <h4>Comentarios ({list.length})</h4>
      <ul className="comments-list">
        {list.length === 0 ? (
          <li className="comments-empty">Sé el primero en comentar</li>
        ) : (
          list.map((c) => (
            <li key={c.id} className="comment-item">
              {c.authorAvatar && <img src={c.authorAvatar} alt="" />}
              <article>
                <span className="comment-author">@{c.authorHandle}</span>
                <p>{c.text}</p>
                <small>{formatTimeAgo(c.createdAt)}</small>
              </article>
            </li>
          ))
        )}
      </ul>
      <div className="comment-input-row">
        <input
          type="text"
          placeholder={`Comentar como @${profile.handle}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button type="button" className="text-btn accent" onClick={submit} disabled={!text.trim()}>
          Enviar
        </button>
      </div>
    </section>
  );
}
