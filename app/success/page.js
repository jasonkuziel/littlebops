import { head } from "@vercel/blob";
import SuccessClient from "./SuccessClient";

export async function generateMetadata({ searchParams }) {
  const sessionId = searchParams?.session_id;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://getlittlebops.com").replace(/\/+$/, "");

  let title = "Your Song is Ready! | LittleBops";
  let description = "A one-of-a-kind personalized song, made with love.";

  if (sessionId) {
    const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, "");
    if (safeId) {
      try {
        const blobInfo = await head("orders/" + safeId + ".json");
        const response = await fetch(blobInfo.downloadUrl);
        const text = await response.text();
        if (text.startsWith("{")) {
          const order = JSON.parse(text);
          if (order.childName) {
            title = "Listen to " + order.childName + "'s Song | LittleBops";
            description = "A one-of-a-kind song made just for " + order.childName + "!";
          }
        }
      } catch (e) {
        // Fall back to default metadata
      }
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "LittleBops",
      url: appUrl + "/success" + (sessionId ? "?session_id=" + sessionId : ""),
      type: "website",
    },
  };
}

export default function SuccessPage() {
  return <SuccessClient />;
}
