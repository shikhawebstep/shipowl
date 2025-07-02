  "use client"
import { React, useState, useCallback, useEffect } from 'react'
import { AiOutlineExclamationCircle } from "react-icons/ai";
import { Package, Truck, Boxes, Archive, Weight, Banknote, ShieldCheck, RotateCcw, ArrowUpRight, ArrowLeft, ChevronDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
  
  
  
   const stats = [{ label: "Units Sold", value: "200", icon: <Package className="w-7 h-7 text-orange-500" />, },
  { label: "Delivery Rate", value: "180", icon: <Truck className="w-7 h-7 text-orange-500" />, },
  { label: "Product GST", value: "18%", icon: <Boxes className="w-7 h-7 text-orange-500" />, },
  { label: "Inventory", value: "400", icon: <Archive className="w-7 h-7 text-orange-500" />, },
  { label: "Weight", value: "0.085 g", icon: <Weight className="w-7 h-7 text-orange-500" />, },
  { label: "Supplier Score", value: "4/5", icon: <ShieldCheck className="w-7 h-7 text-orange-500" />, },
  ];
  const features = [
    { icon: <Truck className="w-10 h-10 text-gray-600" />, text: 'Free Shipping' },
    { icon: <Banknote className="w-10 h-10 text-gray-600" />, text: 'Quality Assured Products' },
    { icon: <ShieldCheck className="w-10 h-10 text-gray-600" />, text: 'Cash On Delivery' },
    { icon: <RotateCcw className="w-10 h-10 text-gray-600" />, text: '5 Days Easy Return' },
  ];


  //calculation
  const [ordersGiven, setOrdersGiven] = useState(100);
  const productPrice = 60;
  const shippingCost = 75;

  const prepaidProductCost = productPrice * ordersGiven;
  const shippingDeduction = shippingCost * ordersGiven;
  const totalPrepaid = prepaidProductCost;
  //calculation
  <section className="productsingal-page">
        <div className="container">

          <div className="mx-auto  gap-4 justify-between  rounded-lg flex flex-col md:flex-row">
            <div className="w-full md:w-4/12">
              <div className="rounded-lg bg-white border border-[#E0E2E7] p-4">

              </div>
            </div>
            <div className="w-full md:w-8/12 bg-white rounded-lg border border-[#E0E2E7] p-6">
              <div className="product-details">
                <h2 className='capitalize text-3xl'>Plastic 2 In 1 Oil Dispenser 250 ml</h2>
                <p className="text-gray-600 mt-4">
                  Sold: <span className="text-black">1,316 </span> | Rating: ⭐
                  <span className="text-black"> 123 </span> | Stock:
                  <span className="text-black"> 25 </span>
                </p>
                <div className="md:flex justify-between pb-3 pt-2">
                  <p className="text-black">
                    SKU Code: <span className="text-black">#302012</span>
                  </p>
                  <p className="text-black">
                    Created: <span className="text-black">12-04-2024</span>
                  </p>
                </div>
                <p className='font-bold text-2xl'>₹150</p>


              </div>
              <div className="grid grid-cols-1 mt-4 sm:grid-cols-2 md:grid-cols-3 border border-[#D9D9D9]  rounded-lg  bg-white">
                {stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 border-[#D9D9D9] 
    ${[0, 1, 2].includes(idx) ? 'md:pl-4 md:border-b' : ''} 
    ${[0, 1, 3, 4].includes(idx) ? 'border-r' : ''} 
  
    ${idx === 5 ? 'border-r-0' : ''}
  `}
                  >


                    <span className='text-xl'>{stat.icon}</span>
                    <div>
                      <p className="text-gray-500 ">{stat.label}:</p>
                      <p className="text-indigo-900 font-semibold">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="variants-box mt-5">
                <div className=" p-4 border-gray-200 bg-[#F1F5F9] rounded-md">

                  <div className="flex justify-between">
                    <p className='flex items-center gap-2'>Including GST & Shipping Charges <AiOutlineExclamationCircle className='text-green-500' /></p>
                  </div>
                  <div className="grid grid-cols-1 mt-2 md:grid-cols-3 gap-0 rounded-lg overflow-hidden border border-gray-200 bg-white ">
                    <div className="p-4 border-b  md:border-r border-gray-200">
                      <p className="text-gray-500 mb-1">Product Listed Price:</p>
                      <p className="font-semibold text-black">₹{productPrice}</p>
                    </div>

                    <div className="p-4 border-b  md:border-r border-gray-200">
                      <label className="text-gray-500 block mb-1" htmlFor="ordersGiven">
                        Orders Given:
                      </label>
                      <input
                        id="ordersGiven"
                        type="number"
                        value={ordersGiven}
                        onChange={(e) => setOrdersGiven(Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-3 py-1 w-full"
                      />
                    </div>

                    <div className="p-4 border-b border-gray-200 ">
                      <p className="text-gray-500 mb-1">Prepaid Product Cost:</p>
                      <p className="font-semibold text-black">
                        ₹{productPrice} X {ordersGiven} = ₹{prepaidProductCost.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-4 border-b md:border-b-0 md:border-r border-gray-200">
                      <p className="text-gray-500 mb-1">Shipping Cost:</p>
                      <p className="font-semibold text-black">₹{shippingCost}</p>
                    </div>

                    <div className="p-4 border-b md:border-b-0 md:border-r border-gray-200">
                      <p className="text-gray-500 mb-1">Shipping Deduction:</p>
                      <p className="font-semibold text-black">
                        ₹{shippingCost} X {ordersGiven} = ₹{shippingDeduction.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-4">
                      <p className="text-gray-500 mb-1">Total Prepaid:</p>
                      <p className="font-semibold text-black">
                        ₹{totalPrepaid.toLocaleString()} <span className="text-sm text-gray-500">(Via Wallet)</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="description-box my-5">
                <p>
                  Description
                </p>
              </div>
              <div className="shipping-platform">
                <div className="border border-[#F5F5F5] rounded-xl p-6 bg-white">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 text-center">
                    {features.map((item, index) => (
                      <div key={index} className="flex flex-col items-center gap-2">
                        <span className="text-4xl">  {item.icon}</span>
                        <p className="text-sm text-gray-800 font-medium pt-3">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Weight & Dimension:</h3>
                  <p className="text-sm text-gray-800 mt-1">
                    0.085kg / 17 CM, 9 CM, 8 CM <span className="text-orange-500">(H,L,W)</span>
                  </p>
                </div>

                <hr className="border-gray-200" />

                <div className="flex flex-col md:flex-row items-stretch gap-4">
                  {/* Push to Shopify */}
                  <button className="flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-orange-700 transition">
                    <ArrowUpRight size={16} />
                    Push To Shopify
                  </button>

                  {/* Info Box */}
                  <div className="flex items-center justify-between gap-3 bg-gray-100 px-4 py-3 rounded-md flex-1 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <ArrowLeft size={16} />
                      <span>
                        RTO & RVP charges are applicable and vary depending on the product weight.{' '}
                        <a href="#" className="underline text-black hover:text-orange-600 transition">
                          View charges for this product
                        </a>
                      </span>
                    </div>
                    <ChevronDown className="text-gray-500" size={16} />
                  </div>
                </div>
              </div>

            </div>


          </div>
        </div>
      </section>