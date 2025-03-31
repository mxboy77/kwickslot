import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker-custom.css';

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
  const [availabilitySummary, setAvailabilitySummary] = useState({});

  useEffect(() => {
    const fetchPoll = async () => {
      const ref = doc(db, 'polls', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const now = new Date();
        if (data.expiresAt && data.expiresAt.toDate() < now) {
          setPoll({ error: 'This poll has expired.' });
          return;
        }
        setPoll(data);
        const existingResponses = data.responses || [];
        setExistingNames(existingResponses.map((r) => r.name));

        const summary = {};
        existingResponses.forEach(({ availability }) => {
          (availability || []).forEach(({ date }) => {
            summary[date] = (summary[date] || 0) + 1;
          });
        });
        setAvailabilitySummary(summary);
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

      const now = new Date();
      if (data.expiresAt && data.expiresAt.toDate() < now) {
        alert('This poll has expired.');
        return;
      }

      const existing = data.responses || [];
      if (existing.length >= 50 && !existing.some(r => r.name === name.trim())) {
        alert("This poll has reached the maximum number of responses.");
        return;
      }

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

  const normalizeDate = (dateStr) => {
    const parts = dateStr.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const renderDatePicker = () => (
    <>
      <div className="flex gap-2 mb-2 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-200"></span> 1-2 people
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-400"></span> 3-4 people
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-600"></span> 5+ people
        </span>
      </div>
      <DatePicker
        inline
        selected={null}
        onChange={handleDateSelect}
        highlightDates={[
          {
            'react-datepicker__day--highlighted-green': selectedDates.map(normalizeDate),
          },
        ]}
        dayClassName={(date) => {
          const dateStr = date.toISOString().split('T')[0];
          const count = availabilitySummary[dateStr] || 0;
          if (selectedDates.includes(dateStr)) {
            return 'react-datepicker__day--highlighted-green';
          }
          if (count >= 5) return 'hinted--dark';
          if (count >= 3) return 'hinted--medium';
          if (count >= 1) return 'hinted--light';
          return undefined;
        }}
        renderDayContents={(day, date) => {
          const dateStr = date.toISOString().split('T')[0];
          const count = availabilitySummary[dateStr];
          return (
            <div title={selectedDates.includes(dateStr) ? 'You selected this day' : count ? `${count} people available` : ''}>
              {day}
              {count && <span className="text-xs ml-1 text-green-600 font-medium">({count})</span>}
            </div>
          );
        }}
      />
    </>
  );

  if (poll?.error) {
    return <div className="p-4 text-red-500 font-medium">{poll.error}</div>;
  }

  if (!poll) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-50 p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow border border-neutral-200">
        <h1 className="text-3xl font-semibold text-neutral-800 mb-1">{poll?.name}</h1>
        {poll?.expiresAt && (
          <p className="text-sm text-neutral-500 mb-4">
            Poll closes in {Math.ceil((poll.expiresAt.toDate() - Date.now()) / (1000 * 60 * 60 * 24))} day(s)
          </p>
        )}

        <div className="flex gap-4 mb-6">
          <a href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            New Poll
          </a>
          <button
            onClick={handleCopy}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {copied ? 'Link Copied!' : 'Share Poll'}
          </button>
          <a
            href={`/poll/${id}/results`}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View Group Availability
          </a>
        </div>

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
      </div>
    </div>
  );
}
