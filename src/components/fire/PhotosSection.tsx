"use client";

import { useRef, useState } from "react";
import { uploadFirePhotoAction, type UploadedPhoto } from "@/lib/cloudinary";
import type { FirePhotoJson } from "@/types/fire";

type PhotosSectionProps = {
  value: FirePhotoJson[];
  onChange: (photos: FirePhotoJson[]) => void;
};

const IconCamera = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconLibrary = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M8 13l3-3 3 3 2-2 3 3" />
  </svg>
);

export const PhotosSection = ({ value: photos, onChange }: PhotosSectionProps) => {
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const libraryInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    const toAdd: FirePhotoJson[] = [];
    let failedCount = 0;
    let notConfigured = false;
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);

        let result: UploadedPhoto;
        try {
          result = await uploadFirePhotoAction(formData);
        } catch {
          failedCount += 1;
          continue;
        }

        if (result.error === "NOT_CONFIGURED") {
          notConfigured = true;
          failedCount += 1;
          continue;
        }

        if (!result.url || !result.publicId) {
          failedCount += 1;
          continue;
        }

        toAdd.push({ url: result.url, publicId: result.publicId });
      }
      if (toAdd.length > 0) {
        onChange([...photos, ...toAdd]);
      }
      if (notConfigured) {
        setUploadError(
          "L'hébergement des photos n'est pas configuré sur le serveur (CLOUDINARY_URL manquant)."
        );
      } else if (failedCount > 0) {
        setUploadError(
          failedCount === 1
            ? "L'envoi de la photo a échoué. Vérifiez votre connexion et réessayez."
            : `L'envoi de ${failedCount} photos a échoué. Vérifiez votre connexion et réessayez.`
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (publicId: string) => {
    onChange(photos.filter((photo) => photo.publicId !== publicId));
  };

  const activePhoto =
    photos.find((p) => p.publicId === activePhotoId) ?? null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-zinc-900">Photos</h2>
      <p className="mb-3 text-sm text-zinc-600">
        Ajoutez quelques photos du départ de feu ou de la fumée.
      </p>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => captureInputRef.current?.click()}
          disabled={isUploading}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          aria-label="Prendre une photo avec l'appareil"
          tabIndex={0}
        >
          <IconCamera className="h-5 w-5" />
          {isUploading ? "Envoi…" : "Prendre une photo"}
        </button>
        <button
          type="button"
          onClick={() => libraryInputRef.current?.click()}
          disabled={isUploading}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          aria-label="Choisir une photo dans la bibliothèque"
          tabIndex={0}
        >
          <IconLibrary className="h-5 w-5" />
          Bibliothèque
        </button>
      </div>

      {uploadError ? (
        <p role="alert" className="mb-3 text-sm font-medium text-red-600">
          {uploadError}
        </p>
      ) : null}

      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        multiple
        onChange={(e) => handleAddFiles(e.target.files)}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        multiple
        onChange={(e) => handleAddFiles(e.target.files)}
      />

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2" aria-label="Photos sélectionnées">
          {photos.map((photo) => (
            <figure key={photo.publicId} className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setActivePhotoId(photo.publicId)}
                className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                aria-label="Agrandir la photo"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt="Photo du point d'incendie"
                  className="h-24 w-full object-cover"
                />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(photo.publicId)}
                className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Retirer cette photo"
                tabIndex={0}
              >
                Retirer
              </button>
            </figure>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">Aucune photo pour l&apos;instant.</p>
      )}

      {activePhoto ? (
        <div
          className="fixed inset-0 z-[2200] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de la photo"
        >
          <div
            className="absolute inset-0 bg-zinc-900/70"
            aria-hidden
            onClick={() => setActivePhotoId(null)}
          />
          <div className="relative z-10 max-h-full w-full max-w-md overflow-hidden rounded-2xl bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto.url}
              alt="Photo du point d'incendie"
              className="max-h-[70vh] w-full object-contain"
            />
            <button
              type="button"
              onClick={() => setActivePhotoId(null)}
              className="absolute right-3 top-3 rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-zinc-100"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};
