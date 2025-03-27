import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';

export default function PollResults() {
  const { id } = useParams();
  const [responses, setResponses] = useState([]);
  const [summary, setSummary] = useState({});
  const [pollName, setPollName] = useState('');
  const [bestDates, setBestDates] = useState([]);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false); // For handling the "Link Copied" state
  const [comments, setComments] = useState([]);
  const [userName, setUserName] = useState(''); // For user name input in comments

  // Fetch poll results data from Firestore
  useEffect(() => {
    const fetchPollData = async () => {
      const ref = doc(db, 'polls', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setPollName(data.name);
        const all = data.responses || [];
        setResponses(all);

        const totalParticipants = all.length;
        const summaryMap = {};

        all.forEach((resp) => {
          (resp.availability || []).forEach(({ date, times }) => {
            if (!summaryMap[date]) summaryMap[date] = {};
            times.forEach((slot) => {
              if (!summaryMap[date][slot]) summaryMap[date][slot] = [];
              summaryMap[date][slot].push(resp.name);
            });
          });
        });

        // Sort the summaryMap by date
        const sortedSummary = Object.entries(summaryMap).sort(([dateA], [dateB]) => {
          return new Date(dateA) - new Date(dateB); // Sorting dates in ascending order
        });

        const sortedSummaryMap = Object.fromEntries(sortedSummary);
        setSummary(sortedSummaryMap);

        // Find days where everyone has availability for at least one slot
        const perfectDates = Object.entries(sortedSummaryMap).filter(([date, slots]) => {
          return Object.values(slots).some(names => names.length === totalParticipants);
        }).map(([date]) => date);

        setBestDates(perfectDates);
      }
    };
    fetchPollData();
  }, [id]);

  // Fetch comments from Firestore
  useEffect(() => {
    const commentsRef = collection(db, 'polls', id, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const commentsData = querySnapshot.docs.map((doc) => doc.data());
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [id]);

  // Submit a new comment
  const handleCommentSubmit = async () => {
    if (message.trim() !== '' && userName.trim() !== '') {
      try {
        await addDoc(collection(db, 'polls', id, 'comments'), {
          name: userName,
          message,
          timestamp: new Date(),
        });
        setMessage(''); // Clear input after sending
      } catch (err) {
        console.error('Error submitting comment:', err);
      }
    } else {
      alert("Please enter both your name and a message.");
    }
  };

  // Copy poll link to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href); // Copy the current URL
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-2">Availability Summary</h1>
      <h2 className="text-xl text-gray-700 mb-6">{pollName}</h2>

      {/* Poll Results */}
      <div className="mt-8 w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Poll Results</h2>
        {Object.keys(summary).length === 0 ? (
          <p>No availability submitted yet.</p>
        ) : (
          Object.entries(summary).map(([date, slots]) => {
            const total = responses.length;
            const anyPerfectSlot = Object.values(slots).some(
              (names) => names.length === total
            );

            return (
              <div
                key={date}
                className={`p-4 mb-4 rounded shadow w-full max-w-xl ${
                  anyPerfectSlot
                    ? 'bg-green-100 border border-green-500'
                    : 'bg-red-100 border border-red-500'
                }`}
              >
                <h3 className="font-semibold text-lg mb-2">{date}</h3>
                <div className="grid grid-cols-3 gap-4">
                  {['Morning', 'Afternoon', 'Evening'].map((slot) => (
                    <div
                      key={slot}
                      className={`p-2 rounded border ${
                        slots[slot]?.length
                          ? 'bg-white border-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-400'
                      }`}
                    >
                      <strong>{slot}</strong>
                      <p className="text-sm">
                        {slots[slot]?.length
                          ? slots[slot].join(', ')
                          : 'No one available'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {bestDates.length > 0 && (
          <div className="mt-6 w-full max-w-xl bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2 text-green-700">
              ✅ Best Dates (Everyone is available):
            </h2>
            <ul className="list-disc list-inside text-gray-700">
              {bestDates.map((date) => (
                <li key={date}>{date}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="mt-8 w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>

        {/* Display Comments */}
        <div className="max-h-64 overflow-y-auto mb-4">
          {comments.map((comment, index) => (
            <div key={index} className="mb-2">
              <p className="font-semibold">{comment.name}</p>
              <p>{comment.message}</p>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="p-2 border rounded"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a comment..."
            className="p-2 border rounded"
          />
          <button
            onClick={handleCommentSubmit}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit Comment
          </button>
        </div>
      </div>
    </div>
  );
}
