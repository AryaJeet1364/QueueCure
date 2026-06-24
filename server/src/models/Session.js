import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  currentToken: {
    type: Number,
    default: 0
  },
  lastToken: {
    type: Number,
    default: 0
  },
  avgConsultTime: {
    type: Number,
    default: 5,
    min: 1,
    max: 120
  },
  totalServed: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

sessionSchema.statics.getOrCreate = async function() {
  let session = await this.findOne();
  if (!session) {
    session = await this.create({});
  }
  return session;
};

// Reset session (for end of day)
sessionSchema.statics.reset = async function() {
  const session = await this.findOneAndUpdate(
    {},
    { 
      currentToken: 0,
      lastToken: 0,
      totalServed: 0,
      updatedAt: new Date()
    },
    { new: true, upsert: true }
  );
  return session;
};

const Session = mongoose.model("Session", sessionSchema);
export default Session;