export const metadata = {
  title: "LittleBops — Personalized Songs for Kids",
  description: "A unique, AI-created song made just for your child. Tell us their story, pick a genre, and get a catchy original song in under 2 minutes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: "#FFFBF5" }}>{children}</body>
    </html>
  );
}
