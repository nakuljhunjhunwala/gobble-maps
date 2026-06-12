"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/ui/toast";
import { checkUsername, forgotPin, login, signup } from "@/lib/consumer/auth-actions";

type AuthMode = "login" | "signup" | "forgot";
type Availability = "available" | "taken" | null;

export interface AuthScreenProps {
  open: boolean;
  onClose: () => void;
  onAuthed: () => void;
}

// ── Auth (FR-7) ──────────────────────────────────────────────
export function AuthScreen({ open, onClose, onAuthed }: AuthScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [mobile, setMobile] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [avail, setAvail] = useState<Availability>(null);
  const checkSeq = useRef(0);

  const uname = username.trim().toLowerCase();
  const taken = mode === "signup" && !!uname && (uname === "gobble" || avail === "taken");
  const reset = () => {
    setPin("");
    setErr("");
  };

  // Reset everything when the screen is closed (render-time state sync —
  // the compiler-approved alternative to setState inside an effect).
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setMode("login");
      setUsername("");
      setPin("");
      setMobile("");
      setErr("");
      setAvail(null);
      setBusy(false);
    }
  }

  // Live username availability check (debounced) for signup.
  // "gobble" needs no fetch — the derived `taken` flag already covers it.
  useEffect(() => {
    const seq = ++checkSeq.current;
    const clear = setTimeout(() => {
      if (checkSeq.current === seq) setAvail(null);
    }, 0);
    if (mode !== "signup" || !uname || uname === "gobble") {
      return () => clearTimeout(clear);
    }
    const t = setTimeout(() => {
      checkUsername(uname).then((res) => {
        if (checkSeq.current !== seq) return;
        if (res.ok) setAvail(res.available ? "available" : "taken");
      });
    }, 350);
    return () => {
      clearTimeout(clear);
      clearTimeout(t);
    };
  }, [mode, uname]);

  if (!open) return null;

  const submit = async () => {
    if (busy) return;
    setErr("");
    if (mode === "signup") {
      if (!uname) return setErr("Pick a username first.");
      if (taken) return setErr("That username is taken — try another.");
      if (pin.length !== 6) return setErr("Your PIN must be exactly 6 digits.");
      if (mobile.replace(/\D/g, "").length < 10)
        return setErr("Enter a valid mobile number for recovery.");
      setBusy(true);
      const res = await signup(uname, pin, mobile);
      setBusy(false);
      if (!res.ok) return setErr(res.error);
      toast("Welcome to Gobble Maps, @" + res.user.username + "!");
      onAuthed();
      router.refresh();
    } else if (mode === "login") {
      if (!uname) return setErr("Pick a username first.");
      setBusy(true);
      const res = await login(uname, pin);
      setBusy(false);
      if (!res.ok) return setErr(res.error);
      toast("Logged in as @" + res.user.username);
      onAuthed();
      router.refresh();
    } else {
      if (mobile.replace(/\D/g, "").length < 10)
        return setErr("Enter the mobile number on your account.");
      setBusy(true);
      const res = await forgotPin();
      setBusy(false);
      if (!res.ok) setErr(res.error);
    }
  };

  const field = (
    label: string,
    val: string,
    set: (v: string) => void,
    props: InputHTMLAttributes<HTMLInputElement> & { style?: CSSProperties } = {},
    note: ReactNode = null
  ) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span className="gb-flabel">{label}</span>
      <input className="gb-input" value={val} onChange={(e) => set(e.target.value)} {...props} />
      {note && (
        <span style={{ fontSize: 11.5, color: "var(--gb-mut)", lineHeight: 1.45 }}>{note}</span>
      )}
    </label>
  );

  return (
    <div className="gb-push">
      <div className="gb-screen" data-screen-label="Login / Signup" style={{ background: "var(--gb-bg)" }}>
        <div style={{ padding: "14px 22px 30px", display: "flex", flexDirection: "column", gap: 18 }}>
          <button className="gb-backbtn" style={{ position: "static", alignSelf: "flex-start" }} onClick={onClose}>
            <Icon name="x" size={15} strokeWidth={2.4} />
          </button>
          <div>
            <div className="gb-brand" style={{ fontSize: 21 }}>
              <span className="gb-brand-mark">
                <Icon name="pinOutline" size={17} color="#fff" strokeWidth={2.2} />
              </span>
              Gobble Maps
            </div>
            <h1 className="gb-h1" style={{ marginTop: 14 }}>
              {mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your PIN" : "Welcome back"}
            </h1>
            <p className="gb-sub" style={{ marginTop: 5 }}>
              {mode === "forgot"
                ? "We’ll text an OTP to the mobile number on your account."
                : "Save places, track visits, build custom lists. Browsing never requires an account."}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode !== "forgot" &&
              field(
                "Username",
                username,
                setUsername,
                { placeholder: "e.g. vada_pav_vigilante", autoCapitalize: "none" },
                mode === "signup" && uname ? (
                  taken ? (
                    <span style={{ color: "#B4514B", fontWeight: 700 }}>✕ Taken — try another</span>
                  ) : avail === "available" ? (
                    <span style={{ color: "#15803D", fontWeight: 700 }}>✓ Available</span>
                  ) : null
                ) : null
              )}
            {(mode === "signup" || mode === "forgot") &&
              field(
                "Mobile number",
                mobile,
                setMobile,
                { placeholder: "+91 ", inputMode: "tel" },
                mode === "signup"
                  ? "For account recovery only — we will not use this for marketing or login."
                  : null
              )}
            {mode !== "forgot" &&
              field(
                "6-digit PIN",
                pin,
                (v) => setPin(v.replace(/\D/g, "").slice(0, 6)),
                {
                  placeholder: "••••••",
                  inputMode: "numeric",
                  type: "password",
                  style: { letterSpacing: 6, fontWeight: 700 },
                }
              )}
            {err && <p style={{ fontSize: 12.5, fontWeight: 700, color: "#B4514B" }}>{err}</p>}
            <button className="gb-btn" onClick={submit} disabled={busy}>
              {mode === "signup" ? "Create account" : mode === "forgot" ? "Send OTP" : "Log in"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", marginTop: 4 }}>
            {mode === "login" && (
              <button
                className="gb-link"
                onClick={() => {
                  setMode("forgot");
                  reset();
                }}
              >
                Forgot PIN?
              </button>
            )}
            <button
              className="gb-link"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                reset();
              }}
            >
              {mode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
