const MemoryList = ({ memories }) => {
  if (!memories.length) return <p className="mt-6 text-gray-500">No memories saved yet.</p>;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold">📜 Your Saved Memories</h2>
      <ul className="mt-3 space-y-3">
        {memories.map((mem) => (
          <li key={mem._id} className="p-3 border rounded bg-white shadow-sm">
            <div><strong>You:</strong> {mem.message}</div>
            <div><strong>AI:</strong> {mem.reply}</div>
            <div className="text-sm text-gray-500 mt-1">
              {new Date(mem.date).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MemoryList;
