import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import ChatSidebar from "@/components/page-components/ChatSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "IEnterprise Copilot",
  description: "IEnterprise Copilot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${robotoMono.variable}  antialiased`}
      >
        <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
        >
           <SidebarProvider defaultOpen={false}>
  <div className="flex h-screen w-full"> 
    {/* Sidebar */}
    <div className=" bg-sidebar min-h-full">
      <ChatSidebar />
    </div>

        {children}
        </div>
</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
