export type EventStatusType = 'upcoming' | 'live' | 'completed';

export interface EventStatusInfo {
  status: EventStatusType;
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeTextColor: string;
  isJoinable: boolean;
  actionText: string;
  isResultAvailable: boolean;
  resultActionText: string;
}

/**
 * Calculates event lifecycle status strictly based on event_start_date, event_end_date, and result_published.
 */
export const getEventStatusInfo = (
  startDateStr?: string | null,
  endDateStr?: string | null,
  resultPublished?: any
): EventStatusInfo => {
  const isPublished =
    resultPublished === 1 ||
    resultPublished === true ||
    resultPublished === '1' ||
    resultPublished === 'true';

  const isExplicitlyUnpublished =
    resultPublished === 0 ||
    resultPublished === false ||
    resultPublished === '0' ||
    resultPublished === 'false';

  if (!startDateStr || startDateStr.trim() === '') {
    return {
      status: 'upcoming',
      label: 'UPCOMING',
      badgeBg: '#10B981',
      badgeBorder: '#059669',
      badgeTextColor: '#FFFFFF',
      isJoinable: true,
      actionText: 'Join',
      isResultAvailable: false,
      resultActionText: 'Result Coming Soon',
    };
  }

  const now = new Date();

  // Parse start date (e.g., "2026-09-10 09:00:00" or "2026-09-10")
  const start = new Date(startDateStr.replace(/-/g, '/'));
  if (isNaN(start.getTime())) {
    return {
      status: 'upcoming',
      label: 'UPCOMING',
      badgeBg: '#10B981',
      badgeBorder: '#059669',
      badgeTextColor: '#FFFFFF',
      isJoinable: true,
      actionText: 'Join',
      isResultAvailable: false,
      resultActionText: 'Result Coming Soon',
    };
  }

  // Parse end date or default to end of start date
  let end: Date;
  if (endDateStr && endDateStr.trim() !== '') {
    end = new Date(endDateStr.replace(/-/g, '/'));
    if (isNaN(end.getTime())) {
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    }
  } else {
    end = new Date(start);
    end.setHours(23, 59, 59, 999);
  }

  if (now < start) {
    return {
      status: 'upcoming',
      label: 'UPCOMING',
      badgeBg: '#10B981',
      badgeBorder: '#059669',
      badgeTextColor: '#FFFFFF',
      isJoinable: true,
      actionText: 'Join',
      isResultAvailable: false,
      resultActionText: 'Result Coming Soon',
    };
  } else if (now >= start && now <= end) {
    const isResultReady = isPublished;
    return {
      status: 'live',
      label: 'LIVE 🟢',
      badgeBg: 'rgba(255, 122, 0, 0.15)',
      badgeBorder: '#FF7A00',
      badgeTextColor: '#FF7A00',
      isJoinable: false,
      actionText: 'Registration Closed',
      isResultAvailable: isResultReady,
      resultActionText: isResultReady ? 'View Results' : 'Results Pending',
    };
  } else {
    const isResultReady = !isExplicitlyUnpublished;
    return {
      status: 'completed',
      label: 'Completed',
      badgeBg: 'rgba(156, 163, 175, 0.15)',
      badgeBorder: '#6B7280',
      badgeTextColor: '#9CA3AF',
      isJoinable: false,
      actionText: 'Event Completed',
      isResultAvailable: isResultReady,
      resultActionText: isResultReady ? 'View Results' : 'Results Pending',
    };
  }
};

export const isEventJoinable = (event: any): boolean => {
  if (!event) return false;
  const info = getEventStatusInfo(event.event_start_date, event.event_end_date, event.result_published);
  return info.isJoinable;
};

export const isEventResultAvailable = (event: any): boolean => {
  if (!event) return false;
  const info = getEventStatusInfo(event.event_start_date, event.event_end_date, event.result_published);
  return info.isResultAvailable;
};

/**
 * Sorts event array by strict priority:
 * Priority 1: Upcoming (nearest start date first)
 * Priority 2: Live (start date ascending)
 * Priority 3: Completed (most recently completed first)
 */
export const sortEvents = <T extends { event_start_date?: string | null; event_end_date?: string | null }>(
  events: T[]
): T[] => {
  if (!events || events.length === 0) return [];

  const upcoming: T[] = [];
  const live: T[] = [];
  const completed: T[] = [];

  events.forEach((item) => {
    const info = getEventStatusInfo(item.event_start_date, item.event_end_date);
    if (info.status === 'upcoming') {
      upcoming.push(item);
    } else if (info.status === 'live') {
      live.push(item);
    } else {
      completed.push(item);
    }
  });

  // Priority 1: Upcoming sorted by nearest start date ascending
  upcoming.sort((a, b) => {
    const dA = a.event_start_date ? new Date(a.event_start_date.replace(/-/g, '/')).getTime() : 0;
    const dB = b.event_start_date ? new Date(b.event_start_date.replace(/-/g, '/')).getTime() : 0;
    return dA - dB;
  });

  // Priority 2: Live sorted by start date ascending
  live.sort((a, b) => {
    const dA = a.event_start_date ? new Date(a.event_start_date.replace(/-/g, '/')).getTime() : 0;
    const dB = b.event_start_date ? new Date(b.event_start_date.replace(/-/g, '/')).getTime() : 0;
    return dA - dB;
  });

  // Priority 3: Completed sorted by latest end/start date descending (most recently completed first)
  completed.sort((a, b) => {
    const dA = a.event_end_date
      ? new Date(a.event_end_date.replace(/-/g, '/')).getTime()
      : (a.event_start_date ? new Date(a.event_start_date.replace(/-/g, '/')).getTime() : 0);
    const dB = b.event_end_date
      ? new Date(b.event_end_date.replace(/-/g, '/')).getTime()
      : (b.event_start_date ? new Date(b.event_start_date.replace(/-/g, '/')).getTime() : 0);
    return dB - dA;
  });

  return [...upcoming, ...live, ...completed];
};
