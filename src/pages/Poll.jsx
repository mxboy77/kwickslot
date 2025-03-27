import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function Poll() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [name, setName] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [existingNames, setExistingNames] = useState([]);
  const [editingMode, setEditingMode] = useState(false);
  const [copied, setCopied] = useState(false); // For clipboard management

  useEffect(() => {
    const fetchPoll = async () => {
      const ref = doc(db, 'polls', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setPoll(snap.data());
        const existingResponses = snap.data().responses || [];
        setExistingNames(existingResponses.map((r) => r.name));
      } else {
        setPoll({ error: 'Poll not found' });
      }
    };
    fetchPoll();
  }, [id]);

  const handleDateSelect = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDates((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleTimeToggle = (date, timeSlot) => {
    setSelectedTimes((prev) => {
      const current = new Set(prev[date] || []);
      current.has(timeSlot) ? current.delete(timeSlot) : current.add(timeSlot);
      return { ...prev, [date]: Array.from(current) };
    });
  };

  const handleSubmit = async () => {
    if (!name.trim() || selectedDates.length === 0) {
      alert('Enter your name and at least one date.');
      return;
    }
    setSubmitting(true);

    try {
      const ref = doc(db, 'polls', id);
      const snap = await getDoc(ref);
      const data = snap.data();
      const existing = data.responses || [];

      const updatedResponses = existing.filter((r) => r.name !== name.trim());
      updatedResponses.push({
        name: name.trim(),
        availability: selectedDates.map((date) => ({
          date,
          times: selectedTimes[date] || [],
        })),
      });

      await updateDoc(ref, { responses: updatedResponses });

      alert('Availability submitted!');
      setName('');
      setSelectedDates([]);
      setSelectedTimes({});
      setEditingMode(false); // Disable editing mode after submit
    } catch (err) {
      console.error('Error submitting:', err);
      alert('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeAvailability = () => {
    if (!editingName) {
      alert('Please select your name to edit availability.');
      return;
    }
    setEditingMode(true);
    const userResponse = poll.responses.find((r) => r.name === editingName);
    if (userResponse) {
      setName(userResponse.name); // Pre-fill the name field for editing
      setSelectedDates(userResponse.availability.map((a) => a.date));
      setSelectedTimes(
        userResponse.availability.reduce((acc, { date, times }) => {
          acc[date] = times;
          return acc;
        }, {})
      );
    }
  };

  // Copy poll link to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href); // Copy the current URL
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  if (!poll) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-4">{poll?.name}</h1>

      {/* Share Poll Button */}
      <button
        onClick={handleCopy}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        {copied ? 'Link Copied!' : 'Share Poll'}
      </button>

      {/* If we are editing, show the name input and allow editing */}
      {!editingMode && (
        <>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded mb-4 w-full max-w-xs"
          />

          <h2 className="text-lg font-semibold mb-2">Select Available Dates:</h2>
          <DatePicker
            inline
            selected={null}
            onChange={handleDateSelect}
            inlineFocus
          />

          {selectedDates.map((date) => (
            <div key={date} className="bg-white p-4 my-2 rounded shadow w-full max-w-md">
              <h3 className="font-semibold">{date}</h3>
              <div className="flex gap-2 flex-wrap mt-2">
                {['Morning', 'Afternoon', 'Evening'].map((slot) => (
                  <button
                    key={slot}
                    onClick={() => handleTimeToggle(date, slot)}
                    className={`px-3 py-1 border rounded ${
                      selectedTimes[date]?.includes(slot)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {submitting ? 'Submitting...' : 'Submit Availability'}
          </button>
        </>
      )}

      {/* When not in editing mode, show the "Change Availability" button */}
      {!editingMode && (
        <div className="mt-4 text-sm">
          <span className="text-gray-700">Want to update your availability?</span>
          <select
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="text-blue-600 ml-2 p-2 rounded"
          >
            <option value="">Select your name</option>
            {existingNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button
            onClick={handleChangeAvailability}
            className="text-blue-600 hover:text-blue-800 ml-2"
          >
            Change Availability
          </button>
        </div>
      )}

      {/* When editing, allow the user to update their availability */}
      {editingMode && (
        <>
          <h3 className="text-lg font-semibold mb-2">Change Your Availability:</h3>
          <DatePicker
            inline
            selected={null}
            onChange={handleDateSelect}
            inlineFocus
          />

          {selectedDates.map((date) => (
            <div key={date} className="bg-white p-4 my-2 rounded shadow w-full max-w-md">
              <h3 className="font-semibold">{date}</h3>
              <div className="flex gap-2 flex-wrap mt-2">
                {['Morning', 'Afternoon', 'Evening'].map((slot) => (
                  <button
                    key={slot}
                    onClick={() => handleTimeToggle(date, slot)}
                    className={`px-3 py-1 border rounded ${
                      selectedTimes[date]?.includes(slot)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {submitting ? 'Submitting...' : 'Submit Updated Availability'}
          </button>
        </>
      )}

      <a
        href={`/poll/${id}/results`}
        className="mt-4 underline text-blue-600 hover:text-blue-800 text-sm"
      >
        View Group Availability
      </a>
    </div>
  );
}
