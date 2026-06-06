"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { traduzSupabaseError } from "@/lib/supabase/errors";
import { Button } from "@/components/ui/button";
import { FormField, FormMessage, Input } from "@/components/ui/input";
import { DeleteButton } from "@/components/cadastros/delete-button";

export type YardFormData = {
  id?: string;
  name?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export function YardForm({ initial }: { initial?: YardFormData }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [lat, setLat] = useState(initial?.lat != null ? String(initial.lat) : "");
  const [lng, setLng] = useState(initial?.lng != null ? String(initial.lng) : "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const supabase = createSupabaseBrowserClient();

    const { data: member } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .limit(1)
      .maybeSingle();
    const tenantId = member?.tenant_id;
    if (!tenantId) {
      setMsg({ kind: "err", text: "Sua conta ainda não tem empresa." });
      setSaving(false);
      return;
    }

    const payload = {
      name,
      address: address || null,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
    };

    if (editing && initial?.id) {
      const { error } = await supabase.from("yards").update(payload).eq("id", initial.id);
      if (error) { setMsg({ kind: "err", text: traduzSupabaseError(error.message) }); setSaving(false); return; }
      setMsg({ kind: "ok", text: "Pátio atualizado." });
      router.refresh();
    } else {
      const { error } = await supabase.from("yards").insert({ ...payload, tenant_id: tenantId });
      if (error) { setMsg({ kind: "err", text: traduzSupabaseError(error.message) }); setSaving(false); return; }
      router.push("/cadastros/patios");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="Nome do pátio" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Pátio Marralog · BH" />
      </FormField>
      <FormField label="Endereço">
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Industrial, 1500" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Latitude">
          <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-19.91667" />
        </FormField>
        <FormField label="Longitude">
          <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-43.94167" />
        </FormField>
      </div>

      {msg ? <FormMessage kind={msg.kind}>{msg.text}</FormMessage> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {editing && initial?.id ? (
          <DeleteButton table="yards" id={initial.id} redirectTo="/cadastros/patios" />
        ) : <span />}
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar pátio"}
        </Button>
      </div>
    </form>
  );
}
