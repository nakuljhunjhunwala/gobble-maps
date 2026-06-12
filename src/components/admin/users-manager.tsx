"use client";

import { useState, useTransition } from "react";
import type { UserWithCounts } from "@/lib/admin/queries";
import { formatDate, relativeLastActive } from "@/lib/admin/format";
import { deleteUser } from "@/app/admin/(panel)/users/actions";
import { PageHeader } from "@/components/admin/page-header";
import { DataRow } from "@/components/admin/data-row";
import { Badge } from "@/components/admin/badge";
import { IconButton } from "@/components/admin/icon-button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export interface UsersManagerProps {
  users: UserWithCounts[];
}

// Ported from prototype AUsers (design/gobble/admin-ops.jsx).
export function UsersManager({ users }: UsersManagerProps) {
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [viewing, setViewing] = useState<UserWithCounts | null>(null);
  const [deleting, setDeleting] = useState<UserWithCounts | null>(null);

  const handleDelete = (user: UserWithCounts) => {
    startTransition(async () => {
      const res = await deleteUser(user.id);
      if (res.ok) {
        toast("@" + user.username + " deleted");
      } else {
        toast(res.error);
      }
    });
  };

  return (
    <div data-screen-label="Admin Users">
      <PageHeader
        title="Users"
        sub={`${users.length} registered accounts`}
      />
      <div className="ad-rows">
        {users.map((u) => (
          <DataRow
            key={u.id}
            thumb={
              <span
                className="gb-avatar"
                style={{
                  width: 36,
                  height: 36,
                  fontSize: 14,
                  cursor: "default",
                }}
              >
                {u.username[0]?.toUpperCase()}
              </span>
            }
            main={
              <>
                <span className="ad-row-name">@{u.username}</span>
                <span className="ad-sub">
                  Joined {formatDate(u.created_at)} · last active{" "}
                  {relativeLastActive(u.last_active_at)}
                </span>
              </>
            }
            badges={
              <>
                <Badge tone="grey">{u.been} been</Badge>
                <Badge tone="grey">{u.wish} wishlist</Badge>
                <Badge tone="grey">{u.lists} lists</Badge>
              </>
            }
            actions={
              <>
                <IconButton
                  icon="list"
                  title="View saved lists"
                  size={14}
                  onClick={() => setViewing(u)}
                />
                <IconButton
                  icon="x"
                  title="Delete account"
                  danger
                  size={14}
                  strokeWidth={2.4}
                  onClick={() => setDeleting(u)}
                />
              </>
            }
          />
        ))}
      </div>
      {viewing && (
        <Modal
          title={"@" + viewing.username + " — saved lists"}
          onClose={() => setViewing(null)}
        >
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>
            <strong>{viewing.been}</strong> places in Been There ·{" "}
            <strong>{viewing.wish}</strong> in Can&apos;t Wait to Go ·{" "}
            <strong>{viewing.lists}</strong> custom{" "}
            {viewing.lists === 1 ? "list" : "lists"}.
          </p>
          <p className="ad-sub" style={{ marginTop: 8 }}>
            Full list contents are shown here for support purposes in the
            production build.
          </p>
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          message={
            "Delete @" +
            deleting.username +
            "? Their lists and saves are removed."
          }
          onConfirm={() => handleDelete(deleting)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
