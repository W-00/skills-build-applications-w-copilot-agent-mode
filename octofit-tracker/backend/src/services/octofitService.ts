import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw httpError(400, 'Activity payload is required');
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (typeof type !== 'string' || type.trim().length === 0 || minutes === undefined || minutes === null) {
    throw httpError(400, 'Activity requires userId, teamId, type, and minutes');
  }
  if (userId === undefined || userId === null || teamId === undefined || teamId === null) {
    throw httpError(400, 'Activity requires userId and teamId');
  }
  if (!mongoose.isValidObjectId(String(userId)) || !mongoose.isValidObjectId(String(teamId))) {
    throw httpError(400, 'Activity userId and teamId must be valid IDs');
  }

  const numericMinutes = Number(minutes);
  if (!Number.isFinite(numericMinutes)) {
    throw httpError(400, 'Activity minutes must be a number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);
  if (!user || !team) {
    throw httpError(404, 'Activity user and team must exist');
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes: numericMinutes,
    points: Math.max(1, Math.round(numericMinutes)),
    occurredAt: new Date(),
  });

  return activity;
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  throw Object.assign(new Error('Team validation is not implemented yet'), { status: 501 });
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
