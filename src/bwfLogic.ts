import { CourtSide, GameMode } from './types';

export const winIdx = (a: number, b: number, ws: number, p2: boolean): number => {
  if (a >= 30) return 0;
  if (b >= 30) return 1;
  if (p2) {
    if (a >= ws && a - b >= 2) return 0;
    if (b >= ws && b - a >= 2) return 1;
  } else {
    if (a >= ws) return 0;
    if (b >= ws) return 1;
  }
  return -1;
};

export const getCourtForScore = (score: number): CourtSide => (score % 2 === 0 ? 'R' : 'L');

export interface NextRallyResult {
  nextServingSide: number;
  nextServer: number;
  nextReceiver: number;
  nextCourtPositions: Record<number, CourtSide>;
}

export function calcNextRallyState(
  mode: GameMode,
  scoringSide: number,
  prevServingSide: number,
  scoreA: number,
  scoreB: number,
  prevServer: number,
  prevReceiver: number,
  courtPositions: Record<number, CourtSide>,
): NextRallyResult {
  if (mode === 'Singles') {
    const nextServingSide = scoringSide;
    const nextServer = scoringSide;
    const nextReceiver = 1 - scoringSide;
    const nextCourtPositions: Record<number, CourtSide> = {
      0: getCourtForScore(scoreA),
      1: getCourtForScore(scoreB),
      2: 'R',
      3: 'L',
    };
    return {
      nextServingSide,
      nextServer,
      nextReceiver,
      nextCourtPositions,
    };
  }

  // Doubles BWF Law 11 logic
  const nextCourtPositions: Record<number, CourtSide> = { ...courtPositions };
  let nextServingSide = prevServingSide;
  let nextServer = prevServer;
  let nextReceiver = prevReceiver;

  if (scoringSide === prevServingSide) {
    // Case A: Serving side won the rally! (BWF Law 11.3.1)
    // The serving side scores a point. The server serves again from the alternate service court.
    // The players of the serving side change service courts (swap courts).
    // The receiving side players remain in their same service courts (Law 11.1.5).
    const p1 = scoringSide === 0 ? 0 : 2;
    const p2 = scoringSide === 0 ? 1 : 3;
    const temp = nextCourtPositions[p1];
    nextCourtPositions[p1] = nextCourtPositions[p2];
    nextCourtPositions[p2] = temp;

    nextServingSide = scoringSide;
    // Same server continues:
    nextServer = prevServer;
    const serverCourt = nextCourtPositions[nextServer];

    // Receiver is the player in the diagonally opposite service court (matching court letter R or L):
    const oppP1 = scoringSide === 0 ? 2 : 0;
    const oppP2 = scoringSide === 0 ? 3 : 1;
    nextReceiver = nextCourtPositions[oppP1] === serverCourt ? oppP1 : oppP2;
  } else {
    // Case B: Receiving side won the rally (Service Over / Side-out)! (BWF Law 11.3.2)
    // The receiving side scores a point and becomes the new serving side.
    // Law 11.1.5: Neither side changes their service courts!
    nextServingSide = scoringSide;
    const newServingScore = scoringSide === 0 ? scoreA : scoreB;
    const neededCourt = getCourtForScore(newServingScore);

    // Whichever player of the new serving side is in neededCourt becomes the server:
    const newP1 = nextServingSide === 0 ? 0 : 2;
    const newP2 = nextServingSide === 0 ? 1 : 3;
    nextServer = nextCourtPositions[newP1] === neededCourt ? newP1 : newP2;

    // Receiver is diagonally opposite (in neededCourt on the opponent side):
    const oppP1 = nextServingSide === 0 ? 2 : 0;
    const oppP2 = nextServingSide === 0 ? 3 : 1;
    nextReceiver = nextCourtPositions[oppP1] === neededCourt ? oppP1 : oppP2;
  }

  return {
    nextServingSide,
    nextServer,
    nextReceiver,
    nextCourtPositions,
  };
}

export function initializeDoublesCourts(
  srvTeam: number,
  srvPlayer: number,
  recvPlayer: number,
): {
  courtPositions: Record<number, CourtSide>;
  servingSide: number;
  currentServer: number;
  currentReceiver: number;
} {
  const srvPartner = srvPlayer === 0 ? 1 : srvPlayer === 1 ? 0 : srvPlayer === 2 ? 3 : 2;
  const recvPartner = recvPlayer === 0 ? 1 : recvPlayer === 1 ? 0 : recvPlayer === 2 ? 3 : 2;

  // At 0-0: server is in Right court ('R'), partner in Left court ('L')
  // Receiver is diagonally opposite in Right court ('R'), partner in Left court ('L')
  const courtPositions: Record<number, CourtSide> = {
    [srvPlayer]: 'R',
    [srvPartner]: 'L',
    [recvPlayer]: 'R',
    [recvPartner]: 'L',
  };

  return {
    courtPositions,
    servingSide: srvTeam,
    currentServer: srvPlayer,
    currentReceiver: recvPlayer,
  };
}
