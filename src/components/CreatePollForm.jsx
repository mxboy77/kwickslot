import React from 'react';

export default function CreatePollForm() {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-2">Create a New Poll</h2>
      <input type="text" placeholder="Event Name" className="border p-2 rounded w-full mb-2" />
      <button className="bg-blue-500 text-white px-4 py-2 rounded">Create</button>
    </div>
  );
}
