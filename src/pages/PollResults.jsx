import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../utils/firebase';

export default function PollResults() {
  const { id } = useParams();
  const [responses, setResponses] = useState([]);
  const [summary, setSummary] = useState({});
  const [pollName, setPollName] = useState('');
  const [bestDates, setBestDates] = useState([]);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState([]);
  const [userName, setUserName] = useState('');
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    const fetchPollData = async () => {
      const ref = doc(db, 'polls', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setPollName(data.name);
        const all = data.responses || [];
        setResponses(all);
        setParticipantCount(all.length);

        const summaryMap = {};
        all.forEach((resp) => {
          (resp.availability || []).forEach(({ date, times }) => {
            if (!summaryMap[date]) {
              summaryMap[date] = { Morning: [], Afternoon: [], Evening: [] };
            }
            times.forEach((slot) => {
              summaryMap[date][slot].push(resp.name);
            });
          });
        });

        const sortedSummary = Object.entries(summaryMap).sort(
          ([a], [b]) => new Date(a) - new Date(b)
        );
        const sortedSummaryMap = Object.fromEntries(sortedSummary);
        setSummary(sortedSummaryMap);

        const perfectDates = Object.entries(sortedSummaryMap)
          .filter(([_, slots]) =>
            Object.values(slots).some((names) => names.length === all.length)
          )
          .map(([date]) => date);

        setBestDates(perfectDates);
      }
    };

    fetchPollData();
  }, [id]);

  useEffect(() => {
    const commentsRef = collection(db, 'polls', id, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const commentsData = querySnapshot.docs.map((doc) => doc.data());
      setComments(commentsData);
    });
    return () => unsubscribe();
  }, [id]);

  const handleCommentSubmit = async () => {
    if (message.trim() && userName.trim()) {
      try {
        await addDoc(collection(db, 'polls', id, 'comments'), {
          name: userName,
          message,
          timestamp: new Date(),
        });
        setMessage('');
      } catch (err) {
        console.error('Error submitting comment:', err);
      }
    } else {
      alert('Please enter both your name and a message.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getColorClass = (count) => {
    if (count === 0) return 'bg-red-50 text-red-700';
    if (count === participantCount) return 'bg-green-50 text-green-700';
    return 'bg-yellow-50 text-yellow-700';
  };

  const formatDateWithDay = (dateStr) => {
    const date = new Date(dateStr);
    return `${dateStr} ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6 flex flex-col items-center font-sans">
      {/* Floating Summary */}
      <div className="w-full max-w-4xl mb-8 bg-white p-6 rounded-2xl shadow border border-neutral-200 sticky top-0 z-10">
        <h1 className="text-3xl font-semibold mb-3 text-neutral-800">{pollName}</h1>
        <p className="text-neutral-600">Total Submissions: {participantCount}</p>
        <p className="text-neutral-600">
          Best Date: <span className="font-medium text-neutral-800">{bestDates.length > 0 ? bestDates.join(', ') : 'No perfect dates yet'}</span>
        </p>
        <button
          onClick={handleCopy}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {copied ? 'Link copied!' : 'Share this poll'}
        </button>
      </div>

      {/* Table View */}
      <div className="w-full max-w-6xl overflow-x-auto bg-white p-6 rounded-2xl shadow-md border border-neutral-200">
        <h2 className="text-2xl font-semibold mb-6 text-neutral-800">Availability</h2>
        <table className="w-full table-auto border-collapse text-sm text-neutral-800">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border p-3 text-left font-medium">Date</th>
              <th className="border p-3 text-left font-medium">Morning</th>
              <th className="border p-3 text-left font-medium">Afternoon</th>
              <th className="border p-3 text-left font-medium">Evening</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(summary).map(([date, slots]) => (
              <tr key={date} className="hover:bg-neutral-50">
                <td className="border p-3 font-semibold text-neutral-700">{formatDateWithDay(date)}</td>
                {['Morning', 'Afternoon', 'Evening'].map((slot) => (
                  <td
                    key={slot}
                    className={`border p-3 rounded ${getColorClass(
                      slots[slot]?.length || 0
                    )}`}
                  >
                    {slots[slot]?.length ? slots[slot].join(', ') : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comments Section */}
      <div className="mt-10 w-full max-w-3xl bg-white p-6 rounded-2xl shadow border border-neutral-200">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-800">Comments</h2>
        <div className="max-h-64 overflow-y-auto mb-4">
          {comments.map((comment, index) => (
            <div key={index} className="mb-3 border-b pb-2 border-neutral-200">
              <p className="font-medium text-neutral-700">{comment.name}</p>
              <p className="text-neutral-600">{comment.message}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="p-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a comment..."
            className="p-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCommentSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Submit Comment
          </button>
        </div>
      </div>
    </div>
  );
}
