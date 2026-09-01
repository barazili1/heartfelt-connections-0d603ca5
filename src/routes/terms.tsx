import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check, Copy, Download, ImagePlus, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import logo from "@/assets/logo.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PROMO_CODE = "KAJO117";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "شروط الاشتراك في المسابقة" },
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
    <div dir="rtl" className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-lg font-extrabold text-transparent">
            KAJO ARENA
          </span>
          <span className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Users online : {usersOnline}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4">
        <section className="flex flex-col items-center pt-8">
          <img
            src={logo}
            alt="شعار المسابقة"
            width={1024}
            height={1024}
            loading="lazy"
            className="w-28 drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
          />
          <h1 className="mt-4 text-2xl font-extrabold text-foreground">الشروط</h1>
        </section>

        <div className="mt-8 space-y-5">
          <StepCard index={1} title="تحميل منصة Ultrapari">
            <Button
              variant="secondary"
              className="w-full bg-white font-bold text-black hover:bg-white/90"
              asChild
            >
              <a href="https://ultrapari.com" target="_blank" rel="noopener noreferrer">
                <Download className="size-4" />
                تحميل
              </a>
            </Button>
          </StepCard>

          <StepCard index={2} title="التسجيل بالبروموكود الخاص بنا">
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-dashed border-primary/50 bg-secondary px-4 py-3 text-center text-lg font-extrabold tracking-widest text-primary">
                {PROMO_CODE}
              </div>
              <Button variant="outline" onClick={copyCode} aria-label="نسخ البروموكود">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "تم النسخ" : "نسخ"}
              </Button>
            </div>
            <Button className="mt-4 w-full font-bold" asChild>
              <a href="https://ultrapari.com" target="_blank" rel="noopener noreferrer">
                <UserPlus className="size-4" />
                التسجيل
              </a>
            </Button>
          </StepCard>

          <StepCard index={3} title="رفع صور التأكيد">
            <p className="mb-3 text-sm font-bold text-destructive">إجباري</p>
            <div className="grid grid-cols-2 gap-3">
              <UploadBox label="رفع صورة البروموكود" />
              <UploadBox label="رفع صورة الحساب" />
            </div>
            <Button className="mt-4 w-full font-bold">
              <Check className="size-4" />
              تأكيد
            </Button>
          </StepCard>
        </div>
      </main>

      <Dialog open={warnOpen} onOpenChange={setWarnOpen}>
        <DialogContent dir="rtl" className="max-w-sm text-right">
          <DialogHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-center">تحذير</DialogTitle>
            <DialogDescription className="text-center leading-7">
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
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-lg shadow-black/20">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
          {index}
        </span>
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
        className="flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border bg-secondary/60 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
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
