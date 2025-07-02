import React from 'react'
import bannerImage from '@/app/assets/homebanner.jpg';
import Image from 'next/image';
function Banner() {
  return (
    <>
      <section className='xl:pb-8 xl:px-4'>
        <div className="container">
          <div className="banner-image">
            <Image src={bannerImage} className='w-full' alt="Banner Image" />
          </div>
        </div>
      </section>

    </>
  )
}

export default Banner