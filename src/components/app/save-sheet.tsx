"use client";
// Gobble Maps consumer — Save-to-list sheet, ported from GSaveSheet in
// design/gobble/screens-detail.jsx. Prototype in-memory lists are replaced
// with real lists from useUser() and server actions (addToList /
// removeFromList / createList), re-syncing via useUser().refresh().

import { useState } from "react";
import { Icon } from "@/components/icons";
import { GSheet } from "./sheet";
import { useUser } from "./providers";
import { useToast } from "@/components/ui/toast";
import { addToList, createList, removeFromList } from "@/lib/consumer/user-actions";

export interface SaveSheetProps {
  placeId: string;
  onClose: () => void;
}

export function SaveSheet({ placeId, onClose }: SaveSheetProps) {
  const { lists, refresh } = useUser();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const toggleInList = async (
    listId: string,
    listName: string,
    inList: boolean
  ) => {
    if (busy) return;
    setBusy(true);
    const res = inList
      ? await removeFromList(listId, placeId)
      : await addToList(listId, placeId);
    if (res.ok) {
      await refresh();
      if (inList) {
        toast(`Removed from “${listName}”`);
      } else {
        toast(`Saved to “${listName}”`);
        onClose();
      }
    }
    setBusy(false);
  };

  const createAndSave = async () => {
    const name = newName.trim();
    if (!name || busy) return;
    setBusy(true);
    const res = await createList(name);
    if (res.ok && res.list) {
      const added = await addToList(res.list.id, placeId);
      if (added.ok) {
        await refresh();
        toast(`Saved to “${name}”`);
        setNewName("");
        onClose();
      }
    }
    setBusy(false);
  };

  return (
    <GSheet onClose={onClose} maxH="62%">
      <div
        style={{
          padding: "2px 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h3 className="gb-h2" style={{ fontSize: 19 }}>
          Save to a list
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            overflowY: "auto",
          }}
        >
          {lists.map((l) => {
            const inList = l.placeIds.includes(placeId);
            return (
              <button
                key={l.id}
                className="gb-detailrow"
                onClick={() => void toggleInList(l.id, l.name, inList)}
              >
                <span className="gb-detailrow-ic">
                  <Icon
                    name={l.isPublic ? "globe" : "lock"}
                    size={15}
                    color="var(--gb-sky-deep)"
                  />
                </span>
                <span style={{ flex: 1, textAlign: "left", fontWeight: 600 }}>
                  {l.name}{" "}
                  <span className="gb-sub">· {l.placeIds.length}</span>
                </span>
                {inList ? (
                  <Icon
                    name="check"
                    size={16}
                    color="var(--gb-sky-deep)"
                    strokeWidth={2.6}
                  />
                ) : (
                  <Icon
                    name="plus"
                    size={15}
                    color="var(--gb-mut)"
                    strokeWidth={2.2}
                  />
                )}
              </button>
            );
          })}
          {lists.length === 0 && (
            <p className="gb-empty" style={{ padding: "8px 4px" }}>
              No lists yet — create your first one below.
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="gb-input"
            style={{ flex: 1 }}
            placeholder="Create new list…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            className="gb-btn gb-btn-sm"
            onClick={() => void createAndSave()}
          >
            Create
          </button>
        </div>
      </div>
    </GSheet>
  );
}
