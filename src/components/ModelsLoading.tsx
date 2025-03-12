import { FC } from "react";

const ModelsLoading: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="animate-pulse text-xl font-semibold text-blue-600">
        Loading FaceDetector models...
      </div>
    </div>
  );
};

export default ModelsLoading;
