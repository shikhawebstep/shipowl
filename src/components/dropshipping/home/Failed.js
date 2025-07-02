
import { XCircle } from 'lucide-react';

export default function Failed() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-4">
            <XCircle className="w-20 h-20 text-red-500 mb-6" />
            <h1 className="text-xl font-semibold text-red-600">Failed to Connect Store</h1>
            <p className="text-gray-500 mt-2">Something went wrong. Please try again or contact support.</p>
        </div>
    );
}
