// components/BrandSwiper.js
'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import Image from 'next/image';
import { useImageURL } from '@/components/ImageURLContext';

export default function BrandSwiper({ images }) {
  const { fetchImages } = useImageURL();

  return (
    <Swiper
      modules={[Navigation]}
      slidesPerView={1}
      loop={images.length > 1}
      navigation
      className="mySwiper xl:w-[250px] md:w-[100px] md:h-[100px] lg:h-[200px] w-[50px] ms-2 h-[50px]"
    >
      {images.map((img, index) => (
        <SwiperSlide key={index}>
          <Image
            src={fetchImages(img)}
            alt={`Brand Image ${index + 1}`}
            width={200}
            height={200}
            className="me-3 w-full h-full text-center object-cover rounded"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
