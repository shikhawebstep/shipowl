// components/dropshipper/Boosters.tsx

import { Sparkles, TrendingUp, ShoppingCart, Bot, PackageSearch, Calculator, LayoutDashboard, Megaphone, BadgeCheck, ShieldCheck } from 'lucide-react';

const boosters = [
  {
    title: "Winning Products Finder",
    description: "Discover trending products with high potential from multiple platforms.",
    icon: <TrendingUp className="text-indigo-500 w-6 h-6" />,
  },
  {
    title: "Bulk Import Tool",
    description: "Upload a CSV or paste URLs to import products in bulk effortlessly.",
    icon: <ShoppingCart className="text-green-500 w-6 h-6" />,
  },
  {
    title: "AI Description Generator",
    description: "Generate SEO-optimized product titles and descriptions with AI.",
    icon: <Bot className="text-purple-500 w-6 h-6" />,
  },
  {
    title: "Profit Margin Calculator",
    description: "Set smarter prices by understanding your real profit per sale.",
    icon: <Calculator className="text-yellow-500 w-6 h-6" />,
  },
  {
    title: "Upsell Builder",
    description: "Attach 1-click upsells and bundles to boost your average order value.",
    icon: <Sparkles className="text-pink-500 w-6 h-6" />,
  },
  {
    title: "Auto Fulfillment",
    description: "Automatically place and track orders with connected suppliers.",
    icon: <PackageSearch className="text-blue-500 w-6 h-6" />,
  },
  {
    title: "Analytics Dashboard",
    description: "Visualize sales, product performance, and platform breakdowns.",
    icon: <LayoutDashboard className="text-orange-500 w-6 h-6" />,
  },
  {
    title: "Marketing Integration",
    description: "Connect with email & SMS tools to launch campaigns and recover carts.",
    icon: <Megaphone className="text-rose-500 w-6 h-6" />,
  },
  {
    title: "Supplier Scorecard",
    description: "Rate and compare suppliers on performance and reliability.",
    icon: <ShieldCheck className="text-emerald-500 w-6 h-6" />,
  },
  {
    title: "Branding Kit",
    description: "Auto-generate branded mockups, logos, and packaging materials.",
    icon: <BadgeCheck className="text-cyan-500 w-6 h-6" />,
  },
];

export default function Booster() {
  return (
    <section className="p-6 bg-white rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Boosters</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {boosters.map((booster, index) => (
          <div
            key={index}
            className="border rounded-xl p-5 bg-gray-50 hover:shadow-md transition"
          >
            <div className="flex items-start gap-4">
              <div>{booster.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {booster.title}
                </h3>
                <p className="text-sm text-gray-600">{booster.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
