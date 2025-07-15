import axios from 'axios';

export async function getPincodeDetails(pincode: string) {
    try {
        // ✅ Validate the format (6-digit Indian PIN code)
        if (!/^\d{6}$/.test(pincode)) {
            throw new Error("Invalid PIN code format. A valid PIN code must contain exactly 6 digits.");
        }

        // 📡 Call the India Post public API
        const response = await axios.get(`http://www.postalpincode.in/api/pincode/${pincode}`);
        const { Status, PostOffice: postOffices, Message: message } = response.data;

        if (Status !== "Success" || !postOffices || postOffices.length === 0) {
            console.warn(`Pincode lookup failed: ${message || "No data found."}`);
            return {
                status: false,
                message: message || "No data found for this PIN code.",
                length: 0,
                postOffices: [],
            };
        }

        return {
            status: true,
            message: "Pincode data fetched successfully.",
            length: postOffices.length,
            postOffices,
        };

    } catch (error) {
        console.error("❌ Error in pincodeInfo:", error);
        return {
            status: false,
            message: error
        }
    }
}
