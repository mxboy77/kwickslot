import React, { useState } from 'react';
import { db } from '../utils/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function CreatePollForm() {
  const [eventName, setEventName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!eventName.trim()) return;

    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, 'polls'), {
        name: eventName,
        createdAt: Timestamp.now(),
      });

      // Redirect to poll page using ID
      window.location.href = `/poll/${docRef.id}`;
    } catch (error) {
      console.error("Error creating poll:", error);
      alert("Something went wrong. Try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-2">Create a New Poll</h2>
      <input
        type="text"
        placeholder="Event Name"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        className="border p-2 rounded w-full mb-2"
      />
      <button
        onClick={handleCreate}
        disabled={creating}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {creating ? "Creating..." : "Create"}
      </button>
    </div>
  );
}
