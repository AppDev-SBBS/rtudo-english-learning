import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

export const metadata = {
  title: "R-Tudo",
  description: "Learn English the smart way",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
