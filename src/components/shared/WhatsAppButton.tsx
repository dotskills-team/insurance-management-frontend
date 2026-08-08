
"use client";

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppButton({
  phoneNumber = "8801350775021",
  message = "Hi! I'd like to know more.",
}: {
  phoneNumber?: string;
  message?: string;
}) {
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Chat on WhatsApp"
      className={`fixed bottom-18 right-1 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-110 ${
        hovered ? "scale-110" : "scale-100"
      }`}
    >
      <FaWhatsapp size={24} />
    </button>
  );
}