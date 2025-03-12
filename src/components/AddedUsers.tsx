import { Video } from "lucide-react";
import { FC } from "react";

interface AddedUsersType {
  faces: { name: string; descriptor: Float32Array }[];
}

const AddedUsers: FC<AddedUsersType> = ({ faces }) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Registered Persons
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {faces.map((face, index) => (
          <div
            key={index}
            className="p-3 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {face.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddedUsers;
