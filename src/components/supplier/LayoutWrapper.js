"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ProfileProvider } from "./userprofile/ProfileContext";
import SupplierMiddleWareProvider from "./middleware/SupplierMiddleWareContext";
import { CategoryProvider } from "./category/CategoryContext";
import { ApiProvider } from "../ApiContext";
import { BrandProvider } from "./brand/BrandContext";
import { ProductProviderEdit } from "./products/ProductContextEdit";
import { ProductProvider } from "./addproducts/ProductContext";
import { HashLoader } from "react-spinners";
import { ImageURLProvider } from "../ImageURLContext";

const authPages = new Set([
  '/',
  '/supplier/auth/login',
  '/supplier/auth/password/forget',
  '/supplier/auth/password/reset',
  '/supplier/auth/register',
  '/supplier/auth/register/verify',
  '/admin/auth/login',
  '/dropshipping/auth/login',
  '/dropshipping/shopify/success',
  '/dropshipping/shopify/failed',
  '/dropshipping/shopify/connecting',
  '/dropshipping/auth/password/forget',
  '/dropshipping/auth/password/reset',
  '/dropshipping/auth/register',
  '/dropshipping/auth/register/verify'
]);

function LayoutWrapperInner({ children }) {
  const pathname = usePathname();
  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

  const isAuthPage = authPages.has(normalizedPath);

  const content = (
    <div className={`${!isAuthPage ? "lg:flex" : ""}`}>
      {!isAuthPage && (
        <div className="xl:w-[18.5%] lg:w-[23%] w-full p-2 leftbar">
          <Sidebar />
        </div>
      )}
      <div
        className={`px-3 mt-20 lg:mt-0 lg-px-0 ${
          isAuthPage ? "w-full" : "main-outlet xl:w-[81.5%] lg:w-[77%]"
        }`}
      >
        {!isAuthPage && <Header />}
        <div className="xl:p-3 md:pt-4 md:px-0">
          <ProductProviderEdit>
            <ProductProvider>
              <ApiProvider>
                <CategoryProvider>
                  <BrandProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                  </BrandProvider>
                </CategoryProvider>
              </ApiProvider>
            </ProductProvider>
          </ProductProviderEdit>
        </div>
      </div>
    </div>
  );

  return content;
}

export default function LayoutWrapper({ children }) {
  return (
    <ImageURLProvider>
      <SupplierMiddleWareProvider>
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-96">
              <HashLoader color="orange" />
            </div>
          }
        >
          <LayoutWrapperInner>{children}</LayoutWrapperInner>
        </Suspense>
      </SupplierMiddleWareProvider>
    </ImageURLProvider>
  );
}
