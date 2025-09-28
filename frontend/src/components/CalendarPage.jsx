import React, { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Proje ve görevlerin takvim görünümü
export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sayfa yüklendiğinde görevleri getir
  useEffect(() => {
    fetchTasks();
  }, []);

  // Görevleri backend'den al
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/tasks", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Görevler yüklenemedi");
      }

      const data = await response.json();
      const mapped = data.map((task) => ({
        id: task.id,
        title: task.title,
        date: task.endDate,
        done: task.status === "DONE" || task.status === "COMPLETED",
      }));
      setEvents(mapped);
      setError(null);
    } catch (error) {
      console.error("API hatası:", error);
      setError(error.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Ayın günlerini hesapla
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);

    // Pazartesi başlangıcı için ayarlama
    let startingDayOfWeek = firstDay.getDay();
    startingDayOfWeek = (startingDayOfWeek + 6) % 7;

    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Önceki aydan boş günler
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // Belirli bir günün etkinliklerini getir
  const getEventsForDate = (day) => {
    if (!day) return [];

    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return events.filter((event) => {
      if (!event.date) return false;
      const eventDate = event.date.split("T")[0];
      return eventDate === dateStr;
    });
  };

  // Ay değiştirme
  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const monthNames = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  // Loading durumu
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mb-4 mx-auto"></div>
          <p className="text-gray-500">Takvim yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Sayfa başlığı */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Proje ve Görev Takvimi
          </h1>
        </div>

        {/* Hata mesajı */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">Hata: {error}</p>
            <button
              onClick={fetchTasks}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* Ay navigasyonu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>

            <button
              onClick={() => navigateMonth(1)}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Takvim Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Gün başlıkları */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Günler */}
          <div className="grid grid-cols-7">
            {getDaysInMonth(currentDate).map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isToday =
                day &&
                currentDate.getFullYear() === new Date().getFullYear() &&
                currentDate.getMonth() === new Date().getMonth() &&
                day === new Date().getDate();

              return (
                <div
                  key={index}
                  className={`min-h-32 p-3 border-r border-b border-gray-200 last:border-r-0 transition-colors ${
                    day
                      ? "bg-white hover:bg-gray-50 cursor-pointer"
                      : "bg-gray-50"
                  } ${isToday ? "bg-blue-50 border-blue-200" : ""}`}
                  onClick={() => day && setSelectedDate(day)}
                >
                  {day && (
                    <>
                      {/* Gün numarası */}
                      <div
                        className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
                          isToday ? "text-blue-600" : "text-gray-700"
                        }`}
                      >
                        {day}
                        {isToday && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>

                      {/* Etkinlikler */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-2 rounded-lg flex items-center gap-1 transition-colors ${
                              event.done
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                            }`}
                          >
                            {event.done ? (
                              <CheckCircle className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <Clock className="w-3 h-3 flex-shrink-0" />
                            )}
                            <span className="truncate">{event.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{dayEvents.length - 3} daha
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bekleyen Görevler</p>
                <p className="text-2xl font-bold text-gray-900">
                  {events.filter((e) => !e.done).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Görev</p>
                <p className="text-2xl font-bold text-gray-900">
                  {events.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seçili gün detayları */}
        {selectedDate && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {selectedDate} {monthNames[currentDate.getMonth()]} - Görevler
            </h3>
            <div className="space-y-3">
              {getEventsForDate(selectedDate).length > 0 ? (
                getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border flex items-center gap-3 ${
                      event.done
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    {event.done ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium text-gray-800">
                      {event.title}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Bu günde görev bulunmuyor
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
