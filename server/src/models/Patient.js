import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  token: {
    type: Number,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    default: "",
    trim: true,
    match: [/^([0-9]{10})?$/, 'Phone must be 10 digits or empty']
  },
  status: {
    type: String,
    enum: ["waiting", "serving", "done"],
    default: "waiting",
    index: true
  },
  servedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

patientSchema.index({ status: 1, token: 1 });

patientSchema.statics.getNextToken = async function() {
  const Session = mongoose.model('Session');
  
  const session = await Session.findOneAndUpdate(
    {},
    { $inc: { lastToken: 1 } },
    { 
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
  
  return session.lastToken;
};


patientSchema.statics.tokenExists = async function(token) {
  const count = await this.countDocuments({ token });
  return count > 0;
};

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;