import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { completeSignIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void completeSignIn()
      .then((returnPath) => {
        if (!cancelled) {
          navigate(returnPath || "/account", { replace: true });
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Sign-in failed");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [completeSignIn, navigate]);

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center px-4">
      <div className="surface-card section-tone-stone max-w-lg w-full rounded-3xl p-8 text-center">
        <p className="text-text-muted text-xs uppercase tracking-[0.18em] mb-4">
          Account
        </p>
        <h1 className="text-3xl font-semibold text-text-primary mb-4">
          Completing sign-in
        </h1>
        {error ? (
          <p className="text-red-400 text-sm leading-relaxed">{error}</p>
        ) : (
          <>
            <div className="w-10 h-10 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary text-sm leading-relaxed">
              Exchanging your Hugging Face authorization for a SeevoMap session.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
