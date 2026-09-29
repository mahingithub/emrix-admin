"use client";
/* eslint-disable @next/next/no-img-element -- admin previews of uploaded files */

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2, UploadCloud, X } from "lucide-react";
import type { ProductImage, TeeColor } from "@emrix/shared/types";
import { cn } from "@emrix/shared/utils";

/** Downscale to `max` px and re-encode (WebP, JPEG fallback) before upload. */
export async function prepareImage(file: File, max = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type: string, q: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));
  const webp = await encode("image/webp", 0.86);
  if (webp?.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg", 0.88);
  if (!jpeg) throw new Error("Could not process this image.");
  return jpeg;
}

export async function uploadImage(file: File): Promise<string> {
  const blob = await prepareImage(file).catch(() => file);
  const form = new FormData();
  form.append("file", blob, file.name);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed.");
  return json.url;
}

async function postFile(blob: Blob, name: string): Promise<string> {
  const form = new FormData();
  form.append("file", blob, name);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? (res.status === 413 ? "That file is too large." : "Upload failed."));
  return json.url;
}

/** First frame of a video file as a JPEG, used as its cover (poster) image. */
async function firstFrame(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    await new Promise<void>((resolve, reject) => {
      v.onloadeddata = () => resolve();
      v.onerror = () => reject(new Error("That video didn't open. Use an MP4 (H.264) file."));
    });
    await new Promise<void>((resolve) => {
      v.onseeked = () => resolve();
      v.currentTime = Math.min(0.1, v.duration / 2);
    });
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.9));
    if (!blob) throw new Error("Couldn't read the video's first frame.");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Uploads an MP4 and a cover image made from its first frame. */
export async function uploadVideo(file: File): Promise<{ url: string; poster: string }> {
  if (file.type !== "video/mp4") throw new Error("Please choose an MP4 video.");
  const poster = await postFile(await firstFrame(file), "poster.jpg");
  const url = await postFile(file, file.name);
  return { url, poster };
}

const uid = () => Math.random().toString(36).slice(2, 10);

function useDropzone(onFiles: (files: File[]) => void) {
  const [over, setOver] = useState(false);
  return {
    over,
    props: {
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        setOver(false);
        const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
        if (files.length) onFiles(files);
      },
    },
  };
}

/** Product photo manager: upload, order (first = cover), tag by colour, remove. */
export function PhotoManager({
  images,
  onChange,
  colors,
  productName,
}: {
  images: ProductImage[];
  onChange: (next: ProductImage[] | ((prev: ProductImage[]) => ProductImage[])) => void;
  colors: TeeColor[];
  productName: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ id: string; preview: string; name: string }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const addFiles = async (files: File[]) => {
    setErrors([]);
    const queue = files.slice(0, 20).map((f) => ({ id: uid(), preview: URL.createObjectURL(f), name: f.name, file: f }));
    setPending((p) => [...p, ...queue]);
    for (const item of queue) {
      try {
        const url = await uploadImage(item.file);
        const color = colors.find((c) => item.name.toLowerCase().includes(c.name.toLowerCase()))?.name;
        onChange((prev) => [...prev, { id: uid(), url, alt: `${productName}${color ? ` in ${color}` : ""}`, color }]);
      } catch (e) {
        setErrors((errs) => [...errs, `${item.name}: ${e instanceof Error ? e.message : "upload failed"}`]);
      } finally {
        setPending((p) => p.filter((x) => x.id !== item.id));
        URL.revokeObjectURL(item.preview);
      }
    }
  };
  const drop = useDropzone(addFiles);

  const move = (i: number, dir: -1 | 1) => {
    const next = images.slice();
    const [item] = next.splice(i, 1);
    next.splice(i + dir, 0, item);
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <figure key={img.id} className="group overflow-hidden rounded-xl border border-ink/10 bg-paper">
            <div className="relative aspect-square">
              <img src={img.url} alt={img.alt} className="absolute inset-0 size-full object-cover" />
              {i === 0 && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold text-paper">
                  <Star className="size-3 fill-kin text-kin" /> Cover
                </span>
              )}
              <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <span className="flex gap-1">
                  <IconBtn label="Move left" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowLeft className="size-3.5" />
                  </IconBtn>
                  <IconBtn label="Move right" disabled={i === images.length - 1} onClick={() => move(i, 1)}>
                    <ArrowRight className="size-3.5" />
                  </IconBtn>
                </span>
                <IconBtn label="Remove photo" onClick={() => onChange(images.filter((x) => x.id !== img.id))} danger>
                  <Trash2 className="size-3.5" />
                </IconBtn>
              </div>
            </div>
            <select
              value={img.color ?? ""}
              onChange={(e) => onChange(images.map((x) => (x.id === img.id ? { ...x, color: e.target.value || undefined } : x)))}
              className="h-9 w-full border-t border-ink/10 bg-white px-2 text-xs font-medium outline-none"
              aria-label="Colour shown in this photo"
            >
              <option value="">All colours</option>
              {colors.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onChange(images.map((x) => (x.id === img.id ? { ...x, back: !x.back || undefined } : x)))}
              className={cn(
                "h-8 w-full border-t border-ink/10 text-[11px] font-semibold transition-colors",
                img.back ? "bg-ink text-paper" : "bg-white text-ink/55 hover:text-ink",
              )}
              aria-pressed={!!img.back}
              title="The flat photo of the tee's back. Try on uses it to show shoppers the back print on themselves."
            >
              {img.back ? "Back print ✓" : "Mark as back print"}
            </button>
          </figure>
        ))}
        {pending.map((p) => (
          <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl border border-ink/10">
            <img src={p.preview} alt="" className="absolute inset-0 size-full object-cover opacity-50" />
            <span className="absolute inset-0 grid place-items-center">
              <Loader2 className="size-6 animate-spin" />
            </span>
          </div>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          {...drop.props}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 text-center text-xs font-semibold transition-colors",
            drop.over ? "border-shu bg-shu/5 text-shu" : "border-ink/20 text-ink/55 hover:border-ink/50 hover:text-ink",
          )}
        >
          <ImagePlus className="size-6" />
          Add photos
          <span className="font-normal text-ink/45">or drop them here</span>
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) addFiles([...e.target.files]);
          e.target.value = "";
        }}
      />
      {errors.map((e) => (
        <p key={e} className="mt-2 text-xs font-semibold text-rose-700">
          {e}
        </p>
      ))}
      <p className="mt-3 text-xs text-ink/50">
        First photo is the cover (and the tee Try on puts on shoppers); the second shows on hover. Tag photos with a colour so they switch
        with the colour picker, and mark the flat photo of the back as the back print so Try on can show it too. Images are resized to
        1600px and compressed automatically.
      </p>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-lg bg-white/95 shadow disabled:opacity-40",
        danger ? "text-rose-600 hover:bg-rose-50" : "hover:bg-paper",
      )}
    >
      {children}
    </button>
  );
}

/** Single image (anime collection cover). */
export function CoverUploader({ value, onChange }: { value?: string; onChange: (url?: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pick = async (files: File[]) => {
    setBusy(true);
    setError("");
    try {
      onChange(await uploadImage(files[0]));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };
  const drop = useDropzone(pick);

  return (
    <div>
      {value ? (
        <div className="relative aspect-[21/9] max-w-xl overflow-hidden rounded-xl border border-ink/10">
          <img src={value} alt="Collection cover" className="absolute inset-0 size-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button type="button" onClick={() => input.current?.click()} className="rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold shadow">
              Replace
            </button>
            <button type="button" onClick={() => onChange(undefined)} className="grid size-8 place-items-center rounded-lg bg-white/95 text-rose-600 shadow" aria-label="Remove cover">
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          {...drop.props}
          className={cn(
            "flex aspect-[21/9] w-full max-w-xl flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm font-semibold transition-colors",
            drop.over ? "border-shu bg-shu/5 text-shu" : "border-ink/20 text-ink/55 hover:border-ink/50 hover:text-ink",
          )}
        >
          {busy ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-6" />}
          {busy ? "Uploading…" : "Upload cover image"}
          <span className="text-xs font-normal text-ink/45">Wide image, at least 1200px. Optional.</span>
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        onChange={(e) => {
          if (e.target.files?.length) pick([...e.target.files]);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-xs font-semibold text-rose-700">{error}</p>}
    </div>
  );
}
