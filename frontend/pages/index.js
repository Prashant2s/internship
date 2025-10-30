import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../src/context/AuthContext';

import dynamic from 'next/dynamic';

const LandingHero = dynamic(() => import('../src/components/LandingHero'), { ssr: false });

export default function Home() {
  return <LandingHero />;
}
