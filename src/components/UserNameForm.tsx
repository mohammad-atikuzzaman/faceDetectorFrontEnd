import { Plus } from "lucide-react";
import { FC } from "react";

interface UserNameFormProps {
  currentName: string;
  setCurrentName: (name: string) => void;
  captureAndAddFace: () => void;
  isWebcamReady: boolean;
}

const UserNameForm: FC<UserNameFormProps> = ({ currentName, setCurrentName, captureAndAddFace, isWebcamReady }) => {
  return (
    <div className="flex gap-3">
      <input
        type="text"
        value={currentName}
        onChange={(e) => setCurrentName(e.target.value)}
        placeholder="Enter person's name"
        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        onKeyDown={(e) => e.key === "Enter" && captureAndAddFace()}
      />
      <button
        onClick={captureAndAddFace}
        disabled={!currentName || !isWebcamReady}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Face
      </button>
    </div>
  );
};

export default UserNameForm;
