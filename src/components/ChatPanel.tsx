"use client";

/**
 * دردشة الطلب داخل المنصة — خصوصية كاملة: تتواصل بدون ما تشارك رقمك.
 *
 * مكوّن مشترك: الزبون يمرر endpoint حسابه، والأسطى endpoint سوق الشغل.
 * تحديث تلقائي كل 6 ثوانٍ وأثناء الإرسال.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  sender: "customer" | "tradesman";
  body: string;
  created_at: string;
};

export function ChatPanel({
  endpoint,
  me,
}: {
  endpoint: string;
  me: "customer" | "tradesman";
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const stickToBottom = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint);
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        messages?: Message[];
        error?: string;
      };
      if (data.ok && Array.isArray(data.messages)) {
        setMessages(data.messages);
        setError(null);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      // شبكة متقطعة — التحديث الجاي يعوّض
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 6000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (stickToBottom.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (data.ok) {
        setDraft("");
        await load();
      } else {
        setError(data.error ?? "فشل إرسال الرسالة.");
      }
    } catch {
      setError("مشكلة في الاتصال — حاول مرة ثانية.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: "16px",
        overflow: "hidden",
        background: "var(--paper-2, transparent)",
      }}
    >
      <div
        className="mono"
        style={{
          padding: "10px 16px",
          fontSize: "10.5px",
          letterSpacing: "0.1em",
          color: "var(--ink-3)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        💬 دردشة داخل توّا — رقمك يظل مخفي، تتواصل بأمان
      </div>

      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
        style={{
          height: "260px",
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {messages.length === 0 ? (
          <p
            style={{
              color: "var(--ink-3)",
              fontSize: "13.5px",
              margin: "auto",
              textAlign: "center",
            }}
          >
            ابدأ المحادثة — اتفقوا على الموعد والتفاصيل من هنا.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender === me;
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: mine ? "flex-start" : "flex-end",
                  maxWidth: "78%",
                  padding: "9px 14px",
                  borderRadius: mine
                    ? "16px 16px 16px 4px"
                    : "16px 16px 4px 16px",
                  background: mine
                    ? "linear-gradient(135deg, #10B981, #0B7F58)"
                    : "var(--paper)",
                  border: mine ? "none" : "1px solid var(--line)",
                  color: mine ? "#fff" : "var(--ink)",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {m.body}
                <div
                  style={{
                    fontSize: "10px",
                    opacity: 0.7,
                    marginTop: "4px",
                    direction: "ltr",
                    textAlign: mine ? "left" : "right",
                  }}
                >
                  {m.created_at.slice(11, 16)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {error ? (
        <p
          style={{
            margin: 0,
            padding: "8px 16px",
            fontSize: "12.5px",
            color: "#B23F4E",
            borderTop: "1px solid var(--line)",
          }}
        >
          {error}
        </p>
      ) : null}

      <form
        onSubmit={send}
        style={{
          display: "flex",
          gap: "8px",
          padding: "12px",
          borderTop: "1px solid var(--line)",
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="اكتب رسالتك…"
          maxLength={1000}
          disabled={sending}
          aria-label="نص الرسالة"
          style={{
            flex: 1,
            padding: "11px 16px",
            borderRadius: "999px",
            border: "1px solid var(--line)",
            background: "var(--paper)",
            color: "var(--ink)",
            fontSize: "14px",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          style={{
            padding: "11px 22px",
            borderRadius: "999px",
            border: 0,
            background: "linear-gradient(135deg, #10B981, #0B7F58)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            opacity: sending || !draft.trim() ? 0.6 : 1,
          }}
        >
          {sending ? "…" : "أرسل"}
        </button>
      </form>
    </div>
  );
}
