const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');
const Booking = require('../models/Booking');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join-lot', (lotId) => {
      socket.join(`lot-${lotId}`);
      console.log(`Client ${socket.id} joined lot-${lotId}`);
    });

    socket.on('register-user', (userId) => {
      if (userId) {
        socket.join(`user-${userId}`);
        console.log(`👤 Client ${socket.id} registered for user-${userId}`);
      }
    });

    socket.on('leave-lot', (lotId) => {
      socket.leave(`lot-${lotId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  // Simulate IoT sensor data - update random unreserved slots every 5 seconds
  setInterval(async () => {
    try {
      const lots = await ParkingLot.find();
      // Fetch all slots with active or confirmed customer reservations
      const activeBookings = await Booking.find({ status: { $in: ['confirmed', 'active'] } }).select('slotId');
      const protectedSlotIds = new Set(activeBookings.map(b => b.slotId?.toString()));
      
      for (const lot of lots) {
        const slots = await ParkingSlot.find({ lotId: lot._id });
        
        // Randomly change 1-3 slots per lot
        const numChanges = Math.floor(Math.random() * 3) + 1;
        const changedSlots = [];
        
        for (let i = 0; i < numChanges; i++) {
          if (!slots.length) continue;
          const randomSlot = slots[Math.floor(Math.random() * slots.length)];
          // Never modify slots that are reserved, locked, or held by an active/confirmed booking
          if (
            !randomSlot ||
            ['reserved', 'locked'].includes(randomSlot.status) ||
            protectedSlotIds.has(randomSlot._id.toString())
          ) {
            continue;
          }
          
          const newStatus = randomSlot.status === 'available' ? 
            (Math.random() > 0.7 ? 'occupied' : 'available') : 
            (Math.random() > 0.4 ? 'available' : 'occupied');
          
          if (newStatus !== randomSlot.status) {
            await ParkingSlot.findByIdAndUpdate(randomSlot._id, { status: newStatus, updatedAt: new Date() });
            changedSlots.push({ slotId: randomSlot._id, slotNumber: randomSlot.slotNumber, status: newStatus, floor: randomSlot.floor });
          }
        }

        if (changedSlots.length > 0) {
          const available = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'available' });
          const occupied = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'occupied' });
          
          io.to(`lot-${lot._id}`).emit('slot-update', {
            lotId: lot._id,
            changedSlots,
            summary: { available, occupied, total: lot.totalSlots }
          });

          io.emit('lot-occupancy-update', {
            lotId: lot._id,
            available,
            occupied,
            total: lot.totalSlots,
            occupancyPercent: Math.round((occupied / lot.totalSlots) * 100)
          });
        }
      }
    } catch (err) {
      console.error('Socket simulation error:', err.message);
    }
  }, 5000);

  // Background Expiry Watcher: checks every 15 seconds for bookings expiring within 15 minutes
  setInterval(async () => {
    try {
      const now = new Date();
      const fifteenMinsLater = new Date(now.getTime() + 15 * 60 * 1000);

      // Find active or confirmed bookings ending in the next 15 minutes that haven't been alerted
      const expiringBookings = await Booking.find({
        status: { $in: ['confirmed', 'active'] },
        reminderSent: { $ne: true },
        endTime: { $gt: now, $lte: fifteenMinsLater }
      })
        .populate('slotId', 'slotNumber')
        .populate('lotId', 'name');

      for (const booking of expiringBookings) {
        const remainingMinutes = Math.max(1, Math.round((booking.endTime.getTime() - now.getTime()) / 60000));

        // Mark reminderSent as true to avoid duplicate alerts
        booking.reminderSent = true;
        await booking.save();

        const alertPayload = {
          bookingId: booking._id,
          lotName: booking.lotId?.name || 'Parking Facility',
          slotNumber: booking.slotId?.slotNumber || '',
          vehicleNumber: booking.vehicleNumber,
          endTime: booking.endTime,
          remainingMinutes,
          message: `⚠️ Attention: Your parking reservation at ${booking.lotId?.name || 'Facility'} (Slot ${booking.slotId?.slotNumber || ''}) expires in ${remainingMinutes} minute(s)! Extend now to avoid overstay charges.`
        };

        // Emit strictly to user's private socket room (secures PII & vehicle info)
        io.to(`user-${booking.userId}`).emit('booking-expiring-soon', alertPayload);

        console.log(`🔔 Sent 15-min expiry reminder for Booking ${booking._id} to User ${booking.userId}`);
      }
    } catch (err) {
      console.error('Expiry watcher error:', err.message);
    }
  }, 15000);
};

