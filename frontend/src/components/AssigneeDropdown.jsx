import { useState } from "react";

// İsim ve soyisimden baş harfleri alıp daire içinde gösterir
function InitialsCircle({ firstName, lastName }) {
  const initials =
    (firstName?.[0] || "").toUpperCase() + (lastName?.[0] || "").toUpperCase();

  return (
    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-200 text-gray-700 text-sm font-semibold">
      {initials}
    </div>
  );
}

export default function AssigneeDropdown({
  taskAssignees, // Görevde mevcut atanmış kişiler
  newSubTask, // Yeni alt görev bilgisi
  setNewSubTask, // Alt görev durumunu güncellemek için
}) {
  // Dropdown açık/kapalı durumu
  const [open, setOpen] = useState(false);

  // Seçili kişiyi bul
  const selected = taskAssignees.find((p) => p.id === newSubTask.assignedToId);

  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Atanacak Kişi
      </label>

      {/* Ana dropdown butonu */}
      <button
        type="button"
        onClick={() => taskAssignees.length > 0 && setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm hover:border-blue-400 transition"
      >
        {/* Seçili kişi varsa göster */}
        {selected ? (
          <div className="flex items-center gap-3">
            <InitialsCircle
              firstName={selected.firstName}
              lastName={selected.lastName}
            />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">
                {selected.firstName} {selected.lastName}
              </p>
              {selected.position && (
                <p className="text-xs text-gray-500">{selected.position}</p>
              )}
            </div>
          </div>
        ) : (
          // Seçili kişi yoksa placeholder göster
          <span className="text-gray-500 text-sm">
            {taskAssignees.length > 0
              ? "Atanan kişi seçin"
              : "Ana görevde atama yapılmamış"}
          </span>
        )}

        {/* Ok ikonu */}
        <svg
          className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Kişi listesi (açık olduğunda) */}
      {open && taskAssignees.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          {taskAssignees.map((person) => (
            <div
              key={person.id}
              onClick={() => {
                // Seçilen kişiyi alt göreve ata
                setNewSubTask((prev) => ({ ...prev, assignedToId: person.id }));
                setOpen(false); // Dropdown'ı kapat
              }}
              className="px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
            >
              <InitialsCircle
                firstName={person.firstName}
                lastName={person.lastName}
              />
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {person.firstName} {person.lastName}
                </p>
                {person.position && (
                  <p className="text-gray-500 text-xs">{person.position}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
