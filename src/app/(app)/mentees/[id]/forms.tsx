"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addNote, scheduleMeeting } from "@/app/actions/mentoring";
import { FormMessage, SubmitButton } from "@/components/forms";

export function NoteForm({ menteeId }: { menteeId: number }) {
  const [state, action] = useActionState(addNote.bind(null, menteeId), undefined);
  const [kind, setKind] = useState<"recommendation" | "note">("recommendation");
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3 rounded-2xl bg-canvas p-4">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Type">
        {(["recommendation", "note"] as const).map((k) => (
          <label key={k} className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold transition ${kind === k ? "bg-navy text-white" : "bg-white text-ink/70"}`}>
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
            {k === "recommendation" ? "Recommendation" : "Note"}
          </label>
        ))}
      </div>
      <input name="title" required placeholder={kind === "recommendation" ? "What do you recommend?" : "Note title"} className="input" />
      <textarea name="body" required rows={3} placeholder="Details…" className="input" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {kind === "note" ? (
          <label className="flex flex-1 items-center gap-2 text-xs text-ink/70">
            <input type="checkbox" name="isPrivate" className="size-4 accent-teal" defaultChecked />
            Private — hide from the mentee (staff only)
          </label>
        ) : (
          <p className="flex-1 text-xs text-ink/55">Recommendations are always visible to the mentee.</p>
        )}
        <SubmitButton pendingText="Saving…">Add {kind}</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function MeetingForm({ menteeId }: { menteeId: number }) {
  const [state, action] = useActionState(scheduleMeeting.bind(null, menteeId), undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3 rounded-2xl bg-canvas p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <input name="scheduledAt" type="datetime-local" required aria-label="Date and time" className="input" />
        <input name="agenda" required placeholder="Agenda" className="input" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1"><FormMessage state={state} /></div>
        <SubmitButton className="btn-navy" pendingText="Scheduling…">Schedule meeting</SubmitButton>
      </div>
    </form>
  );
}
