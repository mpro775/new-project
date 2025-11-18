import React from 'react';
import { Box } from '@mui/material';
import {
  LandingHeader,
  LandingFooter,
  Hero,
  Features,
  Benefits,
  HowItWorks,
  Pricing,
  Testimonials,
  Demo,
  FAQ,
  CTA,
} from '@/components/landing';

export const Landing: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingHeader />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Hero />
        <Features />
        <Benefits />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <Demo />
        <FAQ />
        <CTA />
      </Box>
      <LandingFooter />
    </Box>
  );
};

export default Landing;

