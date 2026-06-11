"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { IconButton } from "@/components/admin/icon-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Icon } from "@/components/icons";
import type {
  FilterOptionsByCategory,
  FilterOptionWithUsage,
} from "@/lib/admin/queries";
import type { FilterCategory } from "@/lib/types";
import {
  addOption,
  removeOption,
  renameOption,
} from "@/app/admin/(panel)/filters/actions";

const CATS: { cat: FilterCategory; label: string }[] = [
  { cat: "cuisine", label: "Cuisine" },
  { cat: "vibe", label: "Vibe" },
  { cat: "area", label: "Area" },
];

interface RenamingState {
  id: string;
  original: string;
  value: string;
}

export interface FiltersManagerProps {
  options: FilterOptionsByCategory;
}

export function FiltersManager({ options }: FiltersManagerProps) {
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState<Partial<Record<FilterCategory, string>>>(
    {}
  );
  const [renaming, setRenaming] = useState<RenamingState | null>(null);
  const [confirming, setConfirming] = useState<FilterOptionWithUsage | null>(
    null
  );

  const addOpt = (cat: FilterCategory) => {
    const v = (adding[cat] || "").trim();
    if (!v) return;
    startTransition(async () => {
      const res = await addOption(cat, v);
      if (res.ok) {
        setAdding((a) => ({ ...a, [cat]: "" }));
        toast("“" + v + "” added — live in the user filter panel now");
      } else {
        toast(res.error);
      }
    });
  };

  const doRemove = (opt: FilterOptionWithUsage) => {
    startTransition(async () => {
      const res = await removeOption(opt.id);
      if (res.ok) {
        toast("“" + opt.label + "” removed from filters");
      } else {
        toast(res.error);
      }
    });
  };

  const removeOpt = (opt: FilterOptionWithUsage) => {
    if (opt.usage > 0) {
      setConfirming(opt);
    } else {
      doRemove(opt);
    }
  };

  const commitRename = () => {
    if (!renaming) return;
    const { id, original, value } = renaming;
    const v = value.trim();
    if (v && v !== original) {
      startTransition(async () => {
        const res = await renameOption(id, v);
        if (res.ok) {
          toast("Renamed to “" + v + "”");
        } else {
          toast(res.error);
        }
      });
    }
    setRenaming(null);
  };

  return (
    <div data-screen-label="Admin Filters">
      <PageHeader
        title="Filters & Categories"
        sub="Changes appear in the user-facing filter panel immediately"
      />
      <div className="ad-grid3">
        {CATS.map(({ cat, label }) => (
          <div key={cat} className="ad-card">
            <p className="ad-card-title">
              {label}{" "}
              <span className="ad-sub" style={{ fontWeight: 600 }}>
                · {options[cat].length} options
              </span>
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginBottom: 10,
              }}
            >
              {options[cat].map((opt) => (
                <div key={opt.id} className="ad-fopt">
                  {renaming && renaming.id === opt.id ? (
                    <input
                      className="gb-input"
                      style={{ padding: "6px 10px", fontSize: 13 }}
                      autoFocus
                      value={renaming.value}
                      onChange={(e) =>
                        setRenaming({ ...renaming, value: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && commitRename()}
                      onBlur={commitRename}
                    />
                  ) : (
                    <>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                        {opt.label}
                      </span>
                      <span className="ad-sub" style={{ fontSize: 10.5 }}>
                        {opt.usage} places
                      </span>
                      <IconButton
                        icon="edit"
                        title="Rename"
                        size={12}
                        onClick={() =>
                          setRenaming({
                            id: opt.id,
                            original: opt.label,
                            value: opt.label,
                          })
                        }
                      />
                      <IconButton
                        icon="x"
                        title="Remove"
                        danger
                        size={12}
                        strokeWidth={2.6}
                        onClick={() => removeOpt(opt)}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                className="gb-input"
                style={{ flex: 1, padding: "8px 11px", fontSize: 13 }}
                placeholder={"New " + cat + "…"}
                value={adding[cat] || ""}
                onChange={(e) =>
                  setAdding((a) => ({ ...a, [cat]: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && addOpt(cat)}
              />
              <button
                type="button"
                className="gb-btn gb-btn-sm"
                onClick={() => addOpt(cat)}
              >
                <Icon name="plus" size={13} strokeWidth={2.6} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="ad-sub" style={{ marginTop: 12 }}>
        Place Type and Budget are structural categories in V1 — edit them with
        a schema change, not here.
      </p>
      {confirming && (
        <ConfirmDialog
          message={
            "“" +
            confirming.label +
            "” is tagged on " +
            confirming.usage +
            " active place(s). Places keep the tag internally, but it will no longer appear in the filter panel. Remove anyway?"
          }
          confirmLabel="Remove anyway"
          onConfirm={() => doRemove(confirming)}
          onClose={() => setConfirming(null)}
        />
      )}
    </div>
  );
}
