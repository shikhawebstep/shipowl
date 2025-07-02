// pages/high-rto.js
"use client";
import Image from "next/image";
import rtoImage from "@/app/images/delivery-point.svg"; // Save your image as rto-illustration.png in /public
import pincode from "@/app/images/pin-code-map.webp"; // Save your image as rto-illustration.png in /public

export default function HighRto() {
  return (
    <div className="flex flex-col md:flex-row items-start justify-between gap-10 p-8 md:p-16 max-w-7xl mx-auto">
      {/* Left Content */}
      <div className="md:w-1/2 space-y-6">
        <h1 className="text-3xl font-bold">High RTO Pincode List</h1>
        <p className="text-gray-700 leading-relaxed">
          Based on lakhs of historical orders, our algorithms have identified that certain pincodes are prone to very high RTO%. It is best to avoid targeting customers from these areas as it might lead to a waste of customer acquisition costs.
        </p>

        <a
          href="/downloads/high-rto-pincode-list.csv"
          download
          className="inline-flex items-center bg-black text-white px-5 py-3 rounded-md hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 16l4-5h-3V4h-2v7H8l4 5zm-8 2h16v2H4v-2z" />
          </svg>
          High RTO Pincode List
        </a>

        <div className="text-gray-700 space-y-4">
          <p>These pincodes can be used as negative locations in Facebook’s Ad Manager</p>
          <ol className="list-decimal md:pl-5 pl-2 space-y-2">
            <li>Download the list of pincodes from the above link.</li>
            <li>
              Collate the pincodes in a comma-separated form
              <ol className="list-disc md:pl-5 pl-2 mt-1 space-y-1 text-sm">
                <li>You can do this in Excel itself using the <code className="bg-gray-100 px-1 rounded">textjoin</code> function.</li>
                <li>Or use free sites like delim.co and paste the pincodes from the downloaded file.</li>
                <li>Your output should look like this – <em>784514,784148,784529,784145</em>.</li>
              </ol>
            </li>
            <li>
              Open your Facebook Ad Manager and create your ads as you normally would
              <ol className="list-disc md:pl-5 pl-2 mt-1 space-y-1 text-sm">
                <li>In the location section, choose <strong>Exclude</strong> and click on <strong>Add locations in bulk</strong>.</li>
                <li>Choose the postal code option and paste the pincodes in a comma-separated form.</li>
              </ol>
            </li>
            <li>That’s it. Facebook will now avoid showing ads to users in these pincodes.</li>
          </ol>
        </div>

        {/* Sample Screenshot */}
        <Image
          src={pincode} // save this screenshot as rto-location-guide.png in /public
          alt="Facebook Location Guide"
          width={600}
          height={400}
          className="border rounded-lg shadow-sm mt-4"
        />
      </div>

      {/* Right Image */}
      <div className="md:w-1/2">
        <Image
          src={rtoImage}
          alt="Delivery Illustration"
          className="w-full h-auto"
        />
      </div>
    </div>
  );
}
