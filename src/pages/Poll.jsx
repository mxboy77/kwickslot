import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../datepicker-custom.css';




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
  const [copied, setCopied] = useState(false);

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
      setEditingMode(false);
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
      setName(userResponse.name);
      setSelectedDates(userResponse.availability.map((a) => a.date));
      setSelectedTimes(
        userResponse.availability.reduce((acc, { date, times }) => {
          acc[date] = times;
          return acc;
        }, {})
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderDatePicker = () => (
    <DatePicker
      inline
      selected={null}
      onChange={handleDateSelect}
      highlightDates={[
        {
          'react-datepicker__day--highlighted-green': selectedDates.map((d) => new Date(d))
        }
      ]}
      dayClassName={(date) => {
        const dateStr = date.toISOString().split('T')[0];
        return selectedDates.includes(dateStr)
          ? 'react-datepicker__day--highlighted-green'
          : undefined;
      }}
      renderDayContents={(day, date) => {
        const dateStr = date.toISOString().split('T')[0];
        const tooltip = selectedDates.includes(dateStr) ? 'You selected this day' : '';
        return <div title={tooltip}>{day}</div>;
      }}
    />
  );

  if (!poll) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-50 p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow border border-neutral-200">
        <h1 className="text-3xl font-semibold text-neutral-800 mb-2">{poll?.name}</h1>

        <button
          onClick={handleCopy}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          {copied ? 'Link Copied!' : 'Share Poll'}
        </button>

        {!editingMode && (
          <>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-neutral-300 p-2 rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <h2 className="text-lg font-medium mb-2 text-neutral-700">Select Available Dates:</h2>
            {renderDatePicker()}

            {selectedDates.map((date) => (
              <div key={date} className="bg-neutral-100 p-4 my-3 rounded-lg shadow-sm">
                <h3 className="font-semibold text-neutral-700">{date}</h3>
                <div className="flex gap-2 flex-wrap mt-2">
                  {['Morning', 'Afternoon', 'Evening'].map((slot) => (
                    <button
                      key={slot}
                      onClick={() => handleTimeToggle(date, slot)}
                      className={`px-3 py-1 border rounded transition ${
                        selectedTimes[date]?.includes(slot)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-neutral-800 border-neutral-300'
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
              className="mt-6 mx-auto bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition block text-center"
            >
              {submitting ? 'Submitting...' : 'Submit Availability'}
            </button>
          </>
        )}

        {!editingMode && (
          <div className="mt-6 text-sm text-neutral-600">
            <span>Want to update your availability?</span>
            <div className="flex items-center gap-2 mt-2">
              <select
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="p-2 border border-neutral-300 rounded"
              >
                <option value="">Select your name</option>
                {existingNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button
                onClick={handleChangeAvailability}
                className="text-blue-600 hover:text-blue-800"
              >
                Change
              </button>
            </div>
          </div>
        )}

        {editingMode && (
          <>
            <h3 className="text-lg font-medium mb-2 mt-6 text-neutral-700">Change Your Availability</h3>
            {renderDatePicker()}

            {selectedDates.map((date) => (
              <div key={date} className="bg-neutral-100 p-4 my-3 rounded-lg shadow-sm">
                <h3 className="font-semibold text-neutral-700">{date}</h3>
                <div className="flex gap-2 flex-wrap mt-2">
                  {['Morning', 'Afternoon', 'Evening'].map((slot) => (
                    <button
                      key={slot}
                      onClick={() => handleTimeToggle(date, slot)}
                      className={`px-3 py-1 border rounded transition ${
                        selectedTimes[date]?.includes(slot)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-neutral-800 border-neutral-300'
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
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              {submitting ? 'Submitting...' : 'Submit Updated Availability'}
            </button>
          </>
        )}

        <a
          href={`/poll/${id}/results`}
          className="mt-6 inline-block text-sm underline text-blue-600 hover:text-blue-800"
        >
          View Group Availability
        </a>
      </div>
    </div>
  );
}
