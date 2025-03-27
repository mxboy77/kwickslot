import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../utils/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function Home() {
  const [eventName, setEventName] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!eventName.trim()) return;
    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, 'polls'), {
        name: eventName,
        createdAt: Timestamp.now(),
        responses: []
      });
      navigate(`/poll/${docRef.id}`);
    } catch (err) {
      console.error('Error creating poll:', err);
      alert('Error creating poll');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4">Kwickslot Scheduler</h1>
      <p className="text-gray-700 text-center max-w-md mb-6">
        Enter a name for your event or gathering below. After creating the schedule poll,
        you’ll be able to invite others to mark their availability.
      </p>
      <input
        type="text"
        placeholder="e.g. Team Dinner, Family Trip"
        className="border p-2 rounded w-full max-w-sm mb-4"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
      />
      <button
        onClick={handleCreate}
        disabled={creating}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
      >
        {creating ? 'Creating...' : 'Create a New Schedule Poll'}
      </button>
    </div>
  );
}
