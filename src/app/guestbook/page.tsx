import type { Metadata } from "next";
import { Guestbook } from "@/components/guestbook/guestbook";

export const metadata: Metadata = {
  title: "Guestbook",
  description: "Leave a message. Say hi, drop a link, or just wave.",
};

export default function GuestbookPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <header className="mb-12 max-w-2xl">
        <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">
          Guestbook
        </h1>
        <p className="text-lg text-secondary">
          Made it this far? Leave a note. Say hi, drop a link to your work, or
          tell me what you&apos;re building.
        </p>
      </header>

      <Guestbook />
    </div>
  );
}
