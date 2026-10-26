"use client";

import { useActionState, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { saveProfile, submitForEndorsement } from "@/app/actions/profile";
import { FormMessage, SubmitButton } from "@/components/forms";
import { Avatar } from "@/components/ui";
import type { MenteeProfile, ProfileStatus } from "@/db/schema";

// Downscale to a 320px square JPEG so photos stay small enough to store inline.
async function resizeImage(file: File, size = 320): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  canvas
    .getContext("2d")!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function Field({ label, name, children, className = "" }: { label: string; name: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="label">{label}</label>
      {children}
    </div>
  );
}

export function ProfileForm({
  profile,
  name,
  status,
  completion,
}: {
  profile: MenteeProfile | null;
  name: string;
  status: ProfileStatus;
  completion: number;
}) {
  const [state, action] = useActionState(saveProfile, undefined);
  const [photo, setPhoto] = useState(profile?.photo ?? "");
  const [photoError, setPhotoError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const p = profile ?? ({} as Partial<MenteeProfile>);
  const canSubmit = (status === "draft" || status === "changes_requested") && completion >= 60;

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-6">
        <input type="hidden" name="photo" value={photo} />

        <section className="card p-5 sm:p-6">
          <h2 className="section-title mb-5">Basic details</h2>
          <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar name={name} photo={photo || null} size={88} />
            <div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline px-4 py-2 text-xs">
                  <Camera className="size-4" /> {photo ? "Change photo" : "Upload photo"}
                </button>
                {photo && (
                  <button type="button" onClick={() => setPhoto("")} className="btn-ghost text-xs">
                    <Trash2 className="size-4" /> Remove
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-ink/50">JPG or PNG. It&apos;s cropped to a square and resized automatically.</p>
              {photoError && <p className="mt-1 text-xs font-bold text-ink">{photoError}</p>}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  if (!file.type.startsWith("image/")) return setPhotoError("Please choose an image file.");
                  if (file.size > 10 * 1024 * 1024) return setPhotoError("That image is over 10 MB.");
                  try {
                    setPhoto(await resizeImage(file));
                    setPhotoError("");
                  } catch {
                    setPhotoError("Couldn't read that image.");
                  }
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Full name" name="name">
              <input id="name" value={name} disabled className="input" title="Change your name in Settings" />
            </Field>
            <Field label="USN *" name="usn">
              <input id="usn" name="usn" required defaultValue={p.usn ?? ""} placeholder="4NM23IS041" className="input uppercase" />
            </Field>
            <Field label="Date of birth" name="dob">
              <input id="dob" name="dob" type="date" defaultValue={p.dob ?? ""} className="input" />
            </Field>
            <Field label="Semester *" name="semester">
              <select id="semester" name="semester" required defaultValue={p.semester ?? ""} className="input">
                <option value="" disabled>Select</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </Field>
            <Field label="Section" name="section">
              <input id="section" name="section" defaultValue={p.section ?? ""} maxLength={2} className="input uppercase" />
            </Field>
            <Field label="CGPA" name="cgpa">
              <input id="cgpa" name="cgpa" type="number" step="0.01" min="0" max="10" defaultValue={p.cgpa ?? ""} className="input" />
            </Field>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="section-title mb-5">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" name="phone">
              <input id="phone" name="phone" type="tel" defaultValue={p.phone ?? ""} className="input" />
            </Field>
            <Field label="Address" name="address">
              <input id="address" name="address" defaultValue={p.address ?? ""} className="input" />
            </Field>
            <Field label="Parent / guardian name" name="guardianName">
              <input id="guardianName" name="guardianName" defaultValue={p.guardianName ?? ""} className="input" />
            </Field>
            <Field label="Parent / guardian phone" name="guardianPhone">
              <input id="guardianPhone" name="guardianPhone" type="tel" defaultValue={p.guardianPhone ?? ""} className="input" />
            </Field>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="section-title mb-1">About you</h2>
          <p className="mb-5 text-xs text-ink/50">Separate multiple hobbies, skills or interests with commas.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hobbies" name="hobbies">
              <input id="hobbies" name="hobbies" defaultValue={p.hobbies ?? ""} placeholder="Music, football, sketching" className="input" />
            </Field>
            <Field label="Skills" name="skills">
              <input id="skills" name="skills" defaultValue={p.skills ?? ""} placeholder="Python, React, public speaking" className="input" />
            </Field>
            <Field label="Areas of interest" name="interests">
              <input id="interests" name="interests" defaultValue={p.interests ?? ""} placeholder="AI, web development" className="input" />
            </Field>
            <Field label="Career goal" name="careerGoal">
              <input id="careerGoal" name="careerGoal" defaultValue={p.careerGoal ?? ""} placeholder="Software engineer, higher studies…" className="input" />
            </Field>
            <Field label="Achievements" name="achievements" className="sm:col-span-2">
              <textarea id="achievements" name="achievements" rows={2} defaultValue={p.achievements ?? ""} className="input" />
            </Field>
            <Field label="Short bio" name="bio" className="sm:col-span-2">
              <textarea id="bio" name="bio" rows={3} defaultValue={p.bio ?? ""} placeholder="A few lines about yourself for your mentor." className="input" />
            </Field>
          </div>
        </section>

        <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-mist bg-white/95 px-4 py-4 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:rounded-2xl sm:border sm:px-5">
          <div className="flex-1">
            <FormMessage state={state} />
          </div>
          <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
        </div>
      </form>

      {(status === "draft" || status === "changes_requested") && (
        <form action={submitForEndorsement} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex-1">
            <h2 className="font-bold text-ink">Ready for endorsement?</h2>
            <p className="text-sm text-ink/60">
              {canSubmit
                ? "Save your changes first, then send your profile to the administrator."
                : `Your profile is ${completion}% complete. Reach 60% to submit it.`}
            </p>
          </div>
          <button type="submit" disabled={!canSubmit} className="btn-navy">Submit for endorsement</button>
        </form>
      )}
    </div>
  );
}
