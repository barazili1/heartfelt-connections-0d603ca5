import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check, Copy, Download, ImagePlus, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import logo from "@/assets/logo.png";
import stepDownload from "@/assets/step-download.jpg";
import stepPromo from "@/assets/step-promo.jpg";
import stepUpload from "@/assets/step-upload.jpg";
import { Particles } from "@/components/Particles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PROMO_CODE = "KAJO117";
const PLATFORM_URL = "https://ultrapari.com";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "شروط الاشتراك في المسابقة — KAJO ARENA" },
      {
        name: "description",
        content:
          "شروط الانضمام: تحميل منصة Ultrapari، التسجيل بالبرومو كود KAJO117، ورفع صور التأكيد.",
      },
      { property: "og:title", content: "شروط الاشتراك في المسابقة" },
      {
        property: "og:description",
        content: "شروط الانضمام للمسابقة خطوة بخطوة مع رفع صور التأكيد.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const [warnOpen, setWarnOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [usersOnline, setUsersOnline] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setUsersOnline(120 + Math.floor(Math.random() * 80));
    const id = window.setInterval(() => {
      setUsersOnline((v) => Math.max(80, v + Math.floor(Math.random() * 7) - 3));
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-background pb-20">
      <Particles />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-96 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_70%)]" />

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <span className="gold-text text-lg font-black tracking-wide">KAJO ARENA</span>
          <span className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Users online : {usersOnline}
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4">
        <section className="flex flex-col items-center pt-8">
          <div className="glass rounded-full p-4">
            <img
              src={logo}
              alt="شعار المسابقة"
              width={1024}
              height={1024}
              loading="lazy"
              className="w-24 drop-shadow-[0_0_28px_rgba(255,196,80,0.35)]"
            />
          </div>
          <h1 className="gold-text mt-4 text-3xl font-black">الشروط</h1>
          <div className="mt-3 h-px w-40 bg-gradient-to-l from-transparent via-primary to-transparent" />
        </section>

        <div className="mt-8 space-y-6">
          <StepCard index={1} title="تحميل منصة Ultrapari" image={stepDownload}>
            <Button
              className="w-full border border-border bg-white font-bold text-black hover:bg-white/90"
              asChild
            >
              <a href={PLATFORM_URL} target="_blank" rel="noopener noreferrer">
                <Download className="size-4" />
                تحميل
              </a>
            </Button>
          </StepCard>

          <StepCard index={2} title="التسجيل بالبروموكود الخاص بنا" image={stepPromo}>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-dashed border-primary/60 bg-background/40 px-4 py-3 text-center text-lg font-black tracking-[0.25em] text-primary">
                {PROMO_CODE}
              </div>
              <Button variant="outline" onClick={copyCode} aria-label="نسخ البروموكود">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "تم النسخ" : "نسخ"}
              </Button>
            </div>
            <Button className="mt-4 w-full font-bold" asChild>
              <a href={PLATFORM_URL} target="_blank" rel="noopener noreferrer">
                <UserPlus className="size-4" />
                التسجيل
              </a>
            </Button>
          </StepCard>

          <StepCard index={3} title="رفع صور التأكيد" image={stepUpload}>
            <p className="mb-3 text-sm font-black text-destructive">إجباري</p>
            <div className="grid grid-cols-2 gap-3">
              <UploadBox label="رفع صورة البروموكود" />
              <UploadBox label="رفع صورة الحساب" />
            </div>
            <Button className="mt-4 w-full font-bold" onClick={() => setConfirmed(true)}>
              <Check className="size-4" />
              {confirmed ? "تم التأكيد" : "تأكيد"}
            </Button>
          </StepCard>
        </div>
      </main>

      <Dialog open={warnOpen} onOpenChange={setWarnOpen}>
        <DialogContent
          dir="rtl"
          className="glass max-w-sm bg-popover/80 text-right backdrop-blur-2xl"
        >
          <DialogHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full border border-destructive/40 bg-destructive/15 text-destructive">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="gold-text text-center text-xl">تحذير</DialogTitle>
            <DialogDescription className="text-center leading-7 text-muted-foreground">
              الاشتراك يكون مرة واحدة فقط في المسابقة لكل هاتف، برجاء الالتزام بالشروط للانضمام
              الصحيح للمسابقة وعدم حدوث أي مشاكل في تسجيلك.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full font-bold" onClick={() => setWarnOpen(false)}>
              فهمت، متابعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StepCard({
  index,
  title,
  image,
  children,
}: {
  index: number;
  title: string;
  image: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-sm font-black text-primary">
          {index}
        </span>
        <img
          src={image}
          alt={title}
          width={768}
          height={768}
          loading="lazy"
          className="size-14 shrink-0 rounded-xl border border-border object-cover"
        />
        <h2 className="text-base font-bold text-card-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function UploadBox({ label }: { label: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div>
      <p className="mb-2 text-center text-xs font-semibold text-muted-foreground">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border bg-background/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <>
            <ImagePlus className="size-6" />
            <span className="text-xs">اختر صورة</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setPreview(URL.createObjectURL(file));
        }}
      />
    </div>
  );
}
