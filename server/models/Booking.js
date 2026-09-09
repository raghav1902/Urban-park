const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slotId: { type: mongoose.Schema.Types.Mixed, ref: 'ParkingSlot', required: true },
  lotId: { type: mongoose.Schema.Types.Mixed, ref: 'ParkingLot', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number }, // total hours
  originalDuration: { type: Number }, // initial booked hours
  extendedHours: { type: Number, default: 0 }, // additional extended hours
  totalCost: { type: Number, required: true },
  originalCost: { type: Number }, // initial base cost
  extendedCost: { type: Number, default: 0 }, // extension cost
  qrCode: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'], default: 'pending' },
  vehicleNumber: { type: String },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  overstayHours: { type: Number, default: 0 },
  overstayFee: { type: Number, default: 0 },
  extensionCount: { type: Number, default: 0 },
  reminderSent: { type: Boolean, default: false },
  evCharging: {
    enabled: { type: Boolean, default: false },
    chargerType: { type: String, default: 'Type-2 22kW AC' },
    kwhConsumed: { type: Number, default: 0 },
    chargingCost: { type: Number, default: 0 },
    currentBatteryPct: { type: Number, default: 45 },
    chargingStatus: { type: String, enum: ['idle', 'charging', 'paused', 'completed'], default: 'idle' }
  },
  addOnServices: [
    {
      id: String,
      name: String,
      price: Number,
      status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' }
    }
  ],
  parkingNotes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
