"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminLinkReveal } from "@/components/zone/AdminLinkReveal";
import { ZoneForm } from "@/components/zone/ZoneForm";
import { createZoneAction } from "@/lib/db/actions";
import type { ZoneFormData } from "@/types/fire";

export default function NewZonePage() {
  const [created, setCreated] = useState<{
    id: string;
    adminToken: string;
  } | null>(null);

  const handleSubmit = async (data: ZoneFormData) => {
    const result = await createZoneAction(data);
    if (result.ok) {
      setCreated({ id: result.id, adminToken: result.adminToken });
      return { ok: true };
    }
    return { ok: false, error: result.error };
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-zinc-50 p-4">
      <header className="mb-6">
        <Link
          href="/"
          className="inline-flex min-h-[48px] min-w-[48px] items-center gap-2 text-zinc-600 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          tabIndex={0}
          aria-label="Retour à l'accueil"
        >
          ← Retour
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          {created ? "Zone créée" : "Nouvelle zone d'incendie"}
        </h1>
      </header>
      {created ? (
        <AdminLinkReveal zoneId={created.id} adminToken={created.adminToken} />
      ) : (
        <ZoneForm submitLabel="Créer la zone" onSubmit={handleSubmit} />
      )}
    </div>
  );
}
