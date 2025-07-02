import React from 'react';
import icon from '@/app/images/bank.png'
import Image from 'next/image'
export default function BankAccountList() {
    const accountDetails = [
        {
            id: 0,
            acc_name: "John Doe",
            acc_no: 8475012800700,
            bank_name: "IDBI Bank",
            bank_branch: "Koli",
            acc_type: "Savings",
            ifsc_code: 'IFSC2847800',

        },
    ]
    return (
        <>
            <h3 className='text-[#343C6A] font-semibold py-5 text-xl'>Bank List</h3>
            <div className="bg-white p-5 rounded-2xl ">
                <div className="overflow-x-auto">
                    <table className='min-w-full'>
                        <thead>
                            <tr className='text-[#232323] w-full'>

                                <th className="pb-1 px-4 whitespace-nowrap text-left text-white xl:block hidden">sd</th>
                                <th className="pb-1 px-4 whitespace-nowrap text-left">Account No.</th>
                                <th className="pb-1 px-4 whitespace-nowrap text-left">Account Name</th>
                                <th className="pb-1 px-4 whitespace-nowrap text-left">Bank Name</th>
                                <th className="pb-1 px-4 whitespace-nowrap text-left">Bank Branch</th>
                                <th className="pb-1 px-4 whitespace-nowrap text-left">Account Type</th>
                                <th className="pb-1 px-4 whitespace-nowrap text-left">IFSC Code</th>
                                <th className="pb-1 px-4 whitespace-nowrap text-left text-white xl:block hidden">gfdfd</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accountDetails.map((item, index) => {
                                return (
                                    <tr key={index} className='text-[#718EBF] w-full relative'>
                                        <td className="px-4 whitespace-nowrap text-left xl:block hidden ">
                                            <Image src={icon} alt="Account Icon" className='h-11 w-11 absolute -top-5 left-0' />
                                        </td>
                                        <td className="px-4 whitespace-nowrap text-left">{item.acc_no}</td>
                                        <td className="px-4 whitespace-nowrap text-left">{item.acc_name}</td>
                                        <td className="px-4 whitespace-nowrap text-left">{item.bank_name}</td>
                                        <td className="px-4 whitespace-nowrap text-left">{item.bank_branch}</td>
                                        <td className="px-4 whitespace-nowrap text-left">{item.acc_type}</td>
                                        <td className="px-4 whitespace-nowrap text-left">{item.ifsc_code}</td>
                                        <td className="px-4 whitespace-nowrap text-left xl:block hidden">  <button className='absolute -top-5 right-0 rounded-full p-2 text-sm  bg-[#718EBF] text-white'>
                                            View Check Image
                                        </button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                </div>
            </div>


        </>
    )
}
