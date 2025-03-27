import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import AvailabilityGrid from '../components/AvailabilityGrid';

export default function Poll() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [copied, setCopied] = useState(false);

  const fullLink = `${window.location.origin}/poll/${id}`;

  useEffect(() => {
    const fetchPoll = async () => {
      const ref = doc(db, 'polls', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setPoll(snap.data());
      } else {
        setPoll({ error: 'Poll not found' });
      }
    };
    fetchPoll();
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!poll) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      {poll.error ? (
        <h1 className="text-xl text-red-500">{poll.error}</h1>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-2">{poll.name}</h1>
          <p className="text-gray-600 mb-2">Poll ID: {id}</p>

          {/* Copy Link Feature */}
          <div className="flex items-center gap-2 mb-6">
            <input
              value={fullLink}
              readOnly
              className="border rounded px-2 py-1 w-full max-w-xs text-sm"
            />
            <button
              onClick={handleCopy}
              className="bg-gray-800 text-white px-2 py-1 rounded text-sm"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <AvailabilityGrid pollId={id} />
        </>
      )}
    </div>
  );
}
