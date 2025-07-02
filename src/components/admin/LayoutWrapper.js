"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "@/app/globals.css";
import { ProfileProvider } from "./supplier/ProfileContext";
import { ProfileEditProvider } from "./supplier/update/ProfileEditContext";
import AdminMiddleWareProvider from "./middleware/AdminMiddleWareContext";
import { DropshipperProfileProvider } from "./dropshipper/DropshipperProfileContext";
import { ProductProvider } from "./addproducts/ProductContext";
import { ProductProviderEdit } from "./products/ProductContextEdit";
import { AdminActionProvider } from "../commonfunctions/MainContext";
import { HashLoader } from "react-spinners";
import { ImageURLProvider } from "../ImageURLContext";

const authPages = new Set([
  "/admin/auth/login",
  "/admin/auth/login/",
  "/admin/auth/password/forget",
  "/admin/auth/password/forget/",
  "/admin/auth/password/reset",
  "/admin/auth/password/reset/"
]);

function LayoutWrapperInner({ children }) {
  const pathname = usePathname();
  const isAuthPage = authPages.has(pathname);

  return (
    <div className={`main ${!isAuthPage ? "lg:flex" : ""}`}>
      {!isAuthPage && (
        <div className="xl:w-[18.5%] lg:w-[27%] w-full p-2 leftbar">
          <Sidebar />
        </div>
      )}

      <div
        className={`px-3 mt-20 lg:mt-0 lg-px-0 ${
          isAuthPage ? "w-full" : "main-outlet xl:w-[81.5%] lg:w-[73%]"
        }`}
      >
        {!isAuthPage && <Header />}
        <div className="xl:p-3 md:pt-4 md:px-0">
          <DropshipperProfileProvider>
            <ProductProviderEdit>
              <ProfileProvider>
                <ProductProvider>
                  <ProfileEditProvider>{children}</ProfileEditProvider>
                </ProductProvider>
              </ProfileProvider>
            </ProductProviderEdit>
          </DropshipperProfileProvider>
        </div>
      </div>
    </div>
  );
}

export default function LayoutWrapper({ children }) {
  return (
    <ImageURLProvider>
      <AdminActionProvider>
        <AdminMiddleWareProvider>
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-96">
                <HashLoader color="orange" />
              </div>
            }
          >
            <LayoutWrapperInner>{children}</LayoutWrapperInner>
          </Suspense>
        </AdminMiddleWareProvider>
      </AdminActionProvider>
    </ImageURLProvider>
  );
}
