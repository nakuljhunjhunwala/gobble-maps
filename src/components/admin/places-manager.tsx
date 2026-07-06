"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PlaceStatus, PlaceWithRelations } from "@/lib/types";
import type { FilterOptionsByCategory } from "@/lib/admin/queries";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/admin/page-header";
import { DataRow } from "@/components/admin/data-row";
import { IconButton } from "@/components/admin/icon-button";
import { Badge, type BadgeTone } from "@/components/admin/badge";
import { SegmentedControl } from "@/components/ui/segmented";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { PlaceEditor, type PlacePrefill } from "@/components/admin/place-editor";
import { PlacePreview, PLACE_TYPES } from "@/components/admin/place-preview";
import { publicPhotoUrl } from "@/components/admin/photo-uploader";
import { ImportDialog } from "@/components/admin/import-dialog";
import { deletePlace, markClosed } from "@/app/admin/(panel)/places/actions";

const STATUS_LABEL: Record<PlaceStatus, string> = {
  published: "Published",
  draft: "Draft",
  permanently_closed: "Permanently Closed",
};

const STATUS_TONE: Record<PlaceStatus, BadgeTone> = {
  published: "green",
  draft: "amber",
  permanently_closed: "red",
};

type StatusTab = "all" | PlaceStatus;

interface EditorState {
  placeId: string | null;
  prefill: PlacePrefill | null;
}

interface ConfirmState {
  msg: string;
  fn: () => void;
}

export interface PlacesManagerProps {
  places: PlaceWithRelations[];
  filters: FilterOptionsByCategory;
  /** ?edit=<placeId> deep link — open editor for that place on load. */
  initialEditId: string | null;
  /** ?new=1&name=&address=&note= deep link from To Be Tried. */
  initialPrefill: PlacePrefill | null;
}

// Port of prototype APlaces (design/gobble/admin-places.jsx).
export function PlacesManager({
  places,
  filters,
  initialEditId,
  initialPrefill,
}: PlacesManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [preview, setPreview] = useState<PlaceWithRelations | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(() => {
    if (initialEditId) return { placeId: initialEditId, prefill: null };
    if (initialPrefill) return { placeId: null, prefill: initialPrefill };
    return null;
  });

  const countOf = (status: PlaceStatus) =>
    places.filter((p) => p.status === status).length;

  const tabOptions = [
    { value: "all", label: "All" },
    { value: "published", label: `Published (${countOf("published")})` },
    { value: "draft", label: `Draft (${countOf("draft")})` },
    {
      value: "permanently_closed",
      label: `Permanently Closed (${countOf("permanently_closed")})`,
    },
  ];

  const rows = places.filter(
    (p) =>
      (statusTab === "all" || p.status === statusTab) &&
      (!q.trim() ||
        (p.name + " " + (p.area?.label ?? ""))
          .toLowerCase()
          .includes(q.trim().toLowerCase()))
  );

  const closeEditor = () => {
    setEditor(null);
    if (initialEditId || initialPrefill) {
      router.replace("/admin/places", { scroll: false });
    }
  };

  const askMarkClosed = (p: PlaceWithRelations, afterClose?: () => void) =>
    setConfirm({
      msg: `Mark “${p.name}” as permanently closed? It will be removed from the map and from all user lists.`,
      fn: () =>
        startTransition(async () => {
          const res = await markClosed(p.id);
          toast(res.ok ? `“${p.name}” marked permanently closed` : res.error);
          if (res.ok) afterClose?.();
        }),
    });

  const askDelete = (p: PlaceWithRelations) =>
    setConfirm({
      msg: `Delete “${p.name}” forever? This cannot be undone.`,
      fn: () =>
        startTransition(async () => {
          const res = await deletePlace(p.id);
          toast(res.ok ? `“${p.name}” deleted` : res.error);
        }),
    });

  const editorPlace = editor?.placeId
    ? places.find((p) => p.id === editor.placeId) ?? null
    : null;
  const editorOpen = editor !== null && (editor.placeId === null || editorPlace !== null);

  return (
    <div>
      <PageHeader
        title="Places"
        sub={`${places.length} places · add, edit, publish & retire listings`}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            className="gb-btn gb-btn-sm"
            href="/api/admin/places/export"
            style={{ background: "#EFF3F6", color: "var(--gb-ink)" }}
          >
            <Icon name="share" size={14} /> Export CSV
          </a>
          <button
            className="gb-btn gb-btn-sm"
            style={{ background: "#EFF3F6", color: "var(--gb-ink)" }}
            onClick={() => setImportOpen(true)}
          >
            <Icon name="list" size={14} /> Import CSV
          </button>
          <button
            className="gb-btn gb-btn-sm"
            onClick={() => setEditor({ placeId: null, prefill: null })}
          >
            <Icon name="plus" size={14} strokeWidth={2.6} /> Add new place
          </button>
        </div>
      </PageHeader>

      <div className="ad-toolbar">
        <SegmentedControl
          options={tabOptions}
          value={statusTab}
          onChange={(v) => setStatusTab(v as StatusTab)}
        />
        <input
          className="gb-input ad-search"
          placeholder="Search places…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="ad-rows">
        {rows.map((p) => (
          <DataRow
            key={p.id}
            thumb={
              p.photos.length > 0 ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={publicPhotoUrl(p.photos[0].storage_path)}
                  alt={p.name}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 11,
                    flexShrink: 0,
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span
                  className="ad-detail-ic"
                  style={{ width: 46, height: 46, borderRadius: 11 }}
                >
                  <Icon
                    name={PLACE_TYPES[p.type].icon}
                    size={20}
                    color="var(--gb-deep)"
                  />
                </span>
              )
            }
            main={
              <>
                <span className="ad-row-name">{p.name}</span>
                <span className="ad-sub">
                  {PLACE_TYPES[p.type].label} · {p.area?.label ?? "—"} ·{" "}
                  {p.photos.length} photos
                </span>
              </>
            }
            badges={
              <>
                <Badge tone={STATUS_TONE[p.status]}>
                  {STATUS_LABEL[p.status]}
                </Badge>
                <Badge tone={p.visited ? "sky" : "grey"}>
                  {p.visited ? "✓ Visited" : "Not visited"}
                </Badge>
              </>
            }
            actions={
              <>
                <IconButton
                  icon="search"
                  title="Preview as user"
                  size={14}
                  onClick={() => setPreview(p)}
                />
                <IconButton
                  icon="edit"
                  title="Edit"
                  size={14}
                  onClick={() => setEditor({ placeId: p.id, prefill: null })}
                />
                {p.status !== "permanently_closed" && (
                  <IconButton
                    icon="flag"
                    title="Mark permanently closed"
                    size={14}
                    onClick={() => askMarkClosed(p)}
                  />
                )}
                <IconButton
                  icon="x"
                  title="Delete"
                  danger
                  size={14}
                  strokeWidth={2.4}
                  onClick={() => askDelete(p)}
                />
              </>
            }
          />
        ))}
        {rows.length === 0 && (
          <p className="gb-empty" style={{ padding: 20 }}>
            Nothing here.
          </p>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          message={confirm.msg}
          onConfirm={confirm.fn}
          onClose={() => setConfirm(null)}
        />
      )}

      {editorOpen && editor && (
        <PlaceEditor
          place={editorPlace}
          prefill={editor.prefill}
          filters={filters}
          onClose={closeEditor}
          onMarkClosed={(p, afterClose) => askMarkClosed(p, afterClose)}
        />
      )}

      {preview && (
        <PlacePreview place={preview} onClose={() => setPreview(null)} />
      )}

      {importOpen && <ImportDialog onClose={() => setImportOpen(false)} />}
    </div>
  );
}
