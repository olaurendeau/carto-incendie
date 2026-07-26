import Link from "next/link";

export const InvalidTokenMessage = () => (
  <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 bg-zinc-50 p-4 text-center">
    <p className="text-4xl" aria-hidden>
      🔒
    </p>
    <h1 className="text-xl font-semibold text-zinc-900">
      Lien d&apos;administration invalide
    </h1>
    <p className="text-zinc-600">
      Ce lien ne permet pas de modifier cette zone. Vérifiez que vous utilisez
      bien le lien reçu à la création de la zone.
    </p>
    <Link
      href="/"
      className="mt-2 flex min-h-[48px] items-center justify-center rounded-xl bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
      tabIndex={0}
      aria-label="Retour à l'accueil"
    >
      Retour à l&apos;accueil
    </Link>
  </div>
);
