import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import Session from "../models/Session.js";

class QueueService {
  async getQueueState() {
    try {
      const session = await Session.getOrCreate();
      const patients = await Patient.find({
        status: { $in: ["waiting", "serving"] }
      }).sort("token");

      return {
        session: {
          currentToken: session.currentToken || 0,
          avgConsultTime: session.avgConsultTime || 5,
          totalServed: session.totalServed || 0
        },
        patients: patients.map(p => ({
          _id: p._id,
          token: p.token,
          name: p.name,
          phone: p.phone || "",
          status: p.status,
          createdAt: p.createdAt
        }))
      };
    } catch (error) {
      console.error("Error getting queue state:", error);
      throw error;
    }
  }

  async addPatient(patientData) {
    try {
      console.log("📝 Adding patient with data:", patientData);

    if (patientData.phone && patientData.phone.trim()) {
      const phoneNumber = patientData.phone.trim();
      const existingPatient = await Patient.findOne({
        phone: phoneNumber,
        status: { $in: ["waiting", "serving"] }
      });
      
      if (existingPatient) {
        throw new Error(
          `Phone ${phoneNumber} is already in queue (Token #${existingPatient.token})`
        );
      }
    }

      const token = await Patient.getNextToken();
      console.log(`✅ Got token: ${token}`);

      const exists = await Patient.tokenExists(token);
      if (exists) {
        throw new Error(`Token ${token} already exists. Please try again.`);
      }

      const patient = await Patient.create({
        name: patientData.name,
        phone: patientData.phone || "",
        token: token,
        status: "waiting"
      });

      console.log("✅ Patient created:", patient);
      return patient;
    } catch (error) {
      console.error("❌ Error adding patient:", error);
      throw error;
    }
  }

  async callNext() {
    try {
      console.log("📞 Calling next patient...");

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const sessionDoc = await Session.getOrCreate();

        const servingPatient = await Patient.findOne({ status: "serving" }).session(session);
        if (servingPatient) {
          servingPatient.status = "done";
          servingPatient.servedAt = new Date();
          await servingPatient.save({ session });
          sessionDoc.totalServed += 1;
        }

        const nextPatient = await Patient.findOneAndUpdate(
          { status: "waiting" },
          { status: "serving" },
          {
            sort: { token: 1 },
            new: true,
            session: session
          }
        );

        if (!nextPatient) {
          await sessionDoc.save({ session });
          await session.commitTransaction();
          return { currentToken: null, patient: null };
        }

        sessionDoc.currentToken = nextPatient.token;
        sessionDoc.updatedAt = new Date();
        await sessionDoc.save({ session });

        await session.commitTransaction();
        console.log(`✅ Now serving: #${nextPatient.token} - ${nextPatient.name}`);
        return { currentToken: nextPatient.token, patient: nextPatient };
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error("❌ Error calling next:", error);
      throw error;
    }
  }

  async resetQueue() {
    try {
      console.log("🔄 Resetting queue...");

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const result = await Patient.deleteMany({}, { session });
        console.log(`✅ Deleted ${result.deletedCount} patients`);

        const sessionDoc = await Session.reset();

        await session.commitTransaction();
        console.log("✅ Queue reset successfully");
        return sessionDoc;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error("❌ Error resetting queue:", error);
      throw error;
    }
  }

  async getWaitingTime(token, avgConsultTime) {
    try {
      const waitingPatients = await Patient.find({
        status: "waiting",
        token: { $lt: parseInt(token) }
      }).countDocuments();

      return waitingPatients * avgConsultTime;
    } catch (error) {
      console.error("Error getting wait time:", error);
      throw error;
    }
  }
}

export default new QueueService();