import { MailIcon, InfoIcon } from "lucide-react";

export default function SupportBar() {
  return (
    <div className="w-full bg-[#f7f8fa] border-t border-gray-200 py-6 px-2 text-gray-700 text-sm" style={{marginTop: 0}}>
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between">
        {/* Hide left text on mobile, show only on md+ */}
        <div className="hidden md:block w-full md:w-auto">
          <div className="font-semibold text-lg text-gray-800 mb-1">We're Always Here To Help</div>
          <div className="text-gray-500 text-sm">Reach out to us through any of these support channels</div>
        </div>
        <div className="flex items-center gap-10 w-full md:w-auto justify-center md:justify-end">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg">
            <InfoIcon size={24} className="text-gray-400" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase font-medium tracking-wide">Help Center</span>
              <a href="https://help.nilaas.in" className="font-bold text-base text-gray-800 hover:underline leading-tight" target="_blank" rel="noopener noreferrer">help.nilaas.in</a>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg">
            <MailIcon size={24} className="text-gray-400" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase font-medium tracking-wide">Email Support</span>
              <a href="mailto:care@nilaas.in" className="font-bold text-base text-gray-800 hover:underline leading-tight">care@nilaas.in</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
