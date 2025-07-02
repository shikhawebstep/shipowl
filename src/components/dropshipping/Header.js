'use client';
import { Bell } from 'lucide-react';
import { HiBars3CenterLeft } from "react-icons/hi2";
import React ,{useState,useEffect} from 'react';
import user from '@/app/assets/user.png';
import Image from 'next/image';
import { IoIosArrowDown } from "react-icons/io";
import { FaSignOutAlt } from 'react-icons/fa';
import { useDropshipper } from './middleware/DropshipperMiddleWareContext';
import Swal from 'sweetalert2';
const Header = () => {
  const {verifyDropShipperAuth} = useDropshipper();
    const [userName, setUserName] = useState('');
    const [activePanel, setActivePanel] = useState('');
  
    useEffect(() => {
      const data = JSON.parse(localStorage.getItem("shippingData"));
      if (data) {
        setUserName(data?.admin?.name || 'User');
        setActivePanel(data?.project?.active_panel || 'Panel');
      }
    }, []);
    const logout = () => {
      Swal.fire({
        title: "Are you sure?",
        text: "You will be logged out of your dropshipper account.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, log me out",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem("shippingData");
          verifyDropShipperAuth();
          Swal.fire({
            icon: "success",
            title: "Logged out",
            text: "You have been logged out successfully.",
            timer: 1500,
            showConfirmButton: true,
          });
        }
      });
    };
    
  return (
    <nav className="fixed z-50 rounded-xl lg:relative lg:mt-3 top-0 left-0 w-full bg-white   p-4 flex items-center justify-between lg:shadow-none">
      <button className="p-2 bg-black text-white rounded-full ">
        <HiBars3CenterLeft className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-4">
        <button className="p-2 bg-gray-200 rounded-full">
          <Bell className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-gray-500">{activePanel}</p>
          </div>
          <div className="flex gap-2 items-center">
            <Image src={user} alt="User" className="w-8 h-8 rounded-full" />
            <IoIosArrowDown className="text-gray-600" />
            <button
              onClick={logout}
              className="bg-orange-500 p-1 rounded-full h-10 w-10 flex items-center justify-center"
            >
              <FaSignOutAlt className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
