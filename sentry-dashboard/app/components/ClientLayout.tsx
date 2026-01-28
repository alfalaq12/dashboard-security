'use client';

import Sidebar from "./Sidebar";
import AuthProvider from "./AuthProvider";
import { usePathname } from "next/navigation";

/*
 * Komponen wrapper untuk layout
 * Menentukan apakah perlu tampilkan sidebar atau tidak
 */
function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // halaman tanpa sidebar
    const noSidebarPages = ['/login'];
    const showSidebar = !noSidebarPages.includes(pathname);

    if (!showSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}

/*
 * Client layout dengan auth provider
 */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
    );
}
