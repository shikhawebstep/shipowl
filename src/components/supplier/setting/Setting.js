'use client';

import { useState } from 'react';

export default function Setting() {
  const [warehouseAddress, setWarehouseAddress] = useState(true);
  const [thermalPrinter, setThermalPrinter] = useState(false);

  return (
    <div className="xl:w-5/12  p-6 bg-white rounded-xl s ">
      <div className='border-[#F4F5F7] border-b flex'>
        <h2 className="text-lg font-medium text-orange-500  w-auto border-b-3 pb-2">Manage Your Label</h2>

      </div>
      <div className="mt-4 space-y-4">
        <label className='text-[#333B69] font-medium'>Label Setting</label>
        <div className="flex items-center space-x-3 mt-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={warehouseAddress}
              onChange={() => setWarehouseAddress(!warehouseAddress)}
            />
            <div
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${warehouseAddress ? "bg-[#16DBCC]" : "bg-gray-300"}`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${warehouseAddress ? "translate-x-5" : ""}`}
              ></div>
            </div>

          </label>
          <div>
            <span className="font-semibold text-[#2B3674]">Warehouse Address</span>
            <p className="text-gray-600 ">Show warehouse address on label</p>
          </div>
        </div>

        {/* Thermal Printer */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={thermalPrinter}
              onChange={() => setThermalPrinter(!thermalPrinter)}
            />
            <div
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${thermalPrinter ? "bg-[#16DBCC]" : "bg-gray-300"}`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${thermalPrinter ? "translate-x-5" : ""}`}
              ></div>
            </div>

          </label>
          <div>
            <span className="font-semibold text-[#2B3674]">Thermal Printer</span>
            <p className="text-gray-600 ">
              Print label according to the thermal printer otherwise will print in standard printer page (A4)
            </p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-20 flex justify-between">
        <button className="px-10 py-2 bg-gray-400 text-white rounded-lg w-auto">Cancel</button>
        <button className="px-10 py-2 bg-[#2B3674] text-white rounded-lg w-auto">Save</button>
      </div>
    </div>
  );
}
