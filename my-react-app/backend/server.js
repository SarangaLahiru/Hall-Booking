const express = require('express');
const { collection, onSnapshot, addDoc } = require('firebase/firestore');
const { firestore } = require('../firebase'); // Import Firestore instance
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());

// Endpoint to fetch halls data
app.get('/api/halls', async (req, res) => {
  try {
    const hallsSnapshot = await onSnapshot(collection(firestore, 'halls'));
    const hallsData = hallsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(hallsData);
  } catch (error) {
    console.error('Error fetching halls data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to create a new booking
app.post('/api/bookings', async (req, res) => {
  const { name, email, date, time, duration, purpose } = req.body;

  // Validate input data
  if (!name || !email || !date || !time || !duration || !purpose) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Convert duration to milliseconds
    const durationInMilliseconds = parseInt(duration) * 60 * 60 * 1000;

    // Combine date and time into a single datetime string
    const dateTime = new Date(date + 'T' + time);
    const endTime = new Date(dateTime.getTime() + durationInMilliseconds);

    // Check if the selected time slot is available
    const bookingsSnapshot = await onSnapshot(collection(firestore, 'bookings'));
    const bookingsData = bookingsSnapshot.docs.map(doc => doc.data());
    const isTimeSlotAvailable = !bookingsData.some(booking => {
      const bookingStartTime = new Date(booking.dateTime);
      const bookingEndTime = new Date(bookingStartTime.getTime() + parseInt(booking.duration) * 60 * 60 * 1000);
      return (
        (dateTime >= bookingStartTime && dateTime < bookingEndTime) ||
        (endTime > bookingStartTime && endTime <= bookingEndTime) ||
        (dateTime <= bookingStartTime && endTime >= bookingEndTime)
      );
    });

    if (!isTimeSlotAvailable) {
      return res.status(400).json({ error: 'Selected time slot is already booked' });
    }

    // Add new booking to Firestore
    const docRef = await addDoc(collection(firestore, 'bookings'), {
      hallId: '1', // Assuming there's only one hall
      name,
      email,
      dateTime: dateTime.toISOString(), // Save datetime in ISO string format
      duration,
      purpose
    });

    res.status(201).json({ message: 'Booking created successfully', bookingId: docRef.id });
  } catch (error) {
    console.error('Error adding booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
