import { React, useState } from 'react'

function CustomReport() {

    const [selectedOptions, setSelectedOptions] = useState([]);

    const toggleOption = (option) => {
        setSelectedOptions((prev) =>
            prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
        );
    };

    const sections = [
        {
            title: 'Orders',
            options: ['#Number', 'Order Date', 'Amount', 'Payment Type', 'First Name', 'Last Name', 'Address 1', 'Address 2', 'Phone', 'City', 'State', 'Pincode', 'Weight', 'Lenght', 'Height', 'Breadth', 'Order Status', 'Shipping Charjes', 'Discount Applied', 'Product Deatils', 'Order Tags', 'Total Order Qty', 'Order COD Charjes',],
        },
        {
            title: 'Shipment',
            options: ['Shipment Date', 'AWB Number', 'Shipment Status', 'Remittance ID', 'Pickup Time', 'Delivered Time', 'RTO Delivered Time', 'Charjed Date', 'Zone', 'Last Status Updated', 'Courier Name', 'Freight Charges', 'COD Charges'],
        },
        {
            title: 'Warehouse',
            options: ['Warehouse Name', 'Contact Name', 'Contact Number', 'Address 1', 'Address 2', 'City', 'State', 'Pincode'],
        },
    ];
    return (
        <>

            {sections.map((section) => (
                <div key={section.title} className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">{section.title} <input type="checkbox" className='ms-2' name="" id="" /> <span className='text-[14px] text-gray-400 font-normal'>Select All</span></h3>
                    <div className="grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 products-grid gap-2 border-b pt-1 pb-5 border-[#E0E2E7]">
                        {section.options.map((option) => (
                            <label key={option} className="flex items-center space-x-2 ">
                                <input type="checkbox" checked={selectedOptions.includes(option)}
                                    onChange={() => toggleOption(option)} />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </>
    )
}

export default CustomReport