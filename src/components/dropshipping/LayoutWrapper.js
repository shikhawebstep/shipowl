"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DropshipperMiddleWareProvider from "./middleware/DropshipperMiddleWareContext";
import { DropshipperProfileProvider } from "./dropshipper/update/DropshipperProfileContext";
import { ProfileProvider } from "../admin/supplier/ProfileContext";
import { HashLoader } from "react-spinners";
import { ImageURLProvider } from "../ImageURLContext";
import { DropshipperActionProvider } from '@/components/commonfunctions/DropshipperMainContext'

const authPages = [
  '/dropshipping/shopify/success',
  '/dropshipping/shopify/connecting',
  '/dropshipping/shopify/failed',
  '/dropshipping/auth/login',
  '/dropshipping/auth/password/forget',
  '/dropshipping/auth/password/reset',
  '/dropshipping/auth/register',
  '/dropshipping/auth/register/verify',
];

function LayoutWrapperInner({ children }) {
  const pathname = usePathname();
  const normalizedPath =
    pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  const isAuthPage = authPages.includes(normalizedPath);

  return (
    <div className={`main-wrapper ${!isAuthPage ? 'lg:flex' : ''}`}>
      {!isAuthPage && (
        <div className="xl:w-[18.5%] lg:w-[23%] w-full p-2 leftbar">
          <Sidebar />
        </div>
      )}
      <div className={`px-3 mt-20 lg:mt-0 lg:px-0 ${isAuthPage ? "w-full" : "main-outlet xl:w-[81.5%] lg:w-[73%]"}`}>
        {!isAuthPage && <Header />}
        <div className="md:p-7 xl:p-3 md:pt-0">
          <DropshipperActionProvider>
            <ProfileProvider>
              <DropshipperProfileProvider>{children}</DropshipperProfileProvider>
            </ProfileProvider>
          </DropshipperActionProvider>
        </div>
      </div>
    </div>
  );
}

export default function LayoutWrapper({ children }) {
  return (
    <ImageURLProvider>
      <DropshipperMiddleWareProvider>
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-96">
              <HashLoader color="orange" />
            </div>
          }
        >
          <LayoutWrapperInner>{children}</LayoutWrapperInner>
        </Suspense>
      </DropshipperMiddleWareProvider>
    </ImageURLProvider>
  );
}
