import React from 'react';
import CreatePollForm from '../components/CreatePollForm';
import AvailabilityGrid from '../components/AvailabilityGrid';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6">Dinner Scheduler</h1>
      <CreatePollForm />
      <AvailabilityGrid />
    </div>
  );
}
