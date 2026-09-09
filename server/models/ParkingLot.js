const mongoose = require('mongoose');

const parkingLotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  city: { type: String, default: 'Jaipur' },
  totalSlots: { type: Number, required: true },
  availableSlots: { type: Number },
  pricePerHour: { type: Number, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  amenities: [String],
  image: String,
  isCommunityHost: { type: Boolean, default: false },
  hostDetails: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hostName: { type: String },
    phone: { type: String },
    upiId: { type: String },
    spotType: {
      type: String,
      enum: ['driveway', 'covered_garage', 'gated_society', 'open_lot', 'commercial'],
      default: 'driveway'
    },
    dailyPrice: { type: Number },
    securityFeatures: [String],
    description: { type: String },
    isActive: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ParkingLot', parkingLotSchema);
