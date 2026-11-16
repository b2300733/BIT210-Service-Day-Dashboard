require('dotenv').config();
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { pool } = require('./db');

const mongoUri = process.env.MONGODB_URI || process.env.MongoDB_Host;
if (!mongoUri) throw new Error('MONGODB_URI or MongoDB_Host is required for migration.');

const asDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const asDateOnly = (value) => {
  const date = asDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
};

const asTime = (value) => {
  if (!value) return null;
  const text = String(value);
  return text.length >= 5 ? text.slice(0, 5) : null;
};

const run = async () => {
  const mongo = new MongoClient(mongoUri);
  await mongo.connect();
  const databaseName = new URL(mongoUri).pathname.replace('/', '') || undefined;
  const database = mongo.db(databaseName);
  const connection = await pool.getConnection();
  const ids = new Map();

  try {
    await connection.beginTransaction();
    const users = await database.collection('users').find().toArray();
    const activities = await database.collection('activities').find().toArray();
    const registrations = await database.collection('registrations').find().toArray();
    const reminders = await database.collection('reminders').find().toArray();

    for (const user of users) {
      const id = crypto.randomUUID();
      ids.set(`user:${user._id}`, id);
      await connection.execute(
        `INSERT IGNORE INTO users (id, name, email, password_hash, department, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`,
        [id, user.name, user.email?.toLowerCase(), user.passwordHash, user.department, user.role || 'employee', asDate(user.createdAt), asDate(user.updatedAt)],
      );
    }

    for (const activity of activities) {
      const id = crypto.randomUUID();
      ids.set(`activity:${activity._id}`, id);
      await connection.execute(
        `INSERT IGNORE INTO activities
         (id, name, service_type, schedule_date, schedule_time, location, registered, total_slots, cutoff_date, cutoff_time, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`,
        [
          id,
          activity.name,
          activity.serviceType,
          activity.scheduleDate,
          activity.scheduleTime,
          activity.location,
          activity.registered || 0,
          activity.totalSlots,
          activity.cutoffDate,
          activity.cutoffTime,
          activity.description,
          asDate(activity.createdAt),
          asDate(activity.updatedAt),
        ],
      );
    }

    for (const registration of registrations) {
      const employeeId = ids.get(`user:${registration.employeeId}`);
      const activityId = ids.get(`activity:${registration.activityId}`);
      if (!employeeId || !activityId) continue;
      await connection.execute(
        `INSERT IGNORE INTO registrations
         (id, employee_id, activity_id, qr_data, qr_generated_at, qr_checked, checked_in_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`,
        [
          crypto.randomUUID(),
          employeeId,
          activityId,
          registration.qrData || null,
          asDate(registration.qrGeneratedAt),
          Boolean(registration.qrchecked),
          asDate(registration.checkedInAt),
          asDate(registration.createdAt),
          asDate(registration.updatedAt),
        ],
      );
    }

    for (const reminder of reminders) {
      await connection.execute(
        `INSERT IGNORE INTO reminders
         (id, activity, type, scheduled_for, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`,
        [
          crypto.randomUUID(),
          reminder.activity,
          reminder.type,
          reminder.scheduledFor,
          reminder.status || 'pending',
          asDate(reminder.createdAt),
          asDate(reminder.updatedAt),
        ],
      );
    }

    await connection.commit();
    console.log(`Migrated ${users.length} users, ${activities.length} activities, ${registrations.length} registrations and ${reminders.length} reminders.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
    await mongo.close();
  }
};

run().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});
