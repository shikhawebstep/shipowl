// pages/dropshipper/integrations.tsx

import { FaShopify, FaAmazon, FaWordpress } from 'react-icons/fa';

const integrations = [
  {
    id: 1,
    name: 'Shopify',
    description: 'Connect your Shopify store for seamless product sync.',
    icon: <FaShopify className="text-4xl text-green-500" />,
  },
  {
    id: 2,
    name: 'WooCommerce',
    description: 'Integrate with WooCommerce to automate your orders.',
    icon: <FaWordpress className="text-4xl text-blue-500" />,
  },
  {
    id: 3,
    name: 'Amazon',
    description: 'Link your Amazon Seller account to manage inventory.',
    icon: <FaAmazon className="text-4xl text-yellow-500" />,
  },
];

export default function Integrations() {
  return (
    <div className=" p-6 bg-white rounded-xl max-w-7xl">
      <div className="">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Integrations</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition duration-200 border"
            >
              <div className="flex flex-col space-y-4">
                <div>{integration.icon}</div>
                <h2 className="text-xl font-semibold text-gray-800">{integration.name}</h2>
                <p className="text-sm text-gray-600">{integration.description}</p>
                <button className="mt-auto px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition">
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
