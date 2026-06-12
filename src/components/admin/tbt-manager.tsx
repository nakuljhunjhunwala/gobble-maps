"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { TbtRow } from "@/lib/types";
import { DataRow } from "@/components/admin/data-row";
import { IconButton } from "@/components/admin/icon-button";
import { PageHeader } from "@/components/admin/page-header";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { Icon } from "@/components/icons";
import { addTbt, deleteTbt } from "@/app/admin/(panel)/to-be-tried/actions";

export interface TbtManagerProps {
  items: TbtRow[];
}

const EMPTY_FORM = { name: "", address: "", notes: "" };

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

export function TbtManager({ items }: TbtManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(EMPTY_FORM);

  const add = () => {
    if (!form.name.trim() || isPending) return;
    startTransition(async () => {
      const res = await addTbt({
        name: form.name.trim(),
        address: form.address,
        notes: form.notes,
      });
      if (!res.ok) {
        toast(res.error);
        return;
      }
      setForm(EMPTY_FORM);
      toast("Added to your pipeline");
    });
  };

  const visited = (item: TbtRow) => {
    if (isPending) return;
    // The pipeline row is left untouched here; it stays pending until
    // upsertPlace deletes it on a successful save (tbt id is deep-linked
    // below). Abandoning the prefilled editor leaves the row safe.
    toast(`Moving “${item.name}” to a full listing — fill in the review`);
    const params = new URLSearchParams({
      new: "1",
      tbt: item.id,
      name: item.name,
      address: item.address ?? "",
      note: item.notes ?? "",
    });
    router.push(`/admin/places?${params.toString()}`);
  };

  const remove = (item: TbtRow) => {
    if (isPending) return;
    startTransition(async () => {
      const res = await deleteTbt(item.id);
      if (!res.ok) toast(res.error);
    });
  };

  return (
    <div data-screen-label="Admin To Be Tried">
      <PageHeader
        title="To Be Tried"
        sub="Your private pipeline — never visible to users"
      />
      <div className="ad-card" style={{ marginBottom: 14 }}>
        <p className="ad-card-title">Add to pipeline</p>
        <div className="ad-form" style={{ gap: 10 }}>
          <Field label="Place name">
            <input
              className="gb-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Address / area">
            <input
              className="gb-input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Why it's on the list" span2>
            <input
              className="gb-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div>
            <button
              type="button"
              className="gb-btn gb-btn-sm"
              disabled={isPending}
              onClick={add}
            >
              <Icon name="plus" size={14} strokeWidth={2.6} /> Add
            </button>
          </div>
        </div>
      </div>
      <div className="ad-rows">
        {items.map((item) => (
          <DataRow
            key={item.id}
            icon="pinOutline"
            main={
              <>
                <span className="ad-row-name">{item.name}</span>
                <span className="ad-sub">
                  {item.address} · added {formatDate(item.created_at)}
                </span>
                <span
                  style={{ fontSize: 12, color: "var(--gb-ink)", marginTop: 2 }}
                >
                  {item.notes}
                </span>
              </>
            }
            actions={
              <>
                <button
                  type="button"
                  className="gb-btn gb-btn-sm"
                  style={{ background: "#E8F5EC", color: "#15803D" }}
                  disabled={isPending}
                  onClick={() => visited(item)}
                >
                  <Icon name="check" size={13} strokeWidth={2.6} /> Visited —
                  create listing
                </button>
                <IconButton
                  icon="x"
                  title="Remove from pipeline"
                  danger
                  size={14}
                  strokeWidth={2.4}
                  onClick={() => remove(item)}
                />
              </>
            }
          />
        ))}
        {items.length === 0 && (
          <p className="gb-empty" style={{ padding: 20 }}>
            Pipeline is empty — go scout something.
          </p>
        )}
      </div>
    </div>
  );
}
