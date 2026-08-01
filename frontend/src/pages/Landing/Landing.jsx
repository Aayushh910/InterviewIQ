import React from 'react';
import { Hero } from '../../components/landing/Hero';
import { InteractiveDemo } from '../../components/landing/InteractiveDemo';
import { Features } from '../../components/landing/Features';
import { Timeline } from '../../components/landing/Timeline';
import { InterviewTypes } from '../../components/landing/InterviewTypes';
import { AnalyticsPreview } from '../../components/landing/AnalyticsPreview';
import { Testimonials } from '../../components/landing/Testimonials';

export const Landing = () => {
  return (
    <div className="flex flex-col gap-8">
      <Hero />
      <InteractiveDemo />
      <Features />
      <Timeline />
      <InterviewTypes />
      <AnalyticsPreview />
      <Testimonials />
    </div>
  );
};
