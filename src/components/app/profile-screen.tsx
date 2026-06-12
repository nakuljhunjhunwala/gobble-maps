"use client";
// Gobble Maps consumer — Profile screen (FR-8, FR-9), ported from
// GProfileScreen in design/gobble/screens-detail.jsx.
//
// Guest state: signup pitch + "Log in or sign up" (useAuthUI) + admin link.
// Logged-in state: avatar/@username, stats line, Been There / Can't Wait /
// My Lists tabs, list privacy + copy-link, create list, and a Settings panel
// (push-notification switch, inline Change PIN form, Log out).
//
// Prototype in-memory data / localStorage is replaced with the shared
// useUser() context + server actions; saved/list place cards are looked up by
// id from the published places passed in from the server page.

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/ui/toast";
import { GCardRow, toCardData } from "@/components/app/cards";
import { Photo } from "@/components/app/photo";
import { useAuthUI, useUser } from "@/components/app/providers";
import type { ConsumerList } from "@/lib/consumer/user-actions";
import {
  createList,
  deleteList,
  setNotifOptIn,
  toggleListPublic,
  toggleSaved,
} from "@/lib/consumer/user-actions";
import { changePin, logout } from "@/lib/consumer/auth-actions";
import type { ConsumerPlace } from "@/lib/consumer/types";

type ProfileTab = "been" | "wish" | "lists";

export interface ProfileScreenProps {
  /** All published places, used to render saved/list cards by id. */
  places: ConsumerPlace[];
}

export function ProfileScreen({ places }: ProfileScreenProps) {
  const { user, been, wish, lists, refresh } = useUser();
  const { openAuth } = useAuthUI();
  const { toast } = useToast();
  const [tab, setTab] = useState<ProfileTab>("been");
  const [newList, setNewList] = useState("");

  const byId = useMemo(() => {
    const map = new Map<string, ConsumerPlace>();
    for (const p of places) map.set(p.id, p);
    return map;
  }, [places]);

  // Pin a single `now` so every card's open/closed state agrees.
  const now = useMemo(() => new Date(), []);

  // ── Guest state ────────────────────────────────────────────
  if (!user) {
    return (
      <div className="gb-screen" data-screen-label="Profile (guest)">
        <div
          style={{
            padding: "40px 30px",
            minHeight: "70dvh",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 12,
            alignItems: "center",
          }}
        >
          <span
            className="gb-brand-mark"
            style={{ width: 52, height: 52, borderRadius: 16 }}
          >
            <Icon name="user" size={26} color="#fff" strokeWidth={2} />
          </span>
          <h2 className="gb-h2">Your food memory</h2>
          <p className="gb-sub" style={{ maxWidth: 250, margin: "0 auto" }}>
            Log in to save places, track your visits, and create custom lists.
            Browsing stays free for everyone.
          </p>
          <button
            className="gb-btn"
            style={{ marginTop: 8, minWidth: 200 }}
            onClick={() => openAuth()}
          >
            Log in or sign up
          </button>
          <a
            className="gb-link"
            style={{
              marginTop: 14,
              color: "var(--gb-mut)",
              textDecoration: "none",
            }}
            href="/admin"
          >
            Founder? Open the admin panel →
          </a>
        </div>
      </div>
    );
  }

  // ── Logged-in helpers ──────────────────────────────────────
  const removeSaved = async (placeId: string, kind: "been_there" | "wishlist") => {
    const res = await toggleSaved(placeId, kind);
    if (res.ok) {
      await refresh();
      toast("Removed");
    }
  };

  const renderPlaces = (
    ids: string[],
    kind: "been_there" | "wishlist",
    emptyMsg: string
  ) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {ids.map((id) => {
        const p = byId.get(id);
        if (!p) return null;
        return (
          <GCardRow
            key={id}
            place={toCardData(p, now)}
            been={kind === "been_there" || been.has(id)}
            trailing={
              <button
                className="gb-iconbtn"
                style={{ width: 32, height: 32 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void removeSaved(id, kind);
                }}
              >
                <Icon name="x" size={13} color="var(--gb-mut)" strokeWidth={2.4} />
              </button>
            }
          />
        );
      })}
      {ids.length === 0 && (
        <p
          className="gb-empty"
          style={{ padding: "26px 10px", textAlign: "center" }}
        >
          {emptyMsg}
        </p>
      )}
    </div>
  );

  return (
    <div className="gb-screen" data-screen-label="Profile">
      <div
        style={{
          padding: "14px 18px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            className="gb-avatar"
            style={{ width: 48, height: 48, fontSize: 19 }}
          >
            {user.username[0].toUpperCase()}
          </span>
          <div style={{ flex: 1 }}>
            <h2 className="gb-h2">@{user.username}</h2>
            <p className="gb-sub">
              {been.size} been there · {wish.size} can&apos;t wait ·{" "}
              {lists.length} {lists.length === 1 ? "list" : "lists"}
            </p>
          </div>
        </div>

        {/* tab switcher */}
        <div className="gb-seg" style={{ width: "100%" }}>
          {(
            [
              ["been", "Been There"],
              ["wish", "Can't Wait"],
              ["lists", "My Lists"],
            ] as [ProfileTab, string][]
          ).map(([k, l]) => (
            <button
              key={k}
              style={{ flex: 1 }}
              className={tab === k ? "gb-seg-on" : ""}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </div>

        {tab === "been" &&
          renderPlaces(
            [...been],
            "been_there",
            "Places you mark as visited will live here."
          )}
        {tab === "wish" &&
          renderPlaces(
            [...wish],
            "wishlist",
            "Your wishlist is empty — go find something delicious."
          )}

        {tab === "lists" && (
          <ListsTab
            lists={lists}
            byId={byId}
            refresh={refresh}
            toast={toast}
            newList={newList}
            setNewList={setNewList}
          />
        )}

        {/* settings */}
        <SettingsPanel
          notifOptIn={user.notifOptIn}
          refresh={refresh}
          toast={toast}
        />

        <a
          className="gb-link"
          style={{
            alignSelf: "center",
            color: "var(--gb-mut)",
            textDecoration: "none",
          }}
          href="/admin"
        >
          Founder? Open the admin panel →
        </a>
      </div>
    </div>
  );
}

// ── My Lists tab ─────────────────────────────────────────────

interface ListsTabProps {
  lists: ConsumerList[];
  byId: Map<string, ConsumerPlace>;
  refresh: () => Promise<void>;
  toast: (msg: string) => void;
  newList: string;
  setNewList: (v: string) => void;
}

function ListsTab({
  lists,
  byId,
  refresh,
  toast,
  newList,
  setNewList,
}: ListsTabProps) {
  const onDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete the list "${name}"?`)) return;
    const res = await deleteList(id);
    if (res.ok) {
      await refresh();
      toast("List deleted");
    }
  };

  const onTogglePublic = async (id: string) => {
    const res = await toggleListPublic(id);
    if (res.ok) await refresh();
  };

  const onCopyLink = (shareSlug: string) => {
    const url = `${window.location.origin}/l/${shareSlug}`;
    void navigator.clipboard?.writeText(url);
    toast("Link copied!");
  };

  const onCreate = async () => {
    const name = newList.trim();
    if (!name) return;
    const res = await createList(name);
    if (res.ok) {
      setNewList("");
      await refresh();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {lists.map((l) => (
        <div
          key={l.id}
          className="gb-panel"
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon
              name={l.isPublic ? "globe" : "lock"}
              size={15}
              color="var(--gb-sky-deep)"
            />
            <span
              style={{
                flex: 1,
                fontWeight: 700,
                fontSize: 14.5,
                color: "var(--gb-ink)",
              }}
            >
              {l.name}
            </span>
            <span className="gb-sub">
              {l.placeIds.length} {l.placeIds.length === 1 ? "place" : "places"}
            </span>
            <button
              className="gb-iconbtn"
              style={{ width: 30, height: 30 }}
              onClick={() => void onDelete(l.id, l.name)}
            >
              <Icon name="x" size={12} color="var(--gb-mut)" strokeWidth={2.4} />
            </button>
          </div>
          {l.placeIds.length > 0 && (
            <div style={{ display: "flex", gap: 6 }}>
              {l.placeIds.slice(0, 5).map((id) => {
                const p = byId.get(id);
                if (!p) return null;
                return (
                  <Photo
                    key={id}
                    path={p.photoPaths[0] ?? null}
                    hue={p.hue}
                    type={p.type}
                    alt={p.name}
                    style={{ width: 44, height: 44, borderRadius: 10 }}
                    iconSize={18}
                  />
                );
              })}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span className="gb-sub">
              {l.isPublic
                ? "Public — anyone with the link can view"
                : "Private — only you"}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {l.isPublic && l.shareSlug && (
                <button
                  className="gb-link"
                  onClick={() => onCopyLink(l.shareSlug as string)}
                >
                  Copy link
                </button>
              )}
              <button className="gb-link" onClick={() => void onTogglePublic(l.id)}>
                {l.isPublic ? "Make private" : "Make public"}
              </button>
            </div>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="gb-input"
          style={{ flex: 1 }}
          placeholder="New list name, e.g. Date Night Spots"
          value={newList}
          onChange={(e) => setNewList(e.target.value)}
        />
        <button className="gb-btn gb-btn-sm" onClick={() => void onCreate()}>
          <Icon name="plus" size={14} strokeWidth={2.6} /> Create
        </button>
      </div>
    </div>
  );
}

// ── Settings panel ───────────────────────────────────────────

interface SettingsPanelProps {
  notifOptIn: boolean;
  refresh: () => Promise<void>;
  toast: (msg: string) => void;
}

function SettingsPanel({ notifOptIn, refresh, toast }: SettingsPanelProps) {
  const [optIn, setOptIn] = useState(notifOptIn);
  const [pinOpen, setPinOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinErr, setPinErr] = useState("");

  const onToggleNotif = async () => {
    const next = !optIn;
    setOptIn(next);
    const res = await setNotifOptIn(next);
    if (res.ok) {
      void refresh();
    } else {
      setOptIn(!next); // revert on failure
    }
  };

  const onChangePin = async () => {
    setPinErr("");
    const res = await changePin(currentPin, newPin);
    if (res.ok) {
      setPinOpen(false);
      setCurrentPin("");
      setNewPin("");
      toast("PIN updated");
    } else {
      setPinErr(res.error);
    }
  };

  const onLogout = async () => {
    await logout();
    await refresh();
    toast("Logged out");
  };

  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 6);

  return (
    <section className="gb-panel" style={{ padding: "4px 6px", marginTop: 6 }}>
      <div className="gb-detailrow" style={{ cursor: "default" }}>
        <span className="gb-detailrow-ic">
          <Icon name="info" size={16} color="var(--gb-sky-deep)" />
        </span>
        <span style={{ flex: 1, textAlign: "left" }}>Push notifications</span>
        <button
          className={"gb-switch" + (optIn ? " gb-switch-on" : "")}
          onClick={() => void onToggleNotif()}
        >
          <span></span>
        </button>
      </div>

      <button
        className="gb-detailrow"
        onClick={() => setPinOpen((o) => !o)}
      >
        <span className="gb-detailrow-ic">
          <Icon name="lock" size={16} color="var(--gb-sky-deep)" />
        </span>
        <span style={{ flex: 1, textAlign: "left" }}>Change PIN</span>
        <Icon name="chevR" size={13} color="var(--gb-line2)" strokeWidth={2.4} />
      </button>

      {pinOpen && (
        <div
          style={{
            padding: "8px 12px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span className="gb-flabel">Current PIN</span>
            <input
              className="gb-input"
              inputMode="numeric"
              type="password"
              placeholder="••••••"
              style={{ letterSpacing: 6, fontWeight: 700 }}
              value={currentPin}
              onChange={(e) => setCurrentPin(onlyDigits(e.target.value))}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span className="gb-flabel">New 6-digit PIN</span>
            <input
              className="gb-input"
              inputMode="numeric"
              type="password"
              placeholder="••••••"
              style={{ letterSpacing: 6, fontWeight: 700 }}
              value={newPin}
              onChange={(e) => setNewPin(onlyDigits(e.target.value))}
            />
          </label>
          {pinErr && (
            <p style={{ fontSize: 12.5, fontWeight: 700, color: "#B4514B" }}>
              {pinErr}
            </p>
          )}
          <button className="gb-btn gb-btn-sm" onClick={() => void onChangePin()}>
            Update PIN
          </button>
        </div>
      )}

      <button className="gb-detailrow" onClick={() => void onLogout()}>
        <span className="gb-detailrow-ic" style={{ background: "#FBEAE8" }}>
          <Icon name="logout" size={16} color="#B4514B" />
        </span>
        <span
          style={{ flex: 1, textAlign: "left", color: "#B4514B", fontWeight: 700 }}
        >
          Log out
        </span>
      </button>
    </section>
  );
}
