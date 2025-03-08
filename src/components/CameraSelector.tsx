import React, { FC } from "react";

interface CameraSelectorProps {
    currentDevice: string;
    setCurrentDevice: (deviceId: string) => void;
    devices: { deviceId: string; label: string }[];
  }

const CameraSelector: FC<CameraSelectorProps> = ({currentDevice, setCurrentDevice, devices}) => {
  return (
    <div className="mb-6 space-y-4">
      <label className="block text-sm font-medium text-gray-600">
        Camera Selection
      </label>
      <select
        value={currentDevice}
        onChange={(e) => setCurrentDevice(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CameraSelector;
