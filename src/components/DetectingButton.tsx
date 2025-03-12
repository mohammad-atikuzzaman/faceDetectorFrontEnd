import { Scan } from "lucide-react";
import { FC } from "react";

interface DetectingButtonProps {
  faces: { name: string; descriptor: Float32Array }[];
  startDetection: () => void;
}

const DetectingButton: FC<DetectingButtonProps> = ({
  faces,
  startDetection,
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="text-sm text-gray-500">
        {faces.length} registered {faces.length === 1 ? "face" : "faces"}
      </div>
      <button
        onClick={startDetection}
        disabled={faces.length === 0}
        className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        <Scan className="w-5 h-5" />
        Start Detection
      </button>
    </div>
  );
};

export default DetectingButton;
