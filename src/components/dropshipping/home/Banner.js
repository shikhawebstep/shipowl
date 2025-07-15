'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Navigation } from 'swiper/modules';
import 'swiper/css/navigation';
function Banner() {
  const router = useRouter();
  const [bannerImages, setBannerImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBanners = useCallback(async () => {
    const dropshipperData = JSON.parse(localStorage.getItem("shippingData"));

    if (dropshipperData?.project?.active_panel !== "dropshipper") {
      localStorage.removeItem("shippingData");
      router.push("/dropshipping/auth/login");
      return;
    }

    const dropshippertoken = dropshipperData?.security?.token;
    if (!dropshippertoken) {
      router.push("/dropshipping/auth/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/dropshipper/banner`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${dropshippertoken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Something Wrong!",
          text: result.error || result.message || "Network Error.",
        });
        throw new Error(result.message || result.error || "Something Wrong!");
      }

      // Split the image string into an array
      const imageString = result?.banner?.image || "";
      const imageArray = imageString
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url); // Remove empty entries

      setBannerImages(imageArray);
    } catch (error) {
      console.error("Error fetching banner images:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  return (
    <section className="xl:pb-8 xl:px-4">
      <div className="container">
        {bannerImages.length > 0 ? (
          <Swiper
            spaceBetween={20}
            slidesPerView={1}
            modules={[Navigation]}
            loop
            navigation={true}
            autoplay={{ delay: 3000 }}
          >
            {bannerImages.map((url, index) => (
              <SwiperSlide key={index}>
                <div
                  className="w-full h-[300px] bg-cover bg-center rounded-xl"
                  style={{ backgroundImage: `url(${url})` }}
                ></div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            {loading ? "Loading banners..." : "No banners available."}
          </div>
        )}
      </div>
    </section>
  );
}

export default Banner;
