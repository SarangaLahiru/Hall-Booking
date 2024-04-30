import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { firestore } from "./firebase"; // Import Firestore instance
import Swal from "sweetalert2";


function App() {
  const [halls, setHalls] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    name: "",
    email: "",
    date: "",
    time: "",
    duration: "",
    purpose: ""
  });

  useEffect(() => {
    const unsubscribeHalls = onSnapshot(collection(firestore, "halls"), snapshot => {
      const hallsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHalls(hallsData);
      setLoading(false); // Data fetching is complete
    });

    const unsubscribeBookings = onSnapshot(collection(firestore, "bookings"), snapshot => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(bookingsData);
    });

    return () => {
      unsubscribeHalls();
      unsubscribeBookings();
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    // Convert duration to milliseconds
    const durationInMilliseconds = parseInt(bookingData.duration) * 60 * 60 * 1000;

    // Combine date and time into a single datetime string
    const dateTime = new Date(bookingData.date + 'T' + bookingData.time);
    const endTime = new Date(dateTime.getTime() + durationInMilliseconds);

    // Check if the selected time slot is available
    const isTimeSlotAvailable = !bookings.some(booking => {
      const bookingStartTime = new Date(booking.dateTime);
      const bookingEndTime = new Date(bookingStartTime.getTime() + parseInt(booking.duration) * 60 * 60 * 1000);
      return (
        (dateTime >= bookingStartTime && dateTime < bookingEndTime) ||
        (endTime > bookingStartTime && endTime <= bookingEndTime) ||
        (dateTime <= bookingStartTime && endTime >= bookingEndTime)
      );
    });

    if (!isTimeSlotAvailable) {
      console.error("Selected time slot is already booked.");
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "selected time slot is already booked",
        
      });
      return;
    }

    try {
      const docRef = await addDoc(collection(firestore, "bookings"), {
        hallId: '1', // Assuming there's only one hall
        name: bookingData.name,
        email: bookingData.email,
        dateTime: dateTime.toISOString(), // Save datetime in ISO string format
        duration: bookingData.duration,
        purpose: bookingData.purpose
      });
      console.log("Booking created with ID: ", docRef.id);
      Swal.fire({
        
        icon: "success",
        title: "Booking created Successfully",
        showConfirmButton: false,
        timer: 1500
      });
      // Clear form data after successful booking
      setBookingData({
        name: "",
        email: "",
        date: "",
        time: "",
        duration: "",
        purpose: ""
      });
    } catch (error) {
      const err=error.message
      console.error("Error adding booking: ", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err,
        
      });
    }
  };

  // Function to group bookings into categories for today, yesterday, tomorrow, and the day after tomorrow
  const categorizeBookings = (bookings) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    const categorizedBookings = {
      today: [],
      yesterday: [],
      tomorrow: [],
      dayAfterTomorrow: []
    };

    bookings.forEach(booking => {
      const bookingDate = new Date(booking.dateTime);
      if (bookingDate.toDateString() === today.toDateString()) {
        categorizedBookings.today.push(booking);
      } else if (bookingDate.toDateString() === yesterday.toDateString()) {
        categorizedBookings.yesterday.push(booking);
      } else if (bookingDate.toDateString() === tomorrow.toDateString()) {
        categorizedBookings.tomorrow.push(booking);
      } else if (bookingDate.toDateString() === dayAfterTomorrow.toDateString()) {
        categorizedBookings.dayAfterTomorrow.push(booking);
      }
    });

    return categorizedBookings;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Hall Booking System</h1>
      <h2 className="text-2xl font-bold mb-4">Book the Hall</h2>
      <form onSubmit={handleBookingSubmit} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Name:</label>
            <input type="text" name="name" value={bookingData.name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2" required />
          </div>
          <div>
            <label className="block mb-2">Email:</label>
            <input type="email" name="email" value={bookingData.email} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2" required />
          </div>
          <div>
            <label className="block mb-2">Date:</label>
            <input type="date" name="date" value={bookingData.date} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2" required />
          </div>
          <div>
            <label className="block mb-2">Time:</label>
            <input type="time" name="time" value={bookingData.time} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2" required />
          </div>
          <div>
            <label className="block mb-2">Duration (hours):</label>
            <input type="number" name="duration" value={bookingData.duration} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2" required />
          </div>
          <div>
            <label className="block mb-2">Purpose:</label>
            <input type="text" name="purpose" value={bookingData.purpose} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2" required />
          </div>
        </div>
        <button type="submit" className="mt-4 bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600">Book</button>
      </form>

      <div className="max-w-5xl mx-auto p-8">
  <h2 className="text-2xl font-bold mb-4">Bookings</h2>
  
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    {/* Today */}
    <div className="bg-white shadow-md rounded-md p-6">
      <h3 className="text-lg font-bold mb-2">Today</h3>
      <ul className="list-disc pl-4">
        {categorizeBookings(bookings).today.map(booking => (
          <li key={booking.id} className="mb-2">
            <strong className="text-blue-500">Time:</strong> {new Date(booking.dateTime).toLocaleTimeString()}
            <br />
            <strong className="text-blue-500">Duration:</strong> {booking.duration} hours
            <br />
            <strong className="text-blue-500">Purpose:</strong> {booking.purpose}
          </li>
        ))}
      </ul>
    </div>

    {/* Yesterday */}
    <div className="bg-white shadow-md rounded-md p-6">
      <h3 className="text-lg font-bold mb-2">Yesterday</h3>
      <ul className="list-disc pl-4">
        {categorizeBookings(bookings).yesterday.map(booking => (
          <li key={booking.id} className="mb-2">
            <strong className="text-blue-500">Time:</strong> {new Date(booking.dateTime).toLocaleTimeString()}
            <br />
            <strong className="text-blue-500">Duration:</strong> {booking.duration} hours
            <br />
            <strong className="text-blue-500">Purpose:</strong> {booking.purpose}
          </li>
        ))}
      </ul>
    </div>

    {/* Tomorrow */}
    <div className="bg-white shadow-md rounded-md p-6">
      <h3 className="text-lg font-bold mb-2">Tomorrow</h3>
      <ul className="list-disc pl-4">
        {categorizeBookings(bookings).tomorrow.map(booking => (
          <li key={booking.id} className="mb-2">
            <strong className="text-blue-500">Time:</strong> {new Date(booking.dateTime).toLocaleTimeString()}
            <br />
            <strong className="text-blue-500">Duration:</strong> {booking.duration} hours
            <br />
            <strong className="text-blue-500">Purpose:</strong> {booking.purpose}
          </li>
        ))}
      </ul>
    </div>

    {/* Day After Tomorrow */}
    <div className="bg-white shadow-md rounded-md p-6">
      <h3 className="text-lg font-bold mb-2">Day After Tomorrow</h3>
      <ul className="list-disc pl-4">
        {categorizeBookings(bookings).dayAfterTomorrow.map(booking => (
          <li key={booking.id} className="mb-2">
            <strong className="text-blue-500">Time:</strong> {new Date(booking.dateTime).toLocaleTimeString()}
            <br />
            <strong className="text-blue-500">Duration:</strong> {booking.duration} hours
            <br />
            <strong className="text-blue-500">Purpose:</strong> {booking.purpose}
          </li>
        ))}
      </ul>
    </div>
  </div>
</div>

    </div>
  );
}

export default App;
