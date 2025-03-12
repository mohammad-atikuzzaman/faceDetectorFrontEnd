import { FC } from "react";

const LoadingSpinner: FC = () => {
  return (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default LoadingSpinner;
