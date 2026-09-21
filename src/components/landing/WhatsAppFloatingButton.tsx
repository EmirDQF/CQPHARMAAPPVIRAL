"use client";

import { usePathname } from "next/navigation";
import { buildGeneralInquiryWhatsAppLink } from "@/lib/whatsapp";

export function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const whatsAppLink = buildGeneralInquiryWhatsAppLink();

  if (pathname?.startsWith("/app")) return null;

  return (
    <a
      href={whatsAppLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Habla con un asesor médico sobre tus articulaciones"
      className="group fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform"
    >
      <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-40 animate-ping" />
      <svg
        viewBox="0 0 32 32"
        className="relative w-7 h-7"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.004 2.667c-7.363 0-13.333 5.97-13.333 13.333 0 2.353.615 4.56 1.69 6.475L2.667 29.333l7.025-1.843a13.26 13.26 0 0 0 6.312 1.61h.006c7.362 0 13.333-5.97 13.333-13.333S23.366 2.667 16.004 2.667Zm0 24.194h-.005a10.85 10.85 0 0 1-5.532-1.516l-.397-.236-4.169 1.094 1.113-4.064-.259-.417a10.83 10.83 0 0 1-1.664-5.722c0-6.004 4.888-10.89 10.918-10.89 2.916 0 5.656 1.137 7.717 3.199a10.83 10.83 0 0 1 3.196 7.703c-.002 6.005-4.89 10.85-10.918 10.85Zm5.978-8.155c-.328-.164-1.94-.957-2.24-1.066-.301-.109-.52-.164-.738.164-.219.328-.848 1.066-1.04 1.285-.191.219-.383.246-.71.082-.328-.164-1.386-.51-2.64-1.628-.976-.87-1.635-1.945-1.827-2.273-.191-.328-.02-.505.144-.668.148-.147.328-.383.492-.574.164-.191.219-.328.328-.547.11-.219.055-.41-.027-.574-.082-.164-.738-1.777-1.012-2.434-.267-.64-.538-.554-.738-.564l-.629-.011a1.206 1.206 0 0 0-.874.41c-.301.328-1.148 1.121-1.148 2.734s1.176 3.172 1.34 3.39c.164.219 2.315 3.535 5.608 4.957.784.339 1.396.542 1.873.694.787.25 1.503.215 2.07.13.631-.094 1.94-.793 2.213-1.559.273-.766.273-1.422.191-1.559-.082-.136-.301-.219-.629-.383Z" />
      </svg>
    </a>
  );
}
