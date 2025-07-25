import { DM_Sans } from "next/font/google";
import LayoutWrapper from "@/components/dropshipping/LayoutWrapper";
import '@/app/globals.css'
const dmSans = DM_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-dm-sans",
});

export const metadata = {
    title: "Dropshipping Dashboard",
    description: "Generated by create next app",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${dmSans.variable} antialiased`}>
                    <div className="main-wrapper">
                        <LayoutWrapper>{children}</LayoutWrapper>
                    </div>
            </body>
        </html>
    );
}
