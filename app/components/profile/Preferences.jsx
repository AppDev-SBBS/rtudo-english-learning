export default function Preferences() {
  return (
    <div>
      <p className="font-semibold text-gray-600 mb-2">Preferences</p>
      <div className="bg-gray-100 p-4 rounded-xl flex justify-between items-center">
        <p className="font-medium">🌙 Dark Mode</p>
        <input type="checkbox" className="toggle toggle-sm" />
      </div>
    </div>
  );
}
