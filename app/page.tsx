import Image from "next/image";
import Header from "./components/modules/Header/Header";
import MainShow from "./components/theme/Home/MainShow";
import AppTest from "./components/theme/Home/test";

export default function Home() {
  return (
    <div className="parent">
      <Header />
      <MainShow />
      {/* <AppTest /> */}
    </div>
  );
}
