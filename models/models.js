const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { Schema, model } = mongoose;

const activitySchema = new Schema({
  type: {
    type: String,
    required: [true, "Activity type is required"],
    unique: true,
    uniqueCaseInsensitive: true,
  },
});
activitySchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already exists.",
});

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    uniqueCaseInsensitive: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    uniqueCaseInsensitive: true,
    match: [/^\S*$/, "Username cannot contain spaces"],
  },
  password: {
    type: String,
    maxlength: [6, `Pin must be 6 characters`],
    minlength: [6, `Pin must be 6 characters`],
    required: true,
  },
  loggedDevices: Array,
  roles: {
    type: Array,
    required: true,
    validate: [
      (value) => value.length > 0,
      "You have to select at least one staff role",
    ],
  },
  contact: {
    tel: String,
    email: String,
  },
});
userSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already exists.",
}); //https://www.npmjs.com/package/mongoose-unique-validator

const scheduleTaskSchema = new Schema({
  activity: { type: Object, required: true },
  date: { type: Date, required: true },
  crew: Object,
  vehicle: Object,
  pickups: Array,
  details: String,
});

const frequentMeetingPointSchema = new Schema({
  name: String,
  frequency: Number,
});

const balanceSchema = new Schema({
  user: {
    name: { type: String, required: true },
    id: { type: String, required: true },
  },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true },
  receiptUrl: { type: String },
});

const vehicleSchema = new Schema({
  plate: {
    type: String,
    required: true,
    unique: true,
    uniqueCaseInsensitive: true,
  },
});
vehicleSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already exists.",
});

const announcementSchema = new Schema({
  body: {
    type: String,
    required: [true, "You cannot publish an empty announcement"],
    minlength: [10, "Announcements must have more than 10 characters"],
  },
  date: { type: Date, default: Date.now },
  critical: { type: Boolean, required: true },
});

module.exports = {
  UserModel: model("user", userSchema),
  ActivityModel: model("activity", activitySchema),
  VehicleModel: model("vehicle", vehicleSchema),
  BalanceModel: model("balance_transaction", balanceSchema),
  AnnouncementModel: model("announcement", announcementSchema),
  ScheduleTaskModel: model("schedule_task", scheduleTaskSchema),
  FrequentMeetingPointModel: model(
    "frequent_meeting_point",
    frequentMeetingPointSchema
  ),
};
