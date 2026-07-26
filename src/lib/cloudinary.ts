"use server";

import { v2 as cloudinary } from "cloudinary";

// CLOUDINARY_URL doit être défini dans l'environnement.
// Exemple : CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
cloudinary.config({
  secure: true,
});

export type UploadedPhoto = {
  url: string | null;
  publicId: string | null;
  error?: string;
};

export const uploadFirePhotoAction = async (
  formData: FormData
): Promise<UploadedPhoto> => {
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return { url: null, publicId: null, error: "NO_FILE" };
  }

  // Sans CLOUDINARY_URL, le SDK lève « Must supply api_key » : on renvoie une
  // erreur identifiable plutôt qu'une 500 opaque côté client.
  if (!process.env.CLOUDINARY_URL) {
    return { url: null, publicId: null, error: "NOT_CONFIGURED" };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<UploadedPhoto>((resolve) => {
    try {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "fire-points",
        },
        (error, result) => {
          if (error || !result) {
            resolve({ url: null, publicId: null, error: "UPLOAD_FAILED" });
            return;
          }

          resolve({
            url: result.secure_url ?? null,
            publicId: result.public_id ?? null,
          });
        }
      );

      stream.end(buffer);
    } catch {
      resolve({ url: null, publicId: null, error: "UPLOAD_FAILED" });
    }
  });
};
