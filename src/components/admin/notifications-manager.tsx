"use client";

import { useState, useTransition } from "react";
import type { NotificationRow, NotificationType } from "@/lib/types";
import { Badge, type BadgeTone } from "@/components/admin/badge";
import { DataRow } from "@/components/admin/data-row";
import { PageHeader } from "@/components/admin/page-header";
import { SegmentedControl } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import {
  scheduleNotification,
  sendNotification,
} from "@/app/admin/(panel)/notifications/actions";

export interface AreaOption {
  id: string;
  label: string;
}

export interface NotificationsManagerProps {
  notifications: NotificationRow[];
  areas: AreaOption[];
}

type Segment = "all" | "area";

const SEGMENT_OPTIONS = [
  { value: "all", label: "All users" },
  { value: "area", label: "Users with saves in…" },
];

const TYPE_BADGE: Record<NotificationType, { label: string; tone: BadgeTone }> = {
  manual: { label: "Manual", tone: "grey" },
  new_place: { label: "New Place", tone: "sky" },
  area_based: { label: "Area-based", tone: "grey" },
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

export function NotificationsManager({
  notifications,
  areas,
}: NotificationsManagerProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");
  const [seg, setSeg] = useState<Segment>("all");
  const [areaId, setAreaId] = useState(areas[0]?.id ?? "");

  const areaLabel = (id: string | null) =>
    areas.find((a) => a.id === id)?.label ?? "Area";

  const recipientsLabel = (n: NotificationRow) => {
    const count =
      n.recipient_count !== null
        ? n.recipient_count.toLocaleString("en-IN")
        : "—";
    return n.type === "area_based"
      ? `${areaLabel(n.segment_area_id)} savers · ${count}`
      : `All users · ${count}`;
  };

  const send = (scheduled: boolean) => {
    if (!msg.trim() || isPending) return;
    startTransition(async () => {
      const input = {
        message: msg.trim(),
        segment: seg,
        areaId: seg === "area" ? areaId : undefined,
      };
      const res = scheduled
        ? await scheduleNotification(input)
        : await sendNotification(input);
      if (!res.ok) {
        toast(res.error);
        return;
      }
      const n = res.recipients.toLocaleString("en-IN");
      toast(
        scheduled
          ? `Scheduled for tomorrow, 11 AM — ${n} users`
          : `Notification sent to ${n} users`
      );
      setMsg("");
    });
  };

  return (
    <div data-screen-label="Admin Notifications">
      <PageHeader
        title="Push Notifications"
        sub="“New place” pushes go out automatically on publish — compose manual ones here"
      />
      <div className="ad-card" style={{ marginBottom: 14 }}>
        <p className="ad-card-title">Compose</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <textarea
            className="gb-input"
            rows={2}
            placeholder="e.g. 🍴 New spot on Gobble Maps! …"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          ></textarea>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <SegmentedControl
              options={SEGMENT_OPTIONS}
              value={seg}
              onChange={(value) => setSeg(value as Segment)}
            />
            {seg !== "all" && (
              <select
                className="gb-input"
                style={{ width: "auto", padding: "8px 12px", fontSize: 13 }}
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            )}
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button
                type="button"
                className="gb-btn gb-btn-sm"
                style={{ background: "#EFF3F6", color: "var(--gb-ink)" }}
                disabled={isPending}
                onClick={() => send(true)}
              >
                Schedule
              </button>
              <button
                type="button"
                className="gb-btn gb-btn-sm"
                disabled={isPending}
                onClick={() => send(false)}
              >
                Send now
              </button>
            </div>
          </div>
        </div>
      </div>
      <p className="ad-card-title" style={{ margin: "0 0 8px 2px" }}>
        History
      </p>
      <div className="ad-rows">
        {notifications.map((n) => (
          <DataRow
            key={n.id}
            icon="share"
            style={{ alignItems: "flex-start" }}
            main={
              <>
                <span
                  style={{
                    fontSize: 13.5,
                    color: "var(--gb-ink)",
                    lineHeight: 1.5,
                    fontWeight: 600,
                  }}
                >
                  {n.message}
                </span>
                <span className="ad-sub" style={{ marginTop: 3 }}>
                  {formatDate(n.sent_at ?? n.scheduled_for ?? n.created_at)} ·{" "}
                  {recipientsLabel(n)} · {n.id.slice(0, 8)}
                </span>
              </>
            }
            badges={
              <Badge tone={TYPE_BADGE[n.type].tone}>
                {TYPE_BADGE[n.type].label}
              </Badge>
            }
          />
        ))}
      </div>
    </div>
  );
}
