"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function DeleteTarotReading({
  id,
  label,
  confirmLabel,
  cancelLabel,
  errorLabel,
}: {
  id: string;
  label: string;
  confirmLabel: string;
  cancelLabel: string;
  errorLabel: string;
}) {
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  async function remove() {
    setPending(true);
    setError(false);
    try {
      const response = await fetch(`/api/tarot/readings/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      router.push("/account?view=library");
      router.refresh();
    } catch {
      setError(true);
      setPending(false);
    }
  }
  return (
    <div>
      {confirm ? (
        <>
          <p>{confirmLabel}</p>
          <button
            className="button-secondary"
            disabled={pending}
            onClick={remove}
          >
            {label}
          </button>
          <button
            className="button-quiet"
            disabled={pending}
            onClick={() => setConfirm(false)}
          >
            {cancelLabel}
          </button>
        </>
      ) : (
        <button className="button-quiet" onClick={() => setConfirm(true)}>
          {label}
        </button>
      )}
      {error && <p role="alert">{errorLabel}</p>}
    </div>
  );
}
