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
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to save: ${data.error ?? res.statusText}`);
      }
    } catch (err) {
      alert(`Error: ${String(err)}`);
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
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl animate-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary">
            Edit your About page content. Changes appear on the public site after
            save.
          </p>
          {updatedAt && (
            <p className="text-xs text-muted mt-1">
              Last saved: {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-glass-border bg-glass-bg px-4 py-2 text-sm text-secondary hover:text-primary transition-all"
          >
            View page
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-accent-blue px-6 py-2 text-sm font-medium text-white hover:bg-accent-purple transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save About Page"}
          </button>
        </div>
      </div>

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
              className="text-xs text-error hover:text-error/80 px-2 disabled:opacity-30"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addBio}
          className="text-xs text-accent-blue hover:text-accent-purple"
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
            className={`${inputClass} mt-1`}
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
            className={`${textareaClass} mt-1`}
          />
        </div>
      </Section>

      <Section title="Education">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              className={`${inputClass} mt-1`}
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
              className={`${inputClass} mt-1`}
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
              className={`${inputClass} mt-1`}
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
              className={`${inputClass} mt-1`}
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
              className={`${inputClass} mt-1`}
            />
          </div>
        </div>
      </Section>

      <Section title="Certifications">
        {content.certificates.map((cert, i) => (
          <div
            key={i}
            className="rounded-xl border border-glass-border bg-surface-1 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Certificate {i + 1}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      certificates: moveItem(prev.certificates, i, -1),
                    }))
                  }
                  disabled={i === 0}
                  className="text-xs text-secondary hover:text-primary disabled:opacity-30"
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
                  className="text-xs text-secondary hover:text-primary disabled:opacity-30"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => removeCertificate(i)}
                  className="text-xs text-error hover:text-error/80"
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
          className="text-xs text-accent-blue hover:text-accent-purple"
        >
          + Add certificate
        </button>
      </Section>

      <Section title="Experience">
        {content.timeline.map((entry, i) => (
          <div
            key={i}
            className="rounded-xl border border-glass-border bg-surface-1 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Role {i + 1}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      timeline: moveItem(prev.timeline, i, -1),
                    }))
                  }
                  disabled={i === 0}
                  className="text-xs text-secondary hover:text-primary disabled:opacity-30"
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
                  className="text-xs text-secondary hover:text-primary disabled:opacity-30"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => removeTimeline(i)}
                  className="text-xs text-error hover:text-error/80"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className="text-xs text-error hover:text-error/80 px-2 disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addHighlight(i)}
                  className="text-xs text-accent-blue hover:text-accent-purple"
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
          className="text-xs text-accent-blue hover:text-accent-purple"
        >
          + Add experience
        </button>
      </Section>

      <Section title="Skills">
        {skillCategories.map(([category, items], i) => (
          <div
            key={`${category}-${i}`}
            className="rounded-xl border border-glass-border bg-surface-1 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <input
                value={category}
                onChange={(e) => updateSkillCategory(i, e.target.value)}
                placeholder="Category name"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeSkillCategory(category)}
                className="text-xs text-error hover:text-error/80 px-2 shrink-0"
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
          className="text-xs text-accent-blue hover:text-accent-purple"
        >
          + Add category
        </button>
      </Section>
    </div>
  );
}
