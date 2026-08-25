"use client";

import { useState } from "react";
import { useDesk } from "./store";

/**
 * Settings.
 *
 * Grouped by what breaks if you get it wrong, rather than by which table the
 * value lives in — identity, delivery, then the machinery. Each group saves on
 * its own, so a change to one thing does not require scrolling 5,000px back to
 * a single Save button at the top of the page, which is what the production
 * About editor asks for across 66 inputs.
 */
export function Settings() {
  const { toast } = useDesk();

  return (
    <div className="fn-desk-page fn-settings">
      <header className="fn-desk-head">
        <div>
          <h1 className="fn-settings-title">Settings</h1>
          <p className="fn-settings-sub">
            Three groups. Each one saves independently.
          </p>
        </div>
      </header>

      <Group
        title="Identity"
        note="What a stranger reads first, and what search engines index."
        fields={[
          { label: "Name", value: "Syed Muhammad Maaz", hint: "Used in the wordmark, the Person schema, and email from-lines." },
          { label: "Handle", value: "maazaowski", hint: "Subordinate to the name. GitHub, RSS author, footer." },
          { label: "One line", value: "I build systems that have to keep working after I leave the room.", hint: "The homepage statement and the default meta description." },
          { label: "Location", value: "Karachi, PK", hint: "" },
        ]}
        onSave={() => toast({ tone: "ok", message: "Identity saved. The homepage will show it immediately." })}
      />

      <Group
        title="Delivery"
        note="How writing reaches people once it is published."
        fields={[
          { label: "Feed", value: "Full text", hint: "Full content in RSS, not a teaser. Readers who use a feed reader want the essay, not a click." },
          { label: "From address", value: "maaz@maazaowski.com", hint: "Verified. Subscribers see this." },
          { label: "Send policy", value: "Manual, per essay", hint: "Nothing is emailed automatically on publish. Publishing and broadcasting are separate decisions." },
        ]}
        onSave={() => toast({ tone: "ok", message: "Delivery saved." })}
      />

      <Group
        title="Machinery"
        note="Nothing here is visible to a reader. It is here so you can tell whether it is working."
        fields={[
          { label: "Cache", value: "Purge on write", hint: "Publishing, unpublishing and deleting invalidate the page, the index, the feed and the sitemap immediately." },
          { label: "GitHub sync", value: "Every 6 hours", hint: "Last run: never. Project stat strips stay hidden until a sync succeeds, rather than rendering empty." },
          { label: "Analytics", value: "Vercel, no cookies", hint: "" },
        ]}
        onSave={() => toast({ tone: "ok", message: "Machinery saved." })}
      />
    </div>
  );
}

function Group({
  title,
  note,
  fields,
  onSave,
}: {
  title: string;
  note: string;
  fields: { label: string; value: string; hint: string }[];
  onSave: () => void;
}) {
  const [values, setValues] = useState(fields.map((f) => f.value));
  const [dirty, setDirty] = useState(false);

  return (
    <section className="fn-settings-group">
      <header className="fn-settings-head">
        <div>
          <h2 className="fn-label">{title}</h2>
          <p className="fn-settings-note">{note}</p>
        </div>
        <button
          type="button"
          className="fn-btn"
          data-variant={dirty ? "primary" : "quiet"}
          disabled={!dirty}
          onClick={() => {
            setDirty(false);
            onSave();
          }}
        >
          {dirty ? "Save changes" : "Saved"}
        </button>
      </header>

      <div className="fn-settings-fields">
        {fields.map((f, i) => (
          <label key={f.label}>
            <span className="fn-label">{f.label}</span>
            <input
              className="fn-field"
              value={values[i]}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                setValues(next);
                setDirty(true);
              }}
            />
            {f.hint && <span className="fn-field-note fn-mono">{f.hint}</span>}
          </label>
        ))}
      </div>
    </section>
  );
}
