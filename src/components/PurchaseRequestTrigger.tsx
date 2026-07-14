"use client";

import { useState } from "react";
import PurchaseRequestModal from "@/components/PurchaseRequestModal";

interface PurchaseRequestTriggerProps {
  artworkId: string;
  artworkTitle: string;
}

export default function PurchaseRequestTrigger({
  artworkId,
  artworkTitle,
}: PurchaseRequestTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-accent px-8 py-3.5 text-base font-medium text-white shadow-sm transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-accent/30"
      >
        Request to Purchase
      </button>
      <PurchaseRequestModal
        isOpen={open}
        onClose={() => setOpen(false)}
        artworkId={artworkId}
        artworkTitle={artworkTitle}
      />
    </>
  );
}
