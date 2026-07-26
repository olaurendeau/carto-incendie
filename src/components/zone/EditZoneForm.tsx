"use client";

import { useRouter } from "next/navigation";
import { ZoneForm } from "@/components/zone/ZoneForm";
import { updateZoneAction } from "@/lib/db/actions";
import type { ZoneFormData } from "@/types/fire";

type EditZoneFormProps = {
  zoneId: string;
  token: string;
  initialData: ZoneFormData;
};

export const EditZoneForm = ({
  zoneId,
  token,
  initialData,
}: EditZoneFormProps) => {
  const router = useRouter();

  const handleSubmit = async (data: ZoneFormData) => {
    const result = await updateZoneAction(zoneId, token, data);
    if (result.ok) {
      router.push(`/zone/${zoneId}`);
      return { ok: true };
    }
    return { ok: false, error: result.error };
  };

  return (
    <ZoneForm
      initialData={initialData}
      submitLabel="Enregistrer les modifications"
      onSubmit={handleSubmit}
    />
  );
};
