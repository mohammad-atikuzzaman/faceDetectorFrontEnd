import { Camera } from "lucide-react";
import { FC } from "react";

const Header: FC = () => {
  return (
    <header className="flex items-center justify-between">
      <div>
        <section className="flex items-center gap-3 mb-8">
          <Camera className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FaceGuard
          </h1>
        </section>
      </div>
      <h4 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Developed By :{" "}
        <a href="https:atikuzzaman.vercel.app/">Mohammad Akash</a>
      </h4>
    </header>
  );
};

export default Header;
