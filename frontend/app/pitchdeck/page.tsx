
'use client';
import React, { useState } from 'react';

const slides = [
  {
    title: 'Welcome to DopelgangaChain',
    content: 'A next-generation blockchain designed for speed, scalability, and community empowerment.'
  },
  {
    title: 'What is DopelgangaChain?',
    content: 'DopelgangaChain is a high-performance blockchain platform focused on user experience, low fees, and developer-friendly tools.'
  },
  {
    title: 'How DopelgangaChain Works',
    content: 'Utilizes a unique consensus mechanism and modular architecture to enable fast, secure, and scalable transactions.'
  },
  {
    title: 'Dopelganga vs Solana',
    content: `\n- Dopelganga: Modular, community-driven, low fees, easy onboarding.\n- Solana: High throughput, but higher complexity and less community focus.\n\nDopelganga aims to be more accessible and adaptable for new projects and users.`
  },
  {
    title: 'Why Choose Dopelganga?',
    content: '• Lower fees and faster onboarding\n• Open, community-driven governance\n• Developer-first approach\n• Designed to help projects and users grow together.'
  },
  {
    title: 'Join the Movement',
    content: 'Be part of the DopelgangaChain revolution. Build, launch, and grow with us!'
  }
];

export default function PitchDeckPage() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => Math.min(c + 1, slides.length - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dopel-900 to-dopel-700 text-white p-2 sm:p-4">
      <div className="w-full max-w-xl sm:max-w-xl max-w-full bg-black/70 rounded-xl shadow-lg p-4 sm:p-8 flex flex-col items-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-center">{slides[current].title}</h1>
        <p className="text-base sm:text-lg whitespace-pre-line text-center mb-6 sm:mb-8">{slides[current].content}</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto justify-center">
          <button onClick={prev} disabled={current === 0} className="px-4 py-2 rounded bg-dopel-500 disabled:bg-gray-700 w-full sm:w-auto">Previous</button>
          <button onClick={next} disabled={current === slides.length - 1} className="px-4 py-2 rounded bg-dopel-500 disabled:bg-gray-700 w-full sm:w-auto">Next</button>
        </div>
        <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-white/60">Slide {current + 1} of {slides.length}</div>
      </div>
    </div>
  );
}
