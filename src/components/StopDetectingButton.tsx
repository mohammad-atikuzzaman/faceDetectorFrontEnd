import { X } from 'lucide-react';
import { FC } from 'react';

interface StopDetectingButtonProps {
  stopDetection: () => void;
}

const StopDetectingButton: FC<StopDetectingButtonProps> = ({ stopDetection }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="font-medium text-blue-600">
          Detection in progress...
        </div>
        <button
          type="button"
          onClick={stopDetection}
          className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all flex items-center gap-2"
        >
          <X className="w-5 h-5" />
          Stop Detection
        </button>
      </div>
    </div>
  );
};

export default StopDetectingButton;
