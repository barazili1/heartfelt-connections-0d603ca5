import { createFileRoute, Link } from "@tanstack/react-router";
import jsPDF from "jspdf";
import {
  ArrowRight,
  Check,
  FileDown,
  ImageDown,
  Loader2,
  ShieldAlert,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import logo from "@/assets/logo.png";
import { Particles } from "@/components/Particles";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { resolveDevice } from "@/lib/device";

type Status = "pending" | "approved" | "rejected";

type Submission = {
  id: string;
  player_id: string;
  status: string;
  created_at: string;
  promo_image_url: string;
  account_image_url: string;
  promoSigned?: string;
  accountSigned?: string;
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الأدمن — KAJO ARENA" },
      { name: "description", content: "مراجعة طلبات الاشتراك في المسابقة وقبولها أو رفضها." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "لوحة الأدمن — KAJO ARENA" },
      { property: "og:description", content: "مراجعة طلبات الاشتراك في المسابقة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const info = await resolveDevice();
      setDeviceId(info.deviceId);
      setIsAdmin(info.isAdmin);
    })();
  }, []);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("submissions")
      .select("id, player_id, status, created_at, promo_image_url, account_image_url")
      .order("created_at", { ascending: false });
    const list = data ?? [];
    const signed = await Promise.all(
      list.map(async (row) => {
        const [a, b] = await Promise.all([
          supabase.storage.from("proofs").createSignedUrl(row.promo_image_url, 3600),
          supabase.storage.from("proofs").createSignedUrl(row.account_image_url, 3600),
        ]);
        return {
          ...row,
          promoSigned: a.data?.signedUrl,
          accountSigned: b.data?.signedUrl,
        } as Submission;
      }),
    );
    setRows(signed);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const review = async (id: string, status: Status) => {
    await supabase.from("submissions").update({ status }).eq("id", id);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const approvedIds = rows.filter((r) => r.status === "approved").map((r) => r.player_id);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("KAJO ARENA - Approved IDs", 14, 18);
    doc.setFontSize(11);
    approvedIds.forEach((id, i) => {
      doc.text(`${i + 1}. ${id}`, 14, 30 + i * 7);
      if ((30 + i * 7) % 280 === 0) doc.addPage();
    });
    doc.save("approved-ids.pdf");
  };

  const exportImage = () => {
    const canvas = document.createElement("canvas");
    const width = 600;
    const height = 100 + approvedIds.length * 34;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#f0c25a";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("KAJO ARENA — Approved IDs", 24, 48);
    ctx.font = "20px monospace";
    ctx.fillStyle = "#f6f0e4";
    approvedIds.forEach((id, i) => {
      ctx.fillText(`${i + 1}.  ${id}`, 24, 92 + i * 34);
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "approved-ids.png";
    link.click();
  };

  if (deviceId === null || isAdmin === null) return null;

  if (!isAdmin) {
    return (
      <div dir="rtl" className="relative flex min-h-screen items-center justify-center bg-background px-4">
        <Particles />
        <div className="glass relative z-10 max-w-sm rounded-2xl p-8 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="gold-text mt-4 text-xl font-black">غير مصرح لك</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            هذه الصفحة متاحة لأجهزة الإدارة فقط.
          </p>
          <Button className="mt-6 w-full font-bold" asChild>
            <Link to="/terms">العودة للشروط</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-background pb-20">
      <Particles />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-96 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_70%)]" />

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <span className="gold-text text-lg font-black tracking-wide">لوحة الأدمن</span>
          <Button size="sm" variant="outline" asChild>
            <Link to="/terms">
              <ArrowRight className="size-4" />
              الشروط
            </Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4">
        <section className="flex flex-col items-center pt-8">
          <div className="glass rounded-full p-4">
            <img
              src={logo}
              alt="شعار المسابقة"
              width={1024}
              height={1024}
              loading="lazy"
              className="w-20 drop-shadow-[0_0_28px_rgba(255,196,80,0.35)]"
            />
          </div>
          <div className="mt-3 h-px w-40 bg-gradient-to-l from-transparent via-primary to-transparent" />
        </section>

        <Tabs defaultValue="pending" className="mt-8">
          <TabsList className="glass grid w-full grid-cols-4 rounded-xl p-1">
            <TabsTrigger value="pending">المعلقة</TabsTrigger>
            <TabsTrigger value="approved">المقبولة</TabsTrigger>
            <TabsTrigger value="rejected">المرفوضة</TabsTrigger>
            <TabsTrigger value="ids">الايديهات</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="glass mt-6 flex items-center justify-center gap-2 rounded-2xl p-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              جاري التحميل...
            </div>
          ) : (
            <>
              {(["pending", "approved", "rejected"] as Status[]).map((s) => (
                <TabsContent key={s} value={s} className="mt-6 space-y-5">
                  {rows.filter((r) => r.status === s).length === 0 && (
                    <p className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
                      لا يوجد طلبات هنا.
                    </p>
                  )}
                  {rows
                    .filter((r) => r.status === s)
                    .map((row) => (
                      <article key={row.id} className="glass rounded-2xl p-5">
                        <div className="mb-4 flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(row.created_at).toLocaleString("ar-EG")}
                          </span>
                          <span
                            dir="ltr"
                            className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-base font-black tracking-widest text-primary"
                          >
                            {row.player_id}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <ProofThumb
                            label="صورة البروموكود"
                            src={row.promoSigned}
                            onOpen={setPreview}
                          />
                          <ProofThumb
                            label="صورة الحساب"
                            src={row.accountSigned}
                            onOpen={setPreview}
                          />
                        </div>
                        {s === "pending" && (
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <Button
                              className="font-bold"
                              onClick={() => void review(row.id, "approved")}
                            >
                              <Check className="size-4" />
                              موافقة
                            </Button>
                            <Button
                              variant="destructive"
                              className="font-bold"
                              onClick={() => void review(row.id, "rejected")}
                            >
                              <X className="size-4" />
                              رفض
                            </Button>
                          </div>
                        )}
                      </article>
                    ))}
                </TabsContent>
              ))}

              <TabsContent value="ids" className="mt-6">
                <section className="glass rounded-2xl p-5">
                  <h2 className="gold-text mb-4 text-lg font-black">
                    الايديهات المقبولة ({approvedIds.length})
                  </h2>
                  <div className="space-y-2">
                    {approvedIds.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground">
                        لا يوجد ايديهات مقبولة بعد.
                      </p>
                    )}
                    {approvedIds.map((id, i) => (
                      <div
                        key={id + i}
                        dir="ltr"
                        className="flex items-center justify-between rounded-xl border border-border bg-background/30 px-4 py-2.5 font-mono text-sm font-bold text-foreground"
                      >
                        <span className="text-muted-foreground">{i + 1}</span>
                        <span className="tracking-widest text-primary">{id}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Button
                      className="font-bold"
                      onClick={exportPdf}
                      disabled={approvedIds.length === 0}
                    >
                      <FileDown className="size-4" />
                      تصدير PDF
                    </Button>
                    <Button
                      variant="outline"
                      className="font-bold"
                      onClick={exportImage}
                      disabled={approvedIds.length === 0}
                    >
                      <ImageDown className="size-4" />
                      تصدير صورة
                    </Button>
                  </div>
                </section>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="إغلاق المعاينة"
            onClick={() => setPreview(null)}
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full border border-primary/40 bg-background/70 text-primary"
          >
            <X className="size-6" />
          </button>
          <img
            src={preview}
            alt="معاينة الصورة"
            className="max-h-[85vh] max-w-full rounded-2xl border border-primary/30 object-contain"
          />
        </div>
      )}
    </div>
  );
}

function ProofThumb({
  label,
  src,
  onOpen,
}: {
  label: string;
  src?: string | undefined;
  onOpen: (src: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-center text-xs font-semibold text-muted-foreground">{label}</p>
      <button
        type="button"
        onClick={() => src && onOpen(src)}
        className="aspect-square w-full overflow-hidden rounded-xl border border-border bg-background/30"
      >
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground">لا توجد صورة</span>
        )}
      </button>
    </div>
  );
}
