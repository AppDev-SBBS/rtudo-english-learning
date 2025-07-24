'use client';

export default function LearningSettings({ learningLanguage = 'en', dailyGoal = 5, reminderTime = '08:00' }) {
  return (
    <div>
      <p className="font-semibold text-gray-600 mb-2">Learning</p>
      <div className="bg-gray-100 rounded-xl divide-y">
        <SettingItem
          label="🌐 Learning Language"
          value={getLanguageName(learningLanguage)}
        />
        <SettingItem
          label="🎯 Daily Goal"
          value={`${dailyGoal} Lessons`}
        />
        <SettingItem
          label="⏰ Study Reminder"
          value={formatTime(reminderTime)}
        />
      </div>
    </div>
  );
}

function SettingItem({ label, value }) {
  return (
    <div className="flex justify-between items-center px-4 py-3">
      <span className="font-medium">{label}</span>
      <span className="text-gray-500 text-sm">{value}</span>
    </div>
  );
}

function formatTime(time24) {
  if (!time24) return '';
  const [hourStr, minuteStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteStr} ${ampm}`;
}

function getLanguageName(code) {
  const map = {
    en: 'English',
    ta: 'Tamil',
    hi: 'Hindi',
  };
  return map[code] || 'English';
}
