"use client";
import Link from "next/link";
import { useState } from "react";
import { FaPhoneAlt } from "react-icons/fa";
import { RxHamburgerMenu } from "react-icons/rx";

interface NavItems {
  id: number;
  label: string;
  href: string;
}

const MenuItems: NavItems[] = [
  { id: 1, label: "خدمات", href: "/services" },
  { id: 2, label: "نمونه کار ها", href: "/about" },
  { id: 3, label: "درباره ما", href: "/about" },
  { id: 4, label: "ارتباط با ما", href: "/services" },
  { id: 5, label: "بلاگ", href: "/services" },
];

export default function Header() {
  const [IsShowMenu, setIsShowMenu] = useState<boolean>(false);

  return (
    <header className=" w-full py-6">
      <div className="desktop-header hidden lg:block ">
        <div className="h-22.5 block"></div>
        <div
          className={`theNavBox shadowbx border px-3 py-2 mx-6 rounded-2xl fixed top-6 right-0 left-0`}
        >
          <div className="m-auto grid grid-cols-4 px-3 my-5">
            <div className="col-span-1  items-center">
              <div className="phone-number w-full h-full flex justify-center gap-3 items-center">
                <div className="svg text-color">
                  <FaPhoneAlt size={14} />
                </div>
                <div className="number text-color">09379424323</div>
              </div>
            </div>
            <div className="col-span-2">
              <ul className="w-full h-full flex justify-around items-center">
                {MenuItems.map((e) => (
                  <Link href={e.href} key={e.id}>
                    <li className="links_ text-gray-500 text-xl">{e.label}</li>
                  </Link>
                ))}
              </ul>
            </div>
            <div className="col-span-1 ">
              <div className="logo w-full h-full flex justify-center items-center">
                <span className="text-black font-bold text-2xl">salsal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-header block lg:hidden">
        <div className="h-22.5 block"></div>
        <div className="theNavBox shadowbx border px-3 mx-6 rounded-xl fixed top-6 right-0 left-0">
          <div className="m-auto grid grid-cols-4 px-3 my-5 ">
            <div className="col-span-1">
              <div className="phone-number w-full h-full flex justify-start gap-3 items-center">
                <div className="svg text-color">
                  <FaPhoneAlt size={14} />
                </div>
                <div className="number text-color">09379424323</div>
              </div>
            </div>
            <div className="col-span-2">
              <div className="logo w-full h-full flex justify-center items-center ">
                <span className="text-black font-bold text-2xl">salsal</span>
              </div>
            </div>
            <div className="col-span-1">
              <div className="icon w-full h-full flex justify-end items-center">
                <RxHamburgerMenu
                  size={24}
                  className="text-black cursor-pointer"
                  onClick={(e) => {
                    setIsShowMenu(true);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* {IsShowMenu && <div className="text-black">IsShowMenu</div>} */}

      <div className="mobile-header-none-scrolling grid grid-cols-4 px-3 mx-3 bg-white "></div>

      <div className="mobile-header grid grid-cols-4 px-3 mx-3 bg-white "></div>

      <div className="desktop-header grid grid-cols-4 px-3 mx-3 bg-white "></div>

      <div className="desktop-header grid grid-cols-4 px-3 mx-3 bg-white "></div>
    </header>
  );
}
