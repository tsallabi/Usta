import { redirect } from "next/navigation";

/**
 * The root URL is rewritten to the static landing at /demos/index.html by
 * next.config.mjs (beforeFiles rewrite). This server component is a fallback
 * for the rare case where the rewrite doesn't kick in — it redirects to the
 * same destination so the user always ends up on the beautiful landing.
 */
export default function RootPage() {
  redirect("/demos/index.html");
}
