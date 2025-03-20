'use client';

import dynamic from 'next/dynamic';

// Import the map component with no SSR
const Jodhpur = dynamic(() => import('../components/Jodhpur'), {
  ssr: false,
});

export default function Home() {
  return (
    <div className='w-full h-screen flex items-center justify-center'>
      <Jodhpur />
    </div>
  );
}
