"use client";

import { useState, useEffect } from "react";
import {
  Section,
  inputClass,
  labelClass,
  moveItem,
  textareaClass,
} from "./editor-primitives";
import type { AboutContent, Certificate, TimelineEntry } from "@/lib/about-types";
import { DEFAULT_ABOUT_CONTENT } from "@/lib/about-defaults";

export function AboutEditor() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  useEffect(() => {
    async function loadAbout() {
      try {
        const res = await fetch("/api/admin/about");
        if (res.ok) {
          const data = await res.json();
          setContent(data.content);
          setUpdatedAt(data.updatedAt);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    void loadAbout();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const data = await res.json();
        setUpdatedAt(data.updatedAt);
        setNotice({ tone: "ok", text: "Saved. /about is live with these words." });
      } else {
        const data = await res.json().catch(() => ({}));
        setNotice({ tone: "bad", text: `Save failed: ${data.error ?? res.statusText}` });
      }
    } catch (err) {
      setNotice({ tone: "bad", text: `Save failed: ${String(err)}` });
    } finally {
      setSaving(false);
    }
  };

  const updateBio = (index: number, value: string) => {
    setContent((prev) => ({
      ...prev,
      bio: prev.bio.map((p, i) => (i === index ? value : p)),
    }));
  };

  const addBio = () => {
    setContent((prev) => ({ ...prev, bio: [...prev.bio, ""] }));
  };

  const removeBio = (index: number) => {
    setContent((prev) => ({
      ...prev,
      bio: prev.bio.filter((_, i) => i !== index),
    }));
  };

  const updateCertificate = (
    index: number,
    field: keyof Certificate,
    value: string
  ) => {
    setContent((prev) => ({
      ...prev,
      certificates: prev.certificates.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      ),
    }));
  };

  const addCertificate = () => {
    setContent((prev) => ({
      ...prev,
      certificates: [
        ...prev.certificates,
        { title: "", issuer: "", url: "https://" },
      ],
    }));
  };

  const removeCertificate = (index: number) => {
    setContent((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index),
    }));
  };

  const updateTimeline = (
    index: number,
    field: keyof TimelineEntry,
    value: string | string[]
  ) => {
    setContent((prev) => ({
      ...prev,
      timeline: prev.timeline.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const addTimeline = () => {
    setContent((prev) => ({
      ...prev,
      timeline: [
        ...prev.timeline,
        {
          period: "",
          role: "",
          company: "",
          location: "",
          highlights: [""],
        },
      ],
    }));
  };

  const removeTimeline = (index: number) => {
    setContent((prev) => ({
      ...prev,
      timeline: prev.timeline.filter((_, i) => i !== index),
    }));
  };

  const updateHighlight = (
    entryIndex: number,
    highlightIndex: number,
    value: string
  ) => {
    setContent((prev) => ({
      ...prev,
      timeline: prev.timeline.map((entry, i) =>
        i === entryIndex
          ? {
              ...entry,
              highlights: entry.highlights.map((h, j) =>
                j === highlightIndex ? value : h
              ),
            }
          : entry
      ),
    }));
  };

  const addHighlight = (entryIndex: number) => {
    setContent((prev) => ({
      ...prev,
      timeline: prev.timeline.map((entry, i) =>
        i === entryIndex
          ? { ...entry, highlights: [...entry.highlights, ""] }
          : entry
      ),
    }));
  };

  const removeHighlight = (entryIndex: number, highlightIndex: number) => {
    setContent((prev) => ({
      ...prev,
      timeline: prev.timeline.map((entry, i) =>
        i === entryIndex
          ? {
              ...entry,
              highlights: entry.highlights.filter((_, j) => j !== highlightIndex),
            }
          : entry
      ),
    }));
  };

  const skillCategories = Object.entries(content.skills);

  const updateSkillCategory = (index: number, name: string) => {
    const entries = Object.entries(content.skills);
    const [oldName] = entries[index];
    if (oldName === name) return;
    const next: Record<string, string[]> = {};
    entries.forEach(([key, value], i) => {
      next[i === index ? name : key] = value;
    });
    setContent((prev) => ({ ...prev, skills: next }));
  };

  const updateSkillTags = (category: string, tags: string) => {
    setContent((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      },
    }));
  };

  const addSkillCategory = () => {
    setContent((prev) => ({
      ...prev,
      skills: { ...prev.skills, "New Category": [] },
    }));
  };

  const removeSkillCategory = (category: string) => {
    setContent((prev) => {
      const next = { ...prev.skills };
      delete next[category];
      return { ...prev, skills: next };
    });
  };

  if (loading) {
    return (
      <div className="ad-rows" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="ad-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="ad-bar">
        <div>
          <h1 className="ad-title">About, in my words</h1>
          <p>
            Everything on /about except the layout. Saving publishes it
            {updatedAt ? ` — last saved ${new Date(updatedAt).toLocaleString()}.` : "."}
          </p>
        </div>
        <div className="ad-actions">
          <a href="/about" target="_blank" rel="noopener noreferrer" className="ad-link">
            View page ↗
          </a>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="sg-cta"
            data-fill="true"
          >
            {saving ? "Saving…" : "Save about page"}
          </button>
        </div>
      </div>

      {notice && (
        <div className="ad-notice" data-tone={notice.tone} role="status">
          <span>{notice.text}</span>
          <span className="ad-notice-actions">
            <button type="button" className="ad-link" onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </span>
        </div>
      )}

      <Section title="Bio">
        {content.bio.map((paragraph, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              value={paragraph}
              onChange={(e) => updateBio(i, e.target.value)}
              rows={3}
              placeholder={`Bio paragraph ${i + 1}`}
              className={textareaClass}
            />
            <button
              type="button"
              onClick={() => removeBio(i)}
              disabled={content.bio.length <= 1}
              className="ad-link"
              data-tone="danger"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addBio}
          className="ad-link"
        >
          + Add paragraph
        </button>
      </Section>

      <Section title="Availability">
        <div>
          <label className={labelClass}>Status label</label>
          <input
            value={content.availability.label}
            onChange={(e) =>
              setContent((prev) => ({
                ...prev,
                availability: { ...prev.availability, label: e.target.value },
              }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Message</label>
          <textarea
            value={content.availability.message}
            onChange={(e) =>
              setContent((prev) => ({
                ...prev,
                availability: { ...prev.availability, message: e.target.value },
              }))
            }
            rows={4}
            className={textareaClass}
          />
        </div>
      </Section>

      <Section title="Education">
        <div className="ad-grid-2">
          <div>
            <label className={labelClass}>Degree</label>
            <input
              value={content.education.degree}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  education: { ...prev.education, degree: e.target.value },
                }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Institution</label>
            <input
              value={content.education.institution}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  education: { ...prev.education, institution: e.target.value },
                }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input
              value={content.education.location}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  education: { ...prev.education, location: e.target.value },
                }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Period</label>
            <input
              value={content.education.period}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  education: { ...prev.education, period: e.target.value },
                }))
              }
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>GPA (optional)</label>
            <input
              value={content.education.gpa ?? ""}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  education: {
                    ...prev.education,
                    gpa: e.target.value || undefined,
                  },
                }))
              }
              className={inputClass}
            />
          </div>
        </div>
      </Section>

      <Section title="Certifications">
        {content.certificates.map((cert, i) => (
          <div
            key={i}
            className="ad-sub space-y-3"
          >
            <div className="ad-sub-head">
              <span className="sg-micro">Certificate {i + 1}</span>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      certificates: moveItem(prev.certificates, i, -1),
                    }))
                  }
                  disabled={i === 0}
                  className="ad-link"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      certificates: moveItem(prev.certificates, i, 1),
                    }))
                  }
                  disabled={i === content.certificates.length - 1}
                  className="ad-link"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => removeCertificate(i)}
                  className="ad-link"
                  data-tone="danger"
                >
                  Remove
                </button>
              </div>
            </div>
            <input
              value={cert.title}
              onChange={(e) => updateCertificate(i, "title", e.target.value)}
              placeholder="Title"
              className={inputClass}
            />
            <input
              value={cert.issuer}
              onChange={(e) => updateCertificate(i, "issuer", e.target.value)}
              placeholder="Issuer"
              className={inputClass}
            />
            <input
              value={cert.url}
              onChange={(e) => updateCertificate(i, "url", e.target.value)}
              placeholder="URL"
              className={inputClass}
            />
            <input
              value={cert.issuedAt ?? ""}
              onChange={(e) => updateCertificate(i, "issuedAt", e.target.value)}
              placeholder="Issued date (optional)"
              className={inputClass}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addCertificate}
          className="ad-link"
        >
          + Add certificate
        </button>
      </Section>

      <Section title="Experience">
        {content.timeline.map((entry, i) => (
          <div
            key={i}
            className="ad-sub space-y-3"
          >
            <div className="ad-sub-head">
              <span className="sg-micro">Role {i + 1}</span>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      timeline: moveItem(prev.timeline, i, -1),
                    }))
                  }
                  disabled={i === 0}
                  className="ad-link"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      timeline: moveItem(prev.timeline, i, 1),
                    }))
                  }
                  disabled={i === content.timeline.length - 1}
                  className="ad-link"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => removeTimeline(i)}
                  className="ad-link"
                  data-tone="danger"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="ad-grid-2">
              <input
                value={entry.role}
                onChange={(e) => updateTimeline(i, "role", e.target.value)}
                placeholder="Role"
                className={inputClass}
              />
              <input
                value={entry.company}
                onChange={(e) => updateTimeline(i, "company", e.target.value)}
                placeholder="Company"
                className={inputClass}
              />
              <input
                value={entry.period}
                onChange={(e) => updateTimeline(i, "period", e.target.value)}
                placeholder="Period"
                className={inputClass}
              />
              <input
                value={entry.location ?? ""}
                onChange={(e) => updateTimeline(i, "location", e.target.value)}
                placeholder="Location (optional)"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Highlights</label>
              <div className="mt-2 space-y-2">
                {entry.highlights.map((highlight, j) => (
                  <div key={j} className="flex gap-2">
                    <input
                      value={highlight}
                      onChange={(e) => updateHighlight(i, j, e.target.value)}
                      placeholder={`Highlight ${j + 1}`}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeHighlight(i, j)}
                      disabled={entry.highlights.length <= 1}
                      className="ad-link"
              data-tone="danger"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addHighlight(i)}
                  className="ad-link"
                >
                  + Add highlight
                </button>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addTimeline}
          className="ad-link"
        >
          + Add experience
        </button>
      </Section>

      <Section title="Skills">
        {skillCategories.map(([category, items], i) => (
          <div
            key={`${category}-${i}`}
            className="ad-sub space-y-3"
          >
            <div className="ad-sub-head">
              <input
                value={category}
                onChange={(e) => updateSkillCategory(i, e.target.value)}
                placeholder="Category name"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeSkillCategory(category)}
                className="ad-link"
                data-tone="danger"
              >
                Remove
              </button>
            </div>
            <input
              value={items.join(", ")}
              onChange={(e) => updateSkillTags(category, e.target.value)}
              placeholder="Skills (comma-separated)"
              className={inputClass}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addSkillCategory}
          className="ad-link"
        >
          + Add category
        </button>
      </Section>
    </div>
  );
}
