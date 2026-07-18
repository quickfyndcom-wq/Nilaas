"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const PIXEL_ID = "1070471465441932";

export default function MetaPixel() {
  const pathname = usePathname();
  const isFirstPage = useRef(true);

  useEffect(() => {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    if (window.fbq) {
      window.fbq("init", PIXEL_ID);
      window.fbq("track", "PageView");
    }
  }, []);

  // Fire PageView on later client-side navigations only
  useEffect(() => {
    if (isFirstPage.current) {
      isFirstPage.current = false;
      return;
    }
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [pathname]);

  return (
    <>
      {/* Meta Pixel noscript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
