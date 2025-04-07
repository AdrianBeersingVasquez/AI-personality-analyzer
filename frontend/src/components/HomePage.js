import React from "react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#0e0e10] via-black to-[#1a1a1d] flex flex-col items-center justify-center text-white px-4">
      {/* Glowing logo face */}
      <div className="mb-6 animate-pulse">
        <div className="rounded-full border-4 border-gradient-to-tr from-purple-500 via-yellow-400 to-orange-500 p-2">
          <div className="text-4xl">🙂</div>
        </div>
      </div>

      <h1 className="text-3xl font-semibold mb-2">Yooo, welcome back!</h1>
      <p className="text-sm text-gray-400 mb-10">
        First time here? <a className="underline cursor-pointer">Sign up for free</a>
      </p>

      <div className="flex gap-6 w-full max-w-lg">
        <button className="flex-1 backdrop-blur bg-white/5 rounded-xl border border-purple-500 text-white text-lg px-6 py-4 hover:bg-purple-700/20 transition shadow-md shadow-purple-500/20">
          Be nice 🍉
        </button>
        <button className="flex-1 backdrop-blur bg-white/5 rounded-xl border border-orange-500 text-white text-lg px-6 py-4 hover:bg-orange-600/20 transition shadow-md shadow-orange-500/20">
          Roast me 🍗
        </button>
      </div>
    </div>
  );
}
