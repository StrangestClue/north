"use client";

import Link from "next/link";
import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MusicLibrary } from "@/components/music/music-library";
import { StockFootageConfig } from "@/components/stock/stock-footage-config";

interface HeaderProps {
  showBack?: boolean;
  title?: string;
  children?: React.ReactNode;
}

export function Header({ showBack, title, children }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <div className="flex items-center gap-3">
        {showBack && (
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              &larr; Back
            </Button>
          </Link>
        )}
        <Link href="/" className="flex items-center gap-2">
          <Film className="h-5 w-5" />
          <span className="font-semibold tracking-tight">North</span>
        </Link>
        {title && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground truncate max-w-[300px]">
              {title}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {children}
        <StockFootageConfig />
        <MusicLibrary />
      </div>
    </header>
  );
}
