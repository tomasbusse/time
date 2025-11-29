import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Plus, Calendar, List } from 'lucide-react'
import { CircleAction } from '@/components/ui/CircleAction'
import { ListItem } from '@/components/ui/ListItem'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns'
import EventFormModal from './components/EventFormModal'
import { useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export interface CalendarEvent {
  id: string
  title: string
  startTime: number
  endTime: number
  googleEventId?: string
  originalData?: any
}

export default function CalendarApp() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null)

  const codeProcessed = useRef(false);

  const getAuthorizationUrl = useAction(api.calendar.getAuthorizationUrl);
  const getAccessTokenAction = useAction(api.calendar.getAccessToken);
  const refreshAccessTokenAction = useAction(api.calendar.refreshAccessToken);
  const listEventsAction = useAction(api.calendar.listEvents);
  const createEventAction = useAction(api.calendar.createEvent);
  const updateEventAction = useAction(api.calendar.updateEvent);
  const deleteEventAction = useAction(api.calendar.deleteEvent);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // OAuth handling
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && !codeProcessed.current) {
      codeProcessed.current = true;
      handleAuthCode(code);
    }
  }, []);

  const handleAuthCode = async (code: string) => {
    try {
      const tokens = await getAccessTokenAction({ code });
      if (tokens && tokens.access_token) {
        saveTokens(tokens.access_token, tokens.refresh_token || "", tokens.expiry_date);
        window.history.replaceState({}, '', window.location.pathname);
        await fetchGoogleEvents();
      }
    } catch (error) {
      console.error('Failed to get access token:', error);
    }
  };

  const saveTokens = (access: string, refresh: string, expiresAt: number | null | undefined) => {
    const expiry = expiresAt || (Date.now() + 3600 * 1000);
    setAccessToken(access);
    setRefreshToken(refresh);
    setTokenExpiresAt(expiry);
    localStorage.setItem('google_access_token', access);
    localStorage.setItem('google_refresh_token', refresh);
    localStorage.setItem('google_token_expires_at', expiry.toString());
  };

  const refreshTokens = async () => {
    if (!refreshToken) return false;

    try {
      const tokens = await refreshAccessTokenAction({ refreshToken });
      if (tokens) {
        saveTokens(tokens.access_token, tokens.refresh_token || refreshToken, tokens.expiry_date);
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
    return false;
  };

  const fetchGoogleEvents = async () => {
    if (!accessToken) return;

    if (tokenExpiresAt && Date.now() >= tokenExpiresAt) {
      const refreshed = await refreshTokens();
      if (!refreshed) return;
    }

    setIsSyncing(true);
    try {
      const events = await listEventsAction({
        accessToken: accessToken!,
        timeMin: monthStart.toISOString(),
        timeMax: monthEnd.toISOString(),
      });

      const formattedEvents: CalendarEvent[] = events.map((e: any) => ({
        id: e.id,
        title: e.summary || 'Untitled',
        startTime: new Date(e.start.dateTime || e.start.date).getTime(),
        endTime: new Date(e.end.dateTime || e.end.date).getTime(),
        googleEventId: e.id,
        originalData: e,
      }));

      setGoogleEvents(formattedEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const stored = {
      access: localStorage.getItem('google_access_token'),
      refresh: localStorage.getItem('google_refresh_token'),
      expires: localStorage.getItem('google_token_expires_at'),
    };

    if (stored.access && stored.refresh && stored.expires) {
      setAccessToken(stored.access);
      setRefreshToken(stored.refresh);
      setTokenExpiresAt(parseInt(stored.expires));
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchGoogleEvents();
    }
  }, [currentMonth, accessToken]);

  const handleConnect = async () => {
    try {
      const url = await getAuthorizationUrl();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to get authorization URL:', error);
    }
  };

  const handleEventSave = async (event: CalendarEvent) => {
    if (!accessToken) return;

    try {
      if (event.googleEventId) {
        await updateEventAction({
          accessToken,
          eventId: event.googleEventId,
          title: event.title,
          startTime: new Date(event.startTime).toISOString(),
          endTime: new Date(event.endTime).toISOString(),
        });
      } else {
        await createEventAction({
          accessToken,
          title: event.title,
          startTime: new Date(event.startTime).toISOString(),
          endTime: new Date(event.endTime).toISOString(),
        });
      }
      await fetchGoogleEvents();
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleEventDelete = async (event: CalendarEvent) => {
    if (!accessToken || !event.googleEventId) return;

    if (confirm('Delete this event?')) {
      try {
        await deleteEventAction({
          accessToken,
          eventId: event.googleEventId,
        });
        await fetchGoogleEvents();
        setIsEventModalOpen(false);
        setSelectedEvent(null);
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();

  const renderCalendar = () => {
    const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => (
      <div key={`empty-${i}`} className="min-h-[100px] bg-gray-50" />
    ));

    const dayElements = daysInMonth.map((day) => {
      const dayEvents = googleEvents.filter((event) => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === day.toDateString();
      });

      return (
        <div
          key={day.toISOString()}
          onClick={() => {
            setSelectedDate(day);
            setIsEventModalOpen(true);
          }}
          className={`min-h-[100px] border p-2 cursor-pointer hover:bg-gray-50 ${isToday(day) ? 'bg-blue-50' : 'bg-white'
            }`}
        >
          <div className={`font-semibold mb-1 ${isToday(day) ? 'text-blue-600' : ''}`}>
            {format(day, 'd')}
          </div>
          <div className="space-y-1">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                  setIsEventModalOpen(true);
                }}
                className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
              >
                {format(event.startTime, 'HH:mm')} {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    });

    return [...emptyDays, ...dayElements];
  };

  const [mobileViewMode, setMobileViewMode] = useState<'agenda' | 'month'>('agenda');

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="p-8 max-w-md">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Personal Google Calendar</h2>
            <p className="text-gray-600 mb-6">
              Connect your Google Calendar to view and manage your personal events.
            </p>
            <Button onClick={handleConnect} className="w-full">
              Connect Google Calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedEvents = [...googleEvents].sort((a, b) => a.startTime - b.startTime);
  const todayEvents = sortedEvents.filter(e => isToday(new Date(e.startTime)));

  return (
    <div className="min-h-screen bg-custom-off-white pb-24 lg:pb-8">
      {/* Mobile Header & Quick Actions */}
      <div className="lg:hidden px-6 pt-2 pb-6">
        <h1 className="text-2xl font-bold text-dark-blue mb-6">Calendar</h1>

        {/* 2-Column Grid Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <CircleAction
            label="New Event"
            icon={Plus}
            onClick={() => {
              setSelectedEvent(null);
              setSelectedDate(new Date());
              setIsEventModalOpen(true);
            }}
          />
          <CircleAction
            label="Today"
            icon={Calendar}
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDate(new Date());
            }}
          />
          <CircleAction
            label="Agenda"
            icon={List}
            onClick={() => setMobileViewMode('agenda')}
            isActive={mobileViewMode === 'agenda'}
          />
          <CircleAction
            label="Month"
            icon={Calendar}
            onClick={() => setMobileViewMode('month')}
            isActive={mobileViewMode === 'month'}
          />
        </div>
      </div>

      {/* Mobile Content */}
      <div className="lg:hidden px-4">
        {mobileViewMode === 'agenda' && (
          <div className="bg-white rounded-[2rem] p-5 shadow-sm space-y-1">
            <h2 className="text-lg font-bold text-dark-blue mb-3 px-2">Today's Agenda</h2>
            {todayEvents.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No events for today.</p>
            ) : (
              todayEvents.map(event => (
                <ListItem
                  key={event.id}
                  title={event.title}
                  subtitle={`${format(event.startTime, 'HH:mm')} - ${format(event.endTime, 'HH:mm')}`}
                  statusColor="border-blue-400 bg-blue-400"
                  onClick={() => {
                    setSelectedEvent(event);
                    setIsEventModalOpen(true);
                  }}
                />
              ))
            )}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 mb-2 px-2">Upcoming</h3>
              {sortedEvents.filter(e => e.startTime > new Date().setHours(23, 59, 59, 999)).slice(0, 5).map(event => (
                <ListItem
                  key={event.id}
                  title={event.title}
                  subtitle={`${format(event.startTime, 'MMM d, HH:mm')}`}
                  statusColor="border-gray-300"
                  onClick={() => {
                    setSelectedEvent(event);
                    setIsEventModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {mobileViewMode === 'month' && (
          <div className="bg-white rounded-[2rem] p-4 shadow-sm">
            <div className="mb-4 flex justify-between items-center">
              <Button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                variant="ghost"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-bold text-dark-blue">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <Button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                variant="ghost"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-400 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-2">
              {renderCalendar()}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Content (Hidden on Mobile) */}
      <div className="hidden lg:block p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Personal Calendar</h1>
          <div className="flex gap-2">
            <Button
              onClick={fetchGoogleEvents}
              disabled={isSyncing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => {
                setSelectedEvent(null);
                setSelectedDate(new Date());
                setIsEventModalOpen(true);
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <Button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            variant="outline"
            size="sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-4 py-2 text-center font-semibold bg-gray-50">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">{renderCalendar()}</div>
        </div>
      </div>

      {isEventModalOpen && (
        <EventFormModal
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
          onSave={handleEventSave}
          event={selectedEvent}
          selectedDate={selectedDate}
          onDelete={handleEventDelete}
        />
      )}
    </div>
  );
}
