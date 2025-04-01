'use client';

import dynamic from 'next/dynamic';

// Import the map component with no SSR
const Pune = dynamic(() => import('../components/Pune'), {
  ssr: false,
});

export default function Home() {
  return (
    <div className='w-full h-screen flex items-center justify-center'>
      <Pune />
    </div>
  );
}
