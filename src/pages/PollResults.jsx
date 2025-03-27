import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

export default function PollResults() {
  const { id } = useParams();
  const [responses, setResponses] = useState([]);
  const [summary, setSummary] = useState({});
  const [pollName, setPollName] = useState('');
  const [bestDates, setBestDates] = useState([]);

  useEffect(() => {
    const fetchResponses = async () => {
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

        setSummary(summaryMap);

        // Find days where everyone has availability for at least one slot
        const perfectDates = Object.entries(summaryMap).filter(([date, slots]) => {
          return Object.values(slots).some(names => names.length === totalParticipants);
        }).map(([date]) => date);

        setBestDates(perfectDates);
      }
    };
    fetchResponses();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-2">Availability Summary</h1>
      <h2 className="text-xl text-gray-700 mb-6">{pollName}</h2>

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
  );
}
