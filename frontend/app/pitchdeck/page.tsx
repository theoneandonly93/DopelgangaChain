

'use client';
import React, { useState } from 'react';
import Image from 'next/image';

const slides = [
  {
    title: 'Welcome to DopelgangaChain',
    content: 'A next-generation blockchain designed for speed, scalability, and community empowerment.',
    image: '/pitchdeck/slide1.jpg',
  },
  {
    title: 'What is DopelgangaChain?',
    content: 'DopelgangaChain is a high-performance blockchain platform focused on user experience, low fees, and developer-friendly tools.',
    image: '/pitchdeck/slide2.jpg',
  },
  {
    title: 'How DopelgangaChain Works',
    content: 'Utilizes a unique consensus mechanism and modular architecture to enable fast, secure, and scalable transactions.',
    image: '/pitchdeck/slide3.jpg',
  },
  {
    title: 'Dopelganga vs Solana',
    content: '- Dopelganga: Modular, community-driven, low fees, easy onboarding.\n- Solana: High throughput, but higher complexity and less community focus.\n\nDopelganga aims to be more accessible and adaptable for new projects and users.',
    image: '/pitchdeck/slide4.jpg',
  },
  {
    title: 'Why Choose Dopelganga?',
    content: '• Lower fees and faster onboarding\n• Open, community-driven governance\n• Developer-first approach\n• Designed to help projects and users grow together.',
    image: '/pitchdeck/slide5.jpg',
  },
  {
    title: 'Join the Movement',
    content: 'Be part of the DopelgangaChain revolution. Build, launch, and grow with us!',
    image: '/pitchdeck/slide6.jpg',
  },
];

export default function PitchDeckPage() {
  const [current, setCurrent] = useState(0);
  const next = () => setCurrent((c) => Math.min(c + 1, slides.length - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dopel-900 to-dopel-700 text-white p-0 sm:p-4">
      <div className="w-full max-w-2xl aspect-[4/3] sm:aspect-video relative rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center justify-center bg-black/80 mx-auto my-4 sm:my-8">
        {/* Slide image background */}
        <Image
          src={slides[current].image}
          alt={slides[current].title}
          fill
          className="object-cover object-center z-0 opacity-80"
          priority
          sizes="(max-width: 640px) 100vw, 640px"
        />
        {/* Overlay for text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
        <div className="relative z-20 flex flex-col items-center justify-center h-full w-full px-2 xs:px-4 sm:px-12 py-4 sm:py-8">
          <h1 className="text-lg xs:text-xl sm:text-4xl font-extrabold mb-2 sm:mb-4 text-center drop-shadow-lg break-words max-w-full">
            {slides[current].title}
          </h1>
          <p className="text-xs xs:text-sm sm:text-xl whitespace-pre-line text-center mb-4 sm:mb-8 drop-shadow-lg bg-black/40 rounded-lg px-2 xs:px-4 py-2 inline-block max-w-full break-words">
            {slides[current].content}
          </p>
        </div>
        {/* Navigation and progress */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-2 z-30 pb-2 sm:pb-4">
          <div className="flex gap-2">
            <button onClick={prev} disabled={current === 0} className="px-3 py-1.5 sm:px-4 sm:py-2 rounded bg-dopel-500/90 hover:bg-dopel-400 disabled:bg-gray-700 text-white font-bold shadow-lg transition-all text-xs sm:text-base">Previous</button>
            <button onClick={next} disabled={current === slides.length - 1} className="px-3 py-1.5 sm:px-4 sm:py-2 rounded bg-dopel-500/90 hover:bg-dopel-400 disabled:bg-gray-700 text-white font-bold shadow-lg transition-all text-xs sm:text-base">Next</button>
          </div>
          <div className="flex gap-1 mt-2">
            {slides.map((_, i) => (
              <span key={i} className={`h-1.5 w-4 sm:h-2 sm:w-6 rounded-full transition-all duration-200 ${i === current ? 'bg-dopel-500' : 'bg-white/30'}`}></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
