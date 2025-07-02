'use client';

import { useState } from 'react';

export default function Terms() {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="">
      <div className="bg-white rounded-lg w-full max-w-3xl p-6 shadow-lg max-h-[90vh] overflow-hidden">
        <h2 className="text-orange-600 font-bold text-2xl mb-4">Terms and Conditions</h2>

        <div className="text-lg font-semibold text-gray-900 mb-2">Your Agreement</div>

        <div className="text-gray-700 overflow-y-auto max-h-64 md:max-h-full pr-2 space-y-4">
          <p>Last Revised: January 1, 2025</p>
          <p>
            Welcome to our website. This is a dummy Terms and Conditions section for demonstration purposes.
            Please read these terms carefully.
          </p>
          <p><strong>1. Your Agreement</strong><br />
            By using this site, you agree to our terms. If you do not agree, please do not use the site.
          </p>
          <p><strong>2. Privacy</strong><br />
            Your privacy matters to us. Review our privacy policy for more information.
          </p>
          <p><strong>3. Linked Sites</strong><br />
            This site may link to third-party websites. We are not responsible for their content.
          </p>
          <p><strong>4. Forward Looking Statements</strong><br />
            All information is as of the date published. We do not guarantee future accuracy.
          </p>
        </div>

        <div className="flex items-start mt-4">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-2 mr-2"
          />
          <label htmlFor="agree" className="text-lg text-gray-800">
            I confirm that I have read and accept the terms and conditions and privacy policy.
          </label>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button className="text-sm text-gray-600 hover:underline">
            Cancel
          </button>
          <button
            disabled={!agreed}
            className={`text-sm px-4 py-2 rounded bg-orange-400 text-white font-semibold ${!agreed ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-500'
              }`}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
