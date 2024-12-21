'use client'

import { WsProvider } from "@/contexts/wsContext";
import { ReactNode } from "react";

export default function Provider({ children }: { children: ReactNode }) {
  return <WsProvider>{children}</WsProvider>;
}
