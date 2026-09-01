import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "المشاركة في المسابقة — انطلاقة" },
      {
        name: "description",
        content: "انضم إلى المسابقة عبر التسجيل بالبرومو كود الخاص بنا ورفع صور التأكيد.",
      },
      { property: "og:title", content: "المشاركة في المسابقة" },
      {
        property: "og:description",
        content: "انضم إلى المسابقة عبر التسجيل بالبرومو كود الخاص بنا ورفع صور التأكيد.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / 3000) * 100);
      setProgress(pct);
    }, 40);
    const timeout = window.setTimeout(() => {
      navigate({ to: "/terms" });
    }, 3000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6"
    >
      <div className="pointer-events-none absolute -top-32 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <img
        src={logo}
        alt="شعار المسابقة"
        width={1024}
        height={1024}
        className="relative w-44 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] sm:w-56"
      />
      <h1 className="relative mt-6 text-center text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        المشاركة في المسابقة
      </h1>

      <div className="relative mt-10 w-full max-w-xs">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-l from-primary to-accent transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          جاري التحميل… {Math.round(progress)}%
        </p>
      </div>
    </main>
  );
}
