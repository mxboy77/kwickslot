import React from 'react';

export default function AvailabilityGrid() {
  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h2 className="text-xl font-bold mb-2">Select Your Availability</h2>
      <div className="grid grid-cols-5 gap-2">
        {[...Array(25)].map((_, i) => (
          <div key={i} className="h-10 w-10 border rounded bg-gray-100 hover:bg-green-300 cursor-pointer" />
        ))}
      </div>
    </div>
  );
}
