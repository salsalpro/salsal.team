"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaPhoneAlt } from "react-icons/fa";

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
  const [isFixed, setIsFixed] = useState<boolean>(false);

  const handleScroll = () => {
    if (window.scrollY > 20) {
      setIsFixed(true);
      console.log("12");
    } else {
      setIsFixed(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className="parent w-full py-6">
      <div className={`theNavBox shadowbx border px-3 py-2 mx-6 rounded-2xl ${isFixed ? 'retr' : 'etgt'}`}>
        <div className="m-auto desktop-header-none-scroling grid grid-cols-4 px-3 my-5 rounded-2xl">
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

      <div className="w-7xl mx-auto desktop-header grid grid-cols-4 px-3 bg-white "></div>

      <div className="mobile-header-none-scrolling grid grid-cols-4 px-3 mx-3 bg-white "></div>

      <div className="mobile-header grid grid-cols-4 px-3 mx-3 bg-white "></div>

      <div className="desktop-header grid grid-cols-4 px-3 mx-3 bg-white "></div>

      <div className="desktop-header grid grid-cols-4 px-3 mx-3 bg-white "></div>
    </header>
  );
}
