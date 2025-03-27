import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../utils/firebase';

export default function AvailabilityGrid({ pollId }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, 'polls', pollId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setResponses(data.responses || []);
      }
    };
    fetchData();
  }, [pollId]);

  const handleToggle = (index) => {
    const newSelected = new Set(selected);
    newSelected.has(index) ? newSelected.delete(index) : newSelected.add(index);
    setSelected(newSelected);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    setSubmitting(true);
    try {
      const ref = doc(db, 'polls', pollId);
      await updateDoc(ref, {
        responses: arrayUnion({
          name,
          availability: Array.from(selected),
        }),
      });
      alert('Availability submitted!');
      setSelected(new Set());
      setName('');
      const snap = await getDoc(ref);
      setResponses(snap.data().responses || []);
    } catch (err) {
      console.error('Error submitting availability:', err);
      alert('Error submitting. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Map of block index to names
  const blockMap = Array(25).fill(null).map(() => []);
  responses.forEach((resp) => {
    (resp.availability || []).forEach((i) => {
      blockMap[i].push(resp.name);
    });
  });

  return (
    <div className="p-4 bg-white rounded shadow mt-4 w-full max-w-md">
      <h2 className="text-xl font-bold mb-2">Select Your Availability</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your Name"
        className="border p-2 rounded w-full mb-3"
      />
      <div className="grid grid-cols-5 gap-2 mb-4">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            onClick={() => handleToggle(i)}
            className={`h-10 w-10 rounded cursor-pointer flex items-center justify-center border text-xs text-center
              ${
                selected.has(i)
                  ? 'bg-green-500 text-white'
                  : blockMap[i].length > 0
                  ? 'bg-blue-200 text-black'
                  : 'bg-gray-100'
              }`}
            title={blockMap[i].join(', ') || 'No one available'}
          >
            {blockMap[i].length}
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
      >
        {submitting ? 'Submitting...' : 'Submit Availability'}
      </button>
    </div>
  );
}
